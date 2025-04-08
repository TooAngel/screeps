'use strict';

/*
 * carry gets energy and brings it to the storage
 *
 * Moves to the 'targetId', picks up energy from container or dropped,
 * move back to storage, on meeting other creeps the energy is transferred,
 * energy is transferred to other structures, too.
 */

roles.carry = {};

roles.carry.buildRoad = true;
roles.carry.flee = true;

// roles.carry.boostActions = ['capacity'];

roles.carry.settings = {
  param: ['energyCapacityAvailable'],
  prefixString: {
    300: '',
    550: 'MW',
    600: 'W',
  },
  layoutString: 'CM',
  amount: config.carry.sizes,
  maxLayoutAmount: 1,
};

roles.carry.updateSettings = function(room, creep) {
  if (creep.helper) {
    return {
      prefixString: config.buildRoad.buildToOtherMyRoom ? 'W' : '',
      layoutString: 'MC',
      amount: {
        0: [3, 3], // RCL 1
        550: [4, 4], // RCL 2
        800: [6, 6], // RCL 3
        1300: [11, 11], // RCL 4
        1800: [15, 15], // RCL 5
        2300: [21, 21], // RCL 6
      },
    };
  }
};

/**
 * checkHelperEmptyStorage
 *
 * @param {object} creep
 * @return {void}
 */
function checkHelperEmptyStorage(creep) {
  // Fix blocked helpers due to empty structure in the room where we get the energy from
  if (creep.room.name === creep.memory.routing.targetRoom) {
    const targetStructure = Game.getObjectById(creep.memory.routing.targetId);
    if (targetStructure === null) {
      creep.suicide();
      return;
    }

    if (targetStructure.structureType === STRUCTURE_STORAGE) {
      creep.say('storage');
      if (targetStructure.store.energy === 0) {
        creep.log('Suiciding the storage I should get the energy from is empty');
        creep.suicide();
      }
    }
  }
}

/**
 * checkForUniversalSpawn
 *
 * @param {object} creep
 */
function checkForUniversalSpawn(creep) {
  const storage = creep.room.storage;
  if (!(storage && storage.my && storage.isActive())) {
    let resourceAtPosition = 0;
    const resources = creep.pos.lookFor(LOOK_RESOURCES);
    for (const resource of resources) {
      resourceAtPosition += resource.amount;
    }
    let amount = creep.room.getUniversalAmount();
    amount += Math.floor(resourceAtPosition / config.carry.callUniversalPerResources);
    creep.room.checkRoleToSpawn('universal', amount);
  }
}

roles.carry.dismantleStructure = function(creep, directions) {
  const posForward = creep.pos.getAdjacentPosition(directions.direction);
  const structures = posForward.lookFor(LOOK_STRUCTURES);
  for (const structure of structures) {
    if (structure.structureType === STRUCTURE_ROAD) {
      continue;
    }
    if (structure.structureType === STRUCTURE_CONTAINER) {
      continue;
    }
    if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
      continue;
    }
    if (structure.structureType === STRUCTURE_SPAWN && structure.my) {
      continue;
    }
    if (structure.structureType === STRUCTURE_STORAGE && structure.my) {
      continue;
    }
    if (structure.structureType === STRUCTURE_LINK && structure.my) {
      continue;
    }

    creep.dismantle(structure);
    creep.say('dismantle');
    break;
  }
};

const validateDirections = function(creep, directions) {
  // TODO When does this happen? (Not on path?) - Handle better
  if (!directions || Object.keys(directions).length === 0) {
    if (creep.memory.routing.pathPos < 0) {
      return false;
    }
    creep.log(`role_carry.preMove - No directions, why? pathPos: ${creep.memory.routing.pathPos}`);
    creep.say('No directions');
    return false;
  }
  return true;
};


const checkCreepForTransfer = function(otherCreep, thisCreep) {
  if (!otherCreep.my) {
    return false;
  }
  // Don't transfer to carries if they didn't reached the end once
  if (otherCreep.memory.role === 'carry' && !otherCreep.data.fullyDeployed) {
    return false;
  }

  // Only transfer to creeps with the same base
  if (otherCreep.memory.base !== thisCreep.memory.base) {
    return false;
  }

  // don't transfer to extractor, fixes full terminal with 80% energy?
  if (otherCreep.memory.role === 'extractor') {
    return false;
  }
  // don't transfer to mineral, fixes full terminal with 80% energy?
  if (otherCreep.memory.role === 'mineral') {
    return false;
  }
  if (!thisCreep.store[RESOURCE_ENERGY] && otherCreep.memory.role === 'sourcer') {
    return false;
  }
  // Do we want this?
  if (otherCreep.memory.role === 'powertransporter') {
    return false;
  }
  if (otherCreep.store.getFreeCapacity() === 0) {
    return false;
  }
  return true;
};

/**
 * transferToCreep
 *
 * @param {object} creep
 * @param {object} direction
 * @return {bool}
 */
function transferToCreep(creep, direction) {
  const adjacentPos = creep.pos.getAdjacentPosition(direction);
  if (!adjacentPos.isValid()) {
    return false;
  }

  const creeps = adjacentPos.lookFor('creep');
  for (const otherCreep of creeps) {
    if (!checkCreepForTransfer(otherCreep, creep)) {
      continue;
    }
    for (const resource of Object.keys(creep.store)) {
      const returnCode = creep.transfer(otherCreep, resource);
      if (returnCode === OK) {
        return creep.store.getUsedCapacity() * 0.5 <= otherCreep.store.getCapacity() - otherCreep.store.getUsedCapacity();
      }
    }
  }
  return false;
}

/**
 * transferToCreeps
 *
 * @param {object} creep
 * @param {object} directions
 */
function transferToCreeps(creep, directions) {
  creep.creepLog('Trying to transfer to creep');
  const transferred = transferToCreep(creep, directions.backwardDirection);
  creep.memory.routing.reverse = !transferred;
}

/**
 * getMoveToStorage
 *
 * @param {object} creep
 * @return {bool}
 */
function getMoveToStorage(creep) {
  let moveToStorage = creep.checkCarryEnergyForBringingBackToStorage();
  const fleeFromSourceKeeper = creep.checkForSourceKeeper();
  moveToStorage = moveToStorage || fleeFromSourceKeeper;
  return moveToStorage;
}

/**
 * findCreepWhichCanTransfer
 *
 * @param {object} creep
 * @param {object} adjacentPos
 * @return {bool}
 */
function findCreepWhichCanTransfer(creep, adjacentPos) {
  const creeps = adjacentPos.lookFor(LOOK_CREEPS);
  for (const otherCreep of creeps) {
    if (!Game.creeps[otherCreep.name] || otherCreep.store.getUsedCapacity() < 50 || otherCreep.memory.recycle) {
      continue;
    }

    if (otherCreep.memory.role === 'carry') {
      if (creep.memory.base !== otherCreep.memory.base) {
        continue;
      }
      if (otherCreep.memory.routing.pathPos < 0) {
        continue;
      }
      return creep.checkCarryEnergyForBringingBackToStorage(otherCreep);
    }
    continue;
  }
  return false;
}

/**
 * checkForTransfer
 *
 * @param {object} creep
 * @param {object} direction
 * @return {bool}
 */
function checkForTransfer(creep, direction) {
  if (!creep.data.fullyDeployed) {
    return false;
  }
  if (!direction) {
    creep.creepLog(`checkForTransfer no direction}`);
    return false;
  }

  const adjacentPos = creep.pos.getAdjacentPosition(direction);

  if (adjacentPos.isBorder(-2)) {
    creep.creepLog(`checkForTransfer isBorder}`);
    return false;
  }

  return findCreepWhichCanTransfer(creep, adjacentPos);
}

/**
 * preMoveNotMoveToStorage
 *
 * @param {object} creep
 * @param {object} directions
 * @return {bool}
 */
function preMoveNotMoveToStorage(creep, directions) {
  creep.creepLog(`preMove not moveToStorage`);
  let moveToStorage = false;
  if (creep.memory.routing.pathPos > 1) {
    // TODO these two methods seems pretty similar, should be unified
    moveToStorage = creep.pickupEnergy();
    moveToStorage = moveToStorage || creep.pickupWhileMoving();
  }
  const energyFromCreep = checkForTransfer(creep, directions.forwardDirection);
  moveToStorage = moveToStorage || energyFromCreep;
  return moveToStorage;
}

/**
 * handlePathPos0
 *
 * @param {object} creep
 * @return {boolean}
 */
function handlePathPos0(creep) {
  creep.drop(RESOURCE_ENERGY);
  checkForUniversalSpawn(creep);
  creep.memory.routing.reverse = false;
  return false;
}

roles.carry.preMove = function(creep, directions) {
  if (!validateDirections(creep, directions)) {
    return false;
  }

  checkHelperEmptyStorage(creep);

  let moveToStorage = getMoveToStorage(creep);
  if (moveToStorage) {
    if (creep.inBase()) {
      const transferred = creep.transferToStructures();
      if (transferred) {
        const energyLeft = creep.carry.energy - transferred.transferred;
        if (energyLeft > 0) { // Better use `checkCarryEnergyForBringingBackToStorage` to be accurate
          if (transferred.moreStructures) {
            return true;
          }
        } else {
          creep.memory.routing.reverse = false;
          return false;
        }
      }

      if (creep.memory.routing.pathPos === 0) {
        return handlePathPos0(creep);
      }
    }

    if (directions.backwardDirection && directions.backwardDirection !== null) {
      transferToCreeps(creep, directions);
      return false;
    }
  } else {
    moveToStorage = preMoveNotMoveToStorage(creep, directions);
  }

  moveToStorage = moveToStorage && creep.memory.routing.pathPos !== 0;

  creep.memory.routing.reverse = moveToStorage;
  if (moveToStorage) {
    directions.direction = directions.backwardDirection;
    creep.data.fullyDeployed = true;
  } else {
    directions.direction = directions.forwardDirection;
  }
  if (!directions.direction) {
    return false;
  }

  roles.carry.dismantleStructure(creep, directions);
  return false;
};

/**
 * handleSourceKeeperRoom
 *
 * @param {object} creep
 */
function handleSourceKeeperRoom(creep) {
  const target = creep.findClosestSourceKeeper();
  if (target !== null) {
    const range = creep.pos.getRangeTo(target);
    if (range < 5) {
      delete creep.memory.routing.reached;
      creep.memory.routing.reverse = true;
    }
  }
}

roles.carry.action = function(creep) {
  // TODO log when this happens, carry is getting energy from the source
  creep.creepLog('ACTION');
  const source = Game.getObjectById(creep.memory.routing.targetId);
  if (source === null) {
    creep.creepLog('sfener');
    creep.memory.routing.reached = false;
    creep.memory.routing.reverse = true;

    const sources = creep.pos.findInRange(FIND_SOURCES, 3);
    if (sources.length > 0) {
      creep.memory.routing.targetId = sources[0].id;
      return true;
    }

    const resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    if (resource !== null) {
      creep.memory.routing.targetId = resource.id;
      // TODO Use pathfinder
      creep.moveTo(resource);
      creep.pickup(resource, resource.amount - 1);
      return true;
    }
  }
  // TODO this should be last position => reverse - In preMove make sure a reverse stays if it is set here
  const reverse = creep.pickupWhileMoving();

  if (!reverse) {
    creep.harvest(source);
  }

  if (!creep.room.controller) {
    handleSourceKeeperRoom(creep);
  }

  creep.memory.routing.reached = false;
  creep.memory.routing.reverse = true;

  // End of path, can't harvest, suicide (otherwise the sourcer gets stuck)
  if (!reverse && creep.body.filter((part) => part.type === WORK).length === 0) {
    // creep.log('Suiciding because end of path, no energy, do not want to get in the way of the sourcer (better recycle?)');
    creep.memory.killed = true;
    creep.suicide();
  }

  return true;
};
