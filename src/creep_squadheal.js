'use strict';

var helper = require('helper');
var squadmanager = require('squadmanager');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, HEAL];
  return room.get_part_config(energy, parts).sort().reverse();
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 5100);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 5100);
};

function heal(creep) {
  var range;
  var creep_to_heal = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax / 1.5;
    }
  });

  if (creep_to_heal !== null) {
    range = creep.pos.getRangeTo(creep_to_heal);
    if (range <= 1) {
      creep.heal(creep_to_heal);
    } else {
      creep.rangedHeal(creep_to_heal);
      creep.moveTo(creep_to_heal);
    }
    return true;
  }


  creep_to_heal = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax;
    }
  });

  if (creep_to_heal !== null) {
    range = creep.pos.getRangeTo(creep_to_heal);
    if (range > 1) {
      creep.rangedHeal(creep_to_heal);
    } else {
      creep.heal(creep_to_heal);
    }
    creep.moveTo(creep_to_heal);
    return true;
  }

  var attacker = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.memory.role == 'squadsiege';
    }
  });


  if (creep.pos.x === 0 ||
    creep.pos.x == 49 ||
    creep.pos.y === 0 ||
    creep.pos.y == 49
  ) {
    creep.moveTo(25, 25);
    return true;
  }
  if (attacker === null) {
    var cs = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    creep.moveTo(cs);
    return false;
  }
  creep.moveTo(attacker);
  return false;
}

// TODO need to check if it works
module.exports.action = function(creep) {
  if (!creep.memory.initialized) {
    Memory.squads[creep.memory.squad].heal[creep.id] = {};
    creep.memory.initialized = true;
  }
  var squad = Memory.squads[creep.memory.squad];
  let reverse = false;
  if (squad.action == 'move') {
    if (creep.room.name == squad.moveTarget) {
      let nextExits = creep.room.find(creep.memory.route[creep.memory.routePos].exit);
      let nextExit = nextExits[Math.floor(nextExits.length / 2)];
      let range = creep.pos.getRangeTo(nextExit.x, nextExit.y);
      if (range < 4) {
        Memory.squads[creep.memory.squad].heal[creep.id].waiting = true;
        if (Math.random() > 0.5 * (range - 2)) {
          reverse = true;
        }
      }
    }
  }
  heal();
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
