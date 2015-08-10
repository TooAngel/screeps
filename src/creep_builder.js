'use strict';

var actions = require('actions');

module.exports.stayInRoom = true;
module.exports.buildRoad = true;
module.exports.killPrevious = true;

module.exports.boostActions = ['upgradeController'];

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  var energyNeeded = 200;
  return energyNeeded;
};


module.exports.energyBuild = function(room, energy) {
  if (room.controller.level >= 7) {
    if (room.storage && room.storage.store.energy < 50000) {
      return 350;
    }
    return Math.min(1950, room.energyCapacityAvailable - 300);
  }
  var energyNeeded = 200;
  if (room.controller.level < 7) {
    energyNeeded = Math.min(1950, room.energyCapacityAvailable - 300);
  }
  if (room.controller.level == 7) {
    // TODO Better calculation for the builder size
    //    energyNeeded = Math.min(3900, energy);
  }
  if (room.storage) {
    if (room.storage.store.energy > 800000) {
      return Math.min(3900, room.energyCapacityAvailable - 300);
    }
    if (room.storage.store.energy < 10000) {
      return 350;
    }
  }
  return energyNeeded;
};

function work(creep) {
  creep.spawnReplacement(1);
  var room = Game.rooms[creep.room.name];
  if (room.memory.attack_timer > 50 && room.controller.level > 6) {
    if (room.controller.ticksToDowngrade > 10000) {
      return true;
    }
  }

  var returnCode = creep.upgradeController(creep.room.controller);
  creep.say('uc: ' + returnCode);
  if (returnCode == OK) {
    if (!room.memory.builder_upgrade) {
      room.memory.builder_upgrade = 0;
    }
    var work_parts = 0;
    for (var part_i in creep.body) {
      if (creep.body[part_i].type == 'work') {
        work_parts++;
      }
    }
    room.memory.builder_upgrade += Math.min(work_parts, creep.carry.energy);
  }

  returnCode = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);

  if (returnCode == ERR_FULL) {
    return;
  }
  if (returnCode === OK) {
    return;
  }
  return;
}

module.exports.work = function(creep) {
  return work(creep);
};

module.exports.action = function(creep) {
  return work(creep);
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
