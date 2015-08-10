'use strict';

var actions = require('actions');
var helper = require('helper');

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable, 1400);
};

module.exports.energyBuild = function(room, energy) {
  return Math.max(200, Math.min(energy, 3000));
};

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.get_part_config(energy, parts);
};


function attack(creep) {
  var sources = creep.room.find(FIND_SOURCES);
  for (var sources_id in sources) {
    var path_to_source = creep.pos.findPathTo(sources[sources_id].pos);
    if (path_to_source === 0) {
      break;
    }
    let last_pos = path_to_source[path_to_source.length - 1];
    if (last_pos && !sources[sources_id].pos.isEqualTo(last_pos.x, last_pos.y)) {
      if (last_pos && !creep.pos.isEqualTo(last_pos.x, last_pos.y)) {
        creep.moveTo(last_pos.x, last_pos.y);
        return true;
      } else {
        break;
      }
    }
  }

  var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == 'rampart') {
        return true;
      }
      if (object.structureType == 'constructedWall') {
        return true;
      }
      if (object.stuctureType == 'storage') {
        return object.store.energy === 0;
      }
      return object.energy === 0;
    }
  });

  if (target === null) {
    return false;
  }

  let range = creep.pos.getRangeTo(target);

  if (range == 1) {
    creep.attack(target);
    return true;
  }
  creep.moveTo(target, {
    ignoreCreeps: false,
    ignoreDestructibleStructures: true
  });
  return true;

}

module.exports.action = function(creep) {
  let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (hostile !== null) {
    creep.moveTo(hostile);
    creep.attack(hostile);
    return true;
  }


  attack();
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
