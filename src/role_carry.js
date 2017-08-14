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
    550: 'W'
  },
  layoutString: 'MC',
  amount: config.carry.sizes,
  maxLayoutAmount: 1
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
      }
    };
  }
};

roles.carry.checkHelperEmptyStorage = function(creep) {
  // Fix blocked helpers due to empty structure in the room where we get the energy from
  if (creep.room.name === creep.memory.routing.targetRoom) {
    let targetStructure = Game.getObjectById(creep.memory.routing.targetId);
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

roles.carry.handleMisplacedSpawn = function(creep) {
  // Misplaced spawn
  // TODO Somehow ugly and maybe better somewhere else
  if (creep.inBase() && (creep.room.memory.misplacedSpawn || creep.room.controller.level < 3)) {
    //     creep.say('cmis', true);
    if (creep.carry.energy > 0) {
      let structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: object => object.energy < object.energyCapacity
      });
      creep.moveTo(structure, {
        ignoreCreeps: true
      });
      creep.transfer(structure, RESOURCE_ENERGY);
    } else {
      let targetId = creep.memory.routing.targetId;

      var source = creep.room.memory.position.creep[targetId];
      // TODO better the position from the room memory
      if (source !== null) {
        let returnCode = creep.moveTo(source, {
          ignoreCreeps: true
        });
        if (creep.pos.getRangeTo(source) > 1) {
          return true;
        }
      }
    }
    return false;
  }
};

roles.carry.preMove = function(creep, directions) {
  roles.carry.checkHelperEmptyStorage(creep);

  if (roles.carry.handleMisplacedSpawn(creep)) {
    return true;
  }

  if (!creep.room.controller) {
    var target = creep.findClosestSourceKeeper();
    if (target !== null) {
      let range = creep.pos.getRangeTo(target);
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
    reverse = creep.checkForTransfer(directions.forwardDirection);
    if (!reverse && creep.isStuck() && directions.backwardDirection) {
      let adjacentPos = creep.pos.getAdjacentPosition(directions.backwardDirection);
      if (adjacentPos.isValid()) {
        let creeps = adjacentPos.lookFor(LOOK_CREEPS);
        if (creeps.length > 0 && creeps[0].memory && creeps[0].memory.routing && creeps[0].memory.routing.targetId !== creep.memory.routing.targetId) {
          creep.say('give way');
          reverse = true;
        }
      }
    }
  }

  if (creep.checkEnergyTransfer()) {
    reverse = true;
    if (creep.inBase()) {
      let transferred = creep.transferToStructures();
      if (transferred) {
        if (transferred.moreStructures) {
          return true;
        }
        reverse = creep.carry.energy - transferred.transferred > 0;
      } else if (!(creep.room.storage && creep.room.storage.my) && creep.memory.routing.pathPos === 0) {
        creep.say('Drop');
        creep.drop(RESOURCE_ENERGY);
        reverse = false;

        let resourceAtPosition = 0;
        var resources = creep.pos.lookFor(LOOK_RESOURCES);
        for (let resource of resources) {
          resourceAtPosition += resource.amount;
        }
        let amount = creep.room.getHarvesterAmount();
        amount += Math.floor(resourceAtPosition / config.carry.callHarvesterPerResources);
        creep.room.checkRoleToSpawn('harvester', amount, 'harvester');

      }
    }
    if (directions.backwardDirection && directions.backwardDirection !== null) {
      let transferred = creep.transferToCreep(directions.backwardDirection);
      reverse = !transferred;
    }
  }

  reverse = creep.pickupWhileMoving(reverse);
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
  let posForward = creep.pos.getAdjacentPosition(directions.direction);
  let structures = posForward.lookFor(LOOK_STRUCTURES);
  for (let structure of structures) {
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
  let source = Game.getObjectById(creep.memory.routing.targetId);
  if (source === null) {
    creep.say('sfener');
    creep.memory.routing.reached = false;
    creep.memory.routing.reverse = true;

    let sources = creep.pos.findInRange(FIND_SOURCES, 3);
    if (sources.length > 0) {
      creep.memory.routing.targetId = sources[0].id;
      return true;
    }

    let resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    if (resource !== null) {
      creep.memory.routing.targetId = resource.id;
      // TODO Use pathfinder
      creep.moveTo(resource);
      let returnCode = creep.pickup(resource, resource.amount - 1);
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
    var target = creep.findClosestSourceKeeper();
    if (target !== null) {
      let range = creep.pos.getRangeTo(target);
      if (range < 5) {
        delete creep.memory.routing.reached;
        creep.memory.routing.reverse = true;
      }
    }
  }

  creep.memory.routing.reached = false;
  creep.memory.routing.reverse = true;

  return true;
};

roles.carry.execute = function(creep) {
  // creep.log('Execute!!!');
  let target = Game.getObjectById(creep.memory.routing.targetId);
  if (target === null) {
    delete creep.memory.routing.targetId;
  }
};
