'use strict';

var actions = require('actions');
var helper = require('helper');
let config = require('config');

module.exports.stayInRoom = true;
module.exports.buildRoad = true;

module.exports.boostActions = ['capacity'];

let beforeStorage = function(creep) {
  creep.say('beforeStorage');
  var methods = [
    actions.getEnergy
  ];
  if (creep.room.storage && creep.room.storage.store.energy > config.creep.energyFromStorageThreshold) {
    methods = [actions.getEnergyFromStorage];
  }

  if (creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level] / 10 || creep.room.controller.level == 1) {
    methods.push(actions.upgradeController);
  }

  methods.push(actions.transferEnergy);

  let structures = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_RAMPART) {
        return false;
      }
      if (object.structureType == STRUCTURE_WALL) {
        return false;
      }
      if (object.structureType == STRUCTURE_CONTROLLER) {
        return false;
      }
      return true;
    }
  });

  if (structures.length > 0) {
    methods.push(actions.construct);
  }


  if (creep.room.controller.level < 9) {
    methods.push(actions.upgradeController);
  } else {
    methods.push(actions.repairStructure);
  }

  actions.execute(creep, methods);
  return true;
};


module.exports.preMove = function(creep, directions) {
  let pickableResources = function(object) {
    return creep.pos.getRangeTo(object.pos.x, object.pos.y) < 2;
  };
  let resources = _.filter(creep.room.memory.droppedResources, pickableResources);
  if (resources.length > 0) {
    creep.pickup(resources[0]);
  }

  if (typeof(creep.memory.move_forward_direction) == 'undefined') {
    creep.memory.move_forward_direction = true;
  }

  creep.setNextSpawn();
  creep.spawnReplacement(1);

  if (!creep.room.storage || (creep.room.storage.store.energy + creep.carry.energy) < config.creep.energyFromStorageThreshold) {
    return beforeStorage(creep);
  }

  let reverse = creep.carry.energy === 0;

  if (creep.memory.routing.pathPos === 0) {
    for (let resource in creep.carry) {
      if (resource == RESOURCE_ENERGY) {
        continue;
      }
      creep.transfer(creep.room.storage, resource);
    }

    let returnCode = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
    if (returnCode == OK || returnCode == ERR_FULL) {
      creep.memory.move_forward_direction = true;
      reverse = false;
      creep.memory.routing.reverse = false;
      if (returnCode == OK) {
        return true;
      }
    }
  }

  // TODO Decide between, transfered no more energy (reverse), transferred other structures to transfer available (stay still), transferred no more structures (forward)
  if (!reverse && creep.transferToStructures()) {
    reverse = true;
    return true;
  }
  creep.memory.routing.reverse = reverse || !creep.memory.move_forward_direction;
  if (directions && creep.memory.routing.reverse) {
    directions.direction = directions.backwardDirection;
  }
};

module.exports.action = function(creep) {
  creep.memory.move_forward_direction = false;
  creep.memory.routing.reverse = true;
  delete creep.memory.routing.reached;
  return true;
};

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY];
  let partConfig = room.get_part_config(energy, parts);
  if (room.storage && room.storage.my && room.storage.store.energy > config.creep.energyFromStorageThreshold) {
    parts = [MOVE, CARRY, CARRY];
    partConfig = room.get_part_config(energy - 150, parts);
    partConfig.unshift(WORK);
    partConfig.unshift(MOVE);
  }
  return partConfig;
};

module.exports.energyRequired = function(room) {
  return 250;
};

module.exports.energyBuild = function(room, energy) {
  let build = Math.min(1500, Math.max(energy, 250));
  return build;
};

module.exports.execute = function(creep) {
  creep.log('execute');
  // TODO Something is broken
  beforeStorage(creep);
  //   if (true) throw new Error();
  return false;
};
