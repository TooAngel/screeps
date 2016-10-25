'use strict';

var helper = require('helper');
var squadmanager = require('squadmanager');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, WORK];
  return room.get_part_config(energy, parts).sort().reverse();
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

function siege(creep) {

  creep.memory.hitsLost = creep.memory.hitsLast - creep.hits;
  creep.memory.hitsLast = creep.hits;

  if (creep.hits - creep.memory.hitsLost < creep.hits / 2) {
    let exitNext = creep.pos.findClosestByRange(FIND_EXIT);
    creep.moveTo(exitNext);
    return true;
  }

  if (!creep.memory.notified) {
    creep.log('Attacking');
    Game.notify(Game.time + ' ' + creep.room.name + ' Attacking');
    creep.memory.notified = true;
  }
  var tower = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_TOWER) {
        return true;
      }
      if (object.structureType == STRUCTURE_CONTROLLER) {
        return true;
      }
      return true;
    }
  });
  let target = tower;
  if (tower === null) {
    var spawn = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
      filter: function(object) {
        if (object.structureType == 'spawn') {
          return true;
        }
        return false;
      }
    });
    target = spawn;
  }
  if (target === null) {
    var cs = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    creep.moveTo(cs);
    return false;
  }
  var path = creep.pos.findPathTo(target, {
    ignoreDestructibleStructures: false,
    ignoreCreeps: true
  });
  var return_code;

  var posLast = path[path.length - 1];
  if (path.length === 0 || !target.pos.isEqualTo(posLast.x, posLast.y)) {
    var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        return object.structureType == STRUCTURE_RAMPART;
      }
    });
    return_code = creep.moveTo(structure);
    target = structure;
  } else {
    if (creep.hits > creep.hitsMax - 2000) {
      return_code = creep.moveByPath(path);
    }
  }

  let structures = target.pos.lookFor('structure');
  for (let i = 0; i < structures.length; i++) {
    if (structures[i].structureType == STRUCTURE_RAMPART) {
      target = structures[i];
      break;
    }
  }

  creep.dismantle(target);
  return true;
}

//TODO need to check if it works
module.exports.action = function(creep) {
  if (!creep.memory.initialized) {
    Memory.squads[creep.memory.squad].siege[creep.id] = {};
    creep.memory.initialized = true;
  }
  var squad = Memory.squads[creep.memory.squad];
  if (squad.action == 'move') {
    if (creep.room.name == squad.moveTarget) {
      let nextExits = creep.room.find(creep.memory.route[creep.memory.routePos].exit);
      let nextExit = nextExits[Math.floor(nextExits.length / 2)];
      let range = creep.pos.getRangeTo(nextExit.x, nextExit.y);
      if (range < 2) {
        Memory.squads[creep.memory.squad].siege[creep.id].waiting = true;
        return true;
      }
    }
  }
  siege();
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
