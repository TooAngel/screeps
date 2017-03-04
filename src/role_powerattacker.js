'use strict';

/*
 * powerattacker kills the powerbank
 *
 * Moves to the power bank and attack, stop attacking if its hits is below 'threshold'
 */

roles.powerattacker = {};
roles.powerattacker.settings = {
  layoutString: 'MA',
  amount: [5, 5],
};

roles.powerattacker.action = function(creep) {
  let hostileCreep = creep.pos.findClosestEnemy();
  if (hostileCreep !== null) {
    creep.moveTo(hostileCreep);
    creep.attack(hostileCreep);
    return true;
  }

  if (creep.hits < 200) {
    return false;
  }
  if (hostileCreep !== null) {
    if (Memory.powerBanks[creep.room.name] && !Memory.powerBanks[creep.room.name].defender) {
      creep.log('Call powerdefender');
      Game.rooms[creep.memory.base].memory.queue.push({
        role: 'powerdefender',
        routing: {
          targetRoom: creep.room.name
        }
      });
      Memory.powerBanks[creep.room.name].defender = true;
    }
    var range = creep.pos.getRangeTo(hostileCreep);
    if (range < 10) {
      creep.moveTo(hostileCreep);
      creep.attack(hostileCreep);
      return true;
    }
  }

  var power_bank = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);

  if (power_bank.length === 0) {
    if (hostileCreep !== null) {
      creep.moveTo(hostileCreep);
      creep.attack(hostileCreep);
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
