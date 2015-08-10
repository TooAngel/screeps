'use strict';

var actions = require('actions');
var helper = require('helper');

module.exports.energyRequired = function(room) {
  return 1600;
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(energy, 3000);
};

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, WORK, CARRY];
  return room.get_part_config(energy, parts);
};

function getResources(creep) {
  var resources = 0;
  if (creep.carry.energy) {
    resources += creep.carry.energy;
  }
  if (creep.carry.power) {
    resources += creep.carry.power;
  }
  return resources;
}

function clean_exits(creep) {
  // Change this on to use target_id
  var pos_last;
  if (creep.memory.path_exit) {
    pos_last = creep.memory.path_exit[creep.memory.path_exit.length - 1];
    if (creep.pos.isEqualTo(pos_last.x, pos_last.y)) {
      return false;
    }
    var return_code = creep.moveByPath(creep.memory.path_exit);
    if (return_code == OK) {
      return true;
    }
    if (return_code == ERR_NOT_FOUND) {
      creep.moveTo(pos_last.x, pos_last.y);
      return true;
    }
    creep.log(return_code);
  }

  var exit_dirs = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];
  for (var exit_dirs_i in exit_dirs) {
    var exits = creep.room.find(exit_dirs[exit_dirs_i]);
    if (exits.length === 0) {
      continue;
    }
    var exit = exits[Math.floor(exits.length / 2)];
    var path = creep.pos.findPathTo(exit);
    pos_last = path[path.length - 1];
    if (path.length === 0) {
      return false;
    }
    if (!exit.isEqualTo(pos_last.x, pos_last.y)) {
      creep.memory.path_exit = path;
      creep.moveByPath(path);
      return true;
    }
  }
  return false;
}

function handle(creep) {
  var resources_dropped = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
  for (var i in resources_dropped) {
    creep.pickup(resources_dropped[i]);
  }

  if (creep.room.storage) {
    if (Game.time % 100 === 0) {
      creep.log('Call carry for storage');
      Game.rooms[creep.memory.base].memory.queue.push({
        role: 'carry',
        source: creep.room.storage.pos
      });
    }
  }

  var resources = getResources(creep);

  if (resources > creep.carryCapacity / 2) {
    var carry = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function(object) {
        if (object.memory.role != 'carry') {
          return false;
        }

        if (object.carryCapacity == getResources(object)) {
          return false;
        }

        //if (object.carryCapacity - getResources(object) > resources || object.carryCapacity - getResources(object) > 200) {
        //    return true;
        //}

        return true;
      }
    });
    if (carry !== null) {
      var return_code;
      if (creep.carry.power) {
        return_code = creep.transfer(carry, RESOURCE_POWER);
      } else {
        return_code = creep.transfer(carry, RESOURCE_ENERGY);
      }
      if (return_code != OK) {
        creep.moveTo(carry);
      }
      return true;
    }
  }

  if (resources == creep.carryCapacity) {
    return false;
  }

  if (clean_exits(creep)) {
    return true;
  }

  var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: function(object) {
      if (object.ticksToDecay === null) {
        return false;
      }
      if (object.structureType == 'controller') {
        return false;
      }
      if (object.structureType == 'road') {
        return false;
      }
      return true;
    }
  });

  if (structure !== null) {
    var structures = structure.pos.lookFor('structure');

    if (structures.length > 0) {
      for (var structures_i = 0; structures_i < structures.length; structures_i++) {
        if (structures[structures_i].structureType == 'rampart') {
          structure = structures[structures_i];
          break;
        }
      }
    }
    creep.moveTo(structure);
    creep.dismantle(structure);
    return true;
  }

  if (resources > 0) {
    var sourcer = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function(object) {
        if (object.memory.role == 'sourcer') {
          return true;
        }
        return false;
      }
    });
    if (sourcer !== null) {
      creep.moveTo(sourcer);
      return true;
    } else {
      creep.log('Full energy, no sourcer found');
    }
    return true;
  }

  if (creep.room.storage) {
    creep.moveTo(creep.room.storage);
    if (creep.room.storage.hits > 600 || creep.ticksToLive <= 10) {
      creep.attack(creep.room.storage);
    }
  }
}

module.exports.execute = function(creep) {

  handle();
  return true;
};


module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
