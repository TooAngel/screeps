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

roles.carry.boostActions = ['capacity'];

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

roles.carry.checkHelperEmptyStorage = function(creep) {
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
};

roles.carry.checkForHarvesterSpawn = function(creep) {
  const storage = creep.room.storage;
  if (!(storage && storage.my && storage.isActive())) {
    let resourceAtPosition = 0;
    const resources = creep.pos.lookFor(LOOK_RESOURCES);
    for (const resource of resources) {
      resourceAtPosition += resource.amount;
    }
    let amount = creep.room.getHarvesterAmount();
    amount += Math.floor(resourceAtPosition / config.carry.callHarvesterPerResources);
    creep.room.checkRoleToSpawn('harvester', amount);
  }
};

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

roles.carry.preMove = function(creep, directions) {
  if (!validateDirections(creep, directions)) {
    return false;
  }

  roles.carry.checkHelperEmptyStorage(creep);

  let moveToStorage = creep.checkCarryEnergyForBringingBackToStorage();
  const fleeFromSourceKeeper = creep.checkForSourceKeeper();
  moveToStorage = moveToStorage || fleeFromSourceKeeper;
  if (moveToStorage) {
    creep.creepLog(`preMove moveToStorage`);
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
        creep.drop(RESOURCE_ENERGY);
        roles.carry.checkForHarvesterSpawn(creep);
        creep.memory.routing.reverse = false;
        return false;
      }
    }

    if (directions.backwardDirection && directions.backwardDirection !== null) {
      creep.creepLog('Trying to transfer to creep');
      const transferred = creep.transferToCreep(directions.backwardDirection);
      creep.memory.routing.reverse = !transferred;
      return false;
    }
  } else {
    creep.creepLog(`preMove not moveToStorage`);
    if (creep.memory.routing.pathPos > 1) {
      // TODO these two methods seems pretty similar, should be unified
      moveToStorage = creep.pickupEnergy();
      moveToStorage = moveToStorage || creep.pickupWhileMoving();
    }
    const energyFromCreep = creep.checkForTransfer(directions.forwardDirection);
    moveToStorage = moveToStorage || energyFromCreep;
  }

  moveToStorage = moveToStorage && creep.memory.routing.pathPos !== 0;

  creep.memory.routing.reverse = moveToStorage;
  if (moveToStorage) {
    directions.direction = directions.backwardDirection;
  } else {
    directions.direction = directions.forwardDirection;
  }
  if (!directions.direction) {
    return false;
  }

  roles.carry.dismantleStructure(creep, directions);
  return false;
};

roles.carry.action = function(creep) {
  // TODO log when this happens, carry is getting energy from the source
  creep.creepLog('ACTION');
  const source = Game.getObjectById(creep.memory.routing.targetId);
  if (source === null) {
    creep.say('sfener');
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
    const target = creep.findClosestSourceKeeper();
    if (target !== null) {
      const range = creep.pos.getRangeTo(target);
      if (range < 5) {
        delete creep.memory.routing.reached;
        creep.memory.routing.reverse = true;
      }
    }
  }

  creep.memory.routing.reached = false;
  creep.memory.routing.reverse = true;

  // End of path, can't harvest, suicide (otherwise the sourcer get's stuck)
  if (!reverse && creep.body.filter((part) => part.type === WORK).length === 0) {
    // creep.log('Suiciding because end of path, no energy, do not want to get in the way of the sourcer (better recycle?)');
    creep.memory.killed = true;
    creep.suicide();
  }

  return true;
};
