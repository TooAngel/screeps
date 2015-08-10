'use strict';

var actions = require('actions');
var helper = require('helper');

var avoid_fields = [new RoomPosition(29, 27, 'E4S9'), new RoomPosition(29, 28, 'E4S9')];

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable, 2000);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable, 2000);
};

function get_resource(creep) {
  if (creep.carry.power > 0) {
    creep.log(creep.memory.route[creep.memory.route.length - 2].room);
    let exitDirection = creep.room.findExitTo(creep.memory.route[creep.memory.route.length - 2].room);
    let nextExits = creep.room.find(exitDirection);
    creep.log(JSON.stringify(nextExits));
    let nextExit = nextExits[Math.floor(nextExits.length / 2)];
    creep.moveTo(nextExit);
    return true;
  }

  var power_bank = creep.room.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'powerBank';
    }
  });
  if (power_bank.length > 0) {
    var range = creep.pos.getRangeTo(power_bank[0]);
    if (range > 3) {
      creep.moveTo(power_bank[0]);
    }
    return true;
  }

  var resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
    filter: function(object) {
      if (object.resourceType == 'power') {
        return true;
      }
    }
  });
  if (resource === null) {
    if (creep.carry.power > 0) {
      return false;
    } else {
      creep.moveTo(25, 25);
      return false;
    }
  }

  creep.moveTo(resource, {
    ignoreCreeps: true
  });
  var return_code = creep.pickup(resource);
  if (return_code == OK) {
    creep.memory.reverse = true;
  }
  return true;
}

module.exports.action = function(creep) {
  if (creep.memory.reverse) {
    creep.log('reversing');
  }
  if (creep.carry.energy) {
    creep.drop(RESOURCE_ENERGY);
  }

  if (creep.memory.reverse && creep.memory.base == creep.room.name) {
    creep.log('Fill storage');
    creep.moveTo(creep.room.storage, {
      ignoreCreeps: true,
      costCallback: helper.getAvoids(creep.room)
    });
    var return_code = creep.transfer(creep.room.storage, RESOURCE_POWER);
    if (return_code == OK) {
      creep.memory.target = creep.memory.old_target;
      creep.suicide();
    }
    return true;
  }

  get_resource();
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
