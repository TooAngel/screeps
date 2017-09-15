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
    550: 'W',
  },
  layoutString: 'MC',
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

roles.carry.reset = function(creep) {
  // TODO check new routing. if carry is on the new path, reset carry, otherwise move to pathStart
  const queue = Memory.rooms[creep.memory.base].queue || [];
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].role === 'carry' && !queue[i].helper) {
      creep.memory.routing = queue[i].routing;
      queue.splice(i, 1);
      return true;
    }
  }
  return false;
};

roles.carry.ensureOne = function(creep) {
  if (config.carry.ensureOne) {
    const nearCarries = creep.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 1, 'memory.role', ['carry'], false, {
      filter: (otherCreep) => otherCreep.memory.routing.targetId === creep.memory.routing.targetId,
    });
    if (nearCarries.length < 2) {
      creep.memory.resetTarget = false;
    }
  }
};

roles.carry.checkHelperEmptyStorage = function(creep) {
  // Fix blocked helpers due to empty structure in the room where we get the energy from
  if (creep.room.name === creep.memory.routing.targetRoom) {
    const targetStructure = Game.getObjectById(creep.memory.routing.targetId);
    if (targetStructure === null) {
      creep.memory.resetTarget = true;
      return;
    }

    if (targetStructure.structureType === STRUCTURE_STORAGE) {
      creep.say('storage');
      if (targetStructure.store.energy === 0) {
        creep.log('the storage I should get the energy from is empty');
        creep.memory.resetTarget = true;
      }
    }
  }
};

roles.carry.handleMisplacedSpawn = function(creep) {
  // Misplaced spawn
  // TODO Somehow ugly and maybe better somewhere else
  if (creep.inBase() && (creep.room.memory.misplacedSpawn || creep.room.controller.level < 3)) {
    //     creep.say('cmis', true);
    // don't recycle carry
    creep.memory.resetTarget = false;
    if (creep.carry.energy > 0) {
      const structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (object) => object.energy < object.energyCapacity,
      });
      creep.moveTo(structure, {
        ignoreCreeps: true,
      });
      creep.transfer(structure, RESOURCE_ENERGY);
      return true;
    } else {
      const targetId = creep.memory.routing.targetId;

      const source = creep.room.memory.position.creep[targetId];
      // TODO better the position from the room memory
      if (source !== null) {
        creep.moveTo(source, {
          ignoreCreeps: true,
        });
        if (creep.pos.getRangeTo(source) > 1) {
          return true;
        }
      }
    }
    return false;
  }
};

roles.carry.preMove = function(creep, directions, routeLength, pathLength) {
  roles.carry.checkHelperEmptyStorage(creep);

  if (roles.carry.handleMisplacedSpawn(creep)) {
    return true;
  }

  if (!creep.room.controller) {
    const target = creep.findClosestSourceKeeper();
    if (target !== null) {
      const range = creep.pos.getRangeTo(target);
      if (range > 6) {
        creep.memory.routing.reverse = false;
      }
      if (range < 6) {
        creep.memory.routing.reverse = true;
      }
    }
  }

  // TODO When does this happen? (Not on path?) - Handle better
  if (!directions) {
    creep.say('No directions');
    return false;
  }

  let reverse = false;
  if (!creep.memory.routing.reverse) {
    if (config.carry.transferToCarry) {
      reverse = creep.checkForTransfer(directions.forwardDirection);
    }
    if (!reverse && creep.isStuck() && directions.backwardDirection) {
      const adjacentPos = creep.pos.getAdjacentPosition(directions.backwardDirection);
      if (adjacentPos.isValid()) {
        const creeps = adjacentPos.lookFor(LOOK_CREEPS);
        if (creeps.length > 0 && creeps[0].memory && creeps[0].memory.routing && creeps[0].memory.routing.targetId !== creep.memory.routing.targetId) {
          reverse = true;
        }
      }
    }
  }

  if (creep.checkEnergyTransfer()) {
    reverse = true;
    if (creep.inBase()) {
      const transferred = creep.transferToStructures();
      if (transferred) {
        if (transferred.moreStructures) {
          return true;
        }
        reverse = creep.carry.energy - transferred.transferred > 0;
      } else if (creep.memory.routing.pathPos === 0 && !(creep.room.storage && creep.room.storage.my && creep.room.storage.isActive())) {
        creep.drop(RESOURCE_ENERGY);
        reverse = false;

        let resourceAtPosition = 0;
        const resources = creep.pos.lookFor(LOOK_RESOURCES);
        for (const resource of resources) {
          resourceAtPosition += resource.amount;
        }
        let amount = creep.room.getHarvesterAmount();
        amount += Math.floor(resourceAtPosition / config.carry.callHarvesterPerResources);
        creep.room.checkRoleToSpawn('harvester', amount, 'harvester');
      }
    }
    if (directions.backwardDirection && directions.backwardDirection !== null) {
      const transferred = creep.transferToCreep(directions.backwardDirection);
      reverse = !transferred;
    }
  }

  reverse = creep.pickupWhileMoving(reverse);

  // recycle carry
  if (pathLength) {
    const routing = creep.memory.routing;
    if (routing.routePos === routeLength - 1 && routing.pathPos === pathLength - 2) {
      if (creep.isStuck() && !reverse) {
        creep.memory.resetTarget = true;
      }
      roles.carry.ensureOne(creep);
    }
  }
  if (creep.memory.resetTarget) {
    reverse = true;
    creep.say('reset');
    if (creep.inBase()) {
      if (creep.ticksToLive > config.carry.recycleThreshold && roles.carry.reset(creep)) {
        creep.memory.resetTarget = false;
      } else {
        const spawn = creep.pos.findClosestByRangePropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
        if (spawn && spawn.recycleCreep(creep) === 'OK') {
          return true;
        } else if (creep.memory.routing.pathPos === 0) {
          creep.memory.recycle = true;
          return true;
        }
      }
    }
  }

  if (reverse) {
    //     creep.log('reverse');
    directions.direction = directions.backwardDirection;
  } else {
    //     creep.log('not reverse');
    directions.direction = directions.forwardDirection;
  }
  creep.memory.routing.reverse = reverse;

  if (!directions.direction) {
    return false;
  }
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

roles.carry.action = function(creep) {
  // TODO log when this happens, carry is getting energy from the source
  // creep.log('ACTION');
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
  let reverse = false;
  reverse = creep.pickupWhileMoving(reverse);

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
  if (!creep.memory.helper) {
    creep.memory.resetTarget = true;
    roles.carry.ensureOne(creep);
  }

  return true;
};

roles.carry.execute = function(creep) {
  // creep.log('Execute!!!');
  const target = Game.getObjectById(creep.memory.routing.targetId);
  if (target === null) {
    delete creep.memory.routing.targetId;
  }
};
