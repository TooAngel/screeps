'use strict';

var helper = require('helper');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, RANGED_ATTACK];
  return room.get_part_config(energy, parts).sort().reverse();
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable, 3250);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable, 3250);
};

function attack(creep) {
  if (creep.hits < 200) {
    return false;
  }
  var hostile_creeps = creep.room.find(FIND_HOSTILE_CREEPS, {
    filter: helper.find_attack_creep
  });
  if (hostile_creeps.length > 0) {
    creep.moveTo(hostile_creeps[0]);
    creep.rangedAttack(hostile_creeps[0]);
    return true;
  }


  var power_bank = creep.room.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'powerBank';
    }
  });

  if (power_bank.length === 0) {
    var hostile_creep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        if (object.owner.username == 'Source Keeper') {
          return false;
        }
        return true;
      }

    });
    if (hostile_creep !== null) {
      creep.moveTo(hostile_creep);
      creep.rangedAttack(hostile_creep);
      return true;
    }
    creep.moveTo(25, 25);
    return false;
  }

  if (power_bank[0].hits > 100000) {
    creep.spawnReplacement();
  }

  creep.setNextSpawn();

  creep.moveTo(power_bank[0]);
  creep.rangedAttack(power_bank[0]);
  return true;
}

module.exports.action = function(creep) {
  creep.log('hia');
  attack();
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
