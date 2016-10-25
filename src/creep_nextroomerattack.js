'use strict';

var helper = require('helper');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.get_part_config(energy, parts).sort().reverse();
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

module.exports.died = function(name, memory) {
  console.log('--->', name, 'Died naturally?');
  delete Memory.creeps[name];
};

function attack(creep) {
  if (!creep.memory.notified) {
    creep.log('Attacking');
    Game.notify(Game.time + ' ' + creep.room.name + ' Attacking');
    creep.memory.notified = true;
  }
  var spawn = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == 'spawn') {
        return true;
      }
      return false;
    }
  });

  if (spawn === null) {
    var hostile_creep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: helper.find_attack_creep
    });
    if (hostile_creep !== null) {
      creep.moveTo(hostile_creep);
      creep.attack(hostile_creep);
    }
    return true;
  }
  var path = creep.pos.findPathTo(spawn, {
    ignoreDestructibleStructures: true
  });
  creep.attack(spawn);
  var return_code = creep.moveByPath(path);
  return true;
}

module.exports.action = function(creep) {
  var hostile_creep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: helper.find_attack_creep
  });
  if (hostile_creep !== null) {
    return attack(creep);
  }
  var hostile_structure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
  if (hostile_structure !== null) {
    return attack(creep);
  }

  attack();
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
