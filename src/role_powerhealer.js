'use strict';

/*
 * powerhealer is used to heal powerattacker
 *
 * Moves to the room where the PowerBank is and heals surrounding creeps
 */

roles.powerhealer = {};

roles.powerhealer.settings = {
  layoutString: 'MH',
  maxLayoutAmount: 21,
};

roles.powerhealer.action = function(creep) {
  creep.selfHeal();
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

/**
 * healCreep
 *
 * @param {object} creep
 * @param {object} creepToHeal
 */
function healCreep(creep, creepToHeal) {
  const range = creep.pos.getRangeTo(creepToHeal);
  if (range > 1) {
    creep.rangedHeal(creepToHeal);
  } else {
    creep.heal(creepToHeal);
  }
  creep.moveTo(creepToHeal);
}

roles.powerhealer.heal = function(creep) {
  let creepToHeal = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (object) => object.hits < object.hitsMax / 1.5,
  });
  const powerBank = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);
  if (powerBank.length > 0 && powerBank[0].hits > 100000) {
    creep.setNextSpawn();
    creep.spawnReplacement();
  }

  let attacker;

  if (creepToHeal) {
    healCreep(this, creepToHeal);
    return true;
  }

  if (powerBank.length === 0) {
    creepToHeal = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: (object) => object.hits < object.hitsMax,
    });
    if (creepToHeal) {
      healCreep(this, creepToHeal);
      return true;
    }
    attacker = creep.pos.findClosestByRangeCreepPowerAttacker();
    creep.moveTo(attacker);
    return false;
  }
  const hostileCreeps = creep.room.findEnemies();
  if (hostileCreeps.length > 0) {
    attacker = creep.pos.findClosestByRangeCreepPowerAttacker();
    creep.moveTo(attacker);
    return false;
  }
  const range = creep.pos.getRangeTo(powerBank[0]);
  if (range > 2) {
    creep.moveTo(powerBank[0]);
  }
  return false;
};
