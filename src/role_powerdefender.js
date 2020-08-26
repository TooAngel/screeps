'use strict';

/*
 * powerdefender is called when hostile creeps show up on power harvesting
 *
 * Kills hostile creeps
 */

roles.powerdefender = {};

roles.powerdefender.settings = {
  layoutString: 'MR',
  maxLayoutAmount: 16,
  fillTough: true,
};

roles.powerdefender.action = function(creep) {
  if (creep.hits < 200) {
    return false;
  }
  const hostileCreeps = creep.room.findEnemys();
  if (hostileCreeps.length > 0) {
    creep.moveTo(hostileCreeps[0]);
    creep.rangedAttack(hostileCreeps[0]);
    return true;
  }
  const powerBank = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);
  if (powerBank.length === 0) {
    const hostileCreep = creep.findClosestEnemy();
    if (hostileCreep !== null) {
      creep.moveTo(hostileCreep);
      creep.rangedAttack(hostileCreep);
      return true;
    }
    creep.moveTo(25, 25);
    return false;
  }

  if (powerBank[0].hits > 100000) {
    creep.spawnReplacement();
  }

  creep.setNextSpawn();

  creep.moveTo(powerBank[0]);
  creep.rangedAttack(powerBank[0]);
  return true;
};
