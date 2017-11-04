'use strict';

/*
 * powerhealer is used to heal powerattackers
 *
 * Moves to the room where the powerbank is and heals surrounding creeps
 */

roles.powerhealer = {};

roles.powerhealer.settings = {
  layoutString: 'MH',
  maxLayoutAmount: 21,
  fillTough: true,
};

roles.powerhealer.action = function(creep) {
  if (creep.hits < creep.hitsMax) {
    creep.heal(creep);
  }

  const myCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (object) => object.hits < object.hitsMax,
  });

  if (myCreep !== null) {
    const range = creep.pos.getRangeTo(myCreep);
    if (range > 1) {
      creep.rangedHeal(myCreep);
    } else {
      creep.heal(myCreep);
    }
  }

  roles.powerhealer.heal(creep);
  return true;
};

roles.powerhealer.heal = function(creep) {
  let range;
  let creepToHeal = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (object) => object.hits < object.hitsMax / 1.5,
  });
  const powerBank = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);
  if (powerBank.length > 0 && powerBank[0].hits > 100000) {
    creep.spawnReplacement();
  }

  creep.setNextSpawn();

  let attacker;

  if (creepToHeal === null) {
    if (powerBank.length === 0) {
      creepToHeal = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: (object) => object.hits < object.hitsMax,
      });
      if (creepToHeal !== null) {
        range = creep.pos.getRangeTo(creepToHeal);
        if (range > 1) {
          creep.rangedHeal(creepToHeal);
        } else {
          creep.heal(creepToHeal);
        }
        creep.moveTo(creepToHeal);
        return true;
      }
      attacker = creep.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['powerattacker']);
      creep.moveTo(attacker);
      return false;
    }
    const hostileCreeps = creep.room.getEnemys();
    if (hostileCreeps.length > 0) {
      attacker = creep.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['powerattacker']);
      creep.moveTo(attacker);
      return false;
    }
    range = creep.pos.getRangeTo(powerBank[0]);
    if (range > 2) {
      creep.moveTo(powerBank[0]);
    }
    return false;
  }
  range = creep.pos.getRangeTo(creepToHeal);
  if (range <= 1) {
    creep.heal(creepToHeal);
  } else {
    creep.rangedHeal(creepToHeal);
    creep.moveTo(creepToHeal);
  }
  return true;
};

roles.powerhealer.execute = function(creep) {
  creep.log('Execute!!!');
};
