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
  fillTough: true,
};

roles.powerattacker.action = function(creep) {
  const hostileCreep = creep.findClosestEnemy();
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
          targetRoom: creep.room.name,
        },
      });
      Memory.powerBanks[creep.room.name].defender = true;
    }
    const range = creep.pos.getRangeTo(hostileCreep);
    if (range < 10) {
      creep.moveTo(hostileCreep);
      creep.attack(hostileCreep);
      return true;
    }
  }

  const powerBank = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);

  if (powerBank.length === 0) {
    if (hostileCreep !== null) {
      creep.moveTo(hostileCreep);
      creep.attack(hostileCreep);
      return true;
    }
    creep.move(_.random(1, 8));
    return false;
  }

  if (powerBank[0].hits > 100000) {
    creep.spawnReplacement();
  }

  creep.setNextSpawn();

  creep.moveTo(powerBank[0]);
  creep.attack(powerBank[0]);
  return true;
};
