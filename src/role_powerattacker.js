'use strict';

/*
 * powerattacker kills the powerbank
 * 
 * Moves to the power bank and attack, stop attacking if its hits is below 'threshold'
 */

roles.powerattacker = {};
roles.powerattacker.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.getPartConfig(energy, parts).sort().reverse();
};

roles.powerattacker.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

roles.powerattacker.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

roles.powerattacker.action = function(creep) {
  var hostile_creep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: creep.room.findAttackCreeps
  });
  if (hostile_creep !== null) {
    creep.moveTo(hostile_creep);
    creep.attack(hostile_creep);
    return true;
  }

  if (creep.hits < 200) {
    return false;
  }
  if (hostile_creep !== null) {
    if (Memory.power_banks[creep.room.name] && !Memory.power_banks[creep.room.name].defender) {
      creep.log('Call powerdefender');
      Game.rooms[creep.memory.base].memory.queue.push({
        role: 'powerdefender',
        target: creep.room.name
      });
      Memory.power_banks[creep.room.name].defender = true;
    }
    var range = creep.pos.getRangeTo(hostile_creep);
    if (range < 10) {

      creep.moveTo(hostile_creep);
      creep.attack(hostile_creep);
      return true;
    }
  }


  var power_bank = creep.room.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'powerBank';
    }
  });

  if (power_bank.length === 0) {
    hostile_creep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        if (object.owner.username == 'Source Keeper') {
          return false;
        }
        return true;
      }

    });
    if (hostile_creep !== null) {
      creep.moveTo(hostile_creep);
      creep.attack(hostile_creep);
      return true;
    }
    creep.move((Math.random() * 8) + 1);
    return false;
  }

  if (power_bank[0].hits > 100000) {
    creep.spawnReplacement();
  }

  creep.setNextSpawn();

  creep.moveTo(power_bank[0]);
  creep.attack(power_bank[0]);
  return true;
};

roles.powerattacker.execute = function(creep) {
  creep.log('Execute!!!');
};
