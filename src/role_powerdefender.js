'use strict';

/*
 * powerdefender is called when hostile creeps show up on power harvesting
 *
 * Kills hostile creeps
 */

roles.powerdefender = {};

roles.powerdefender.getPartConfig = function(room) {
  let datas = {layout: [MOVE, RANGED_ATTACK],
    maxEnergyUsed: 3250};
  return room.getPartConfig(datas);
};

roles.powerdefender.action = function(creep) {
  if (creep.hits < 200) {
    return false;
  }
  let hostileCreeps = creep.room.getEnemys();
  if (hostileCreeps.length > 0) {
    creep.moveTo(hostileCreeps[0]);
    creep.rangedAttack(hostileCreeps[0]);
    return true;
  }

  var powerBank = creep.room.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_POWER_BANK;
    }
  });

  if (powerBank.length === 0) {
    let hostileCreep = creep.findClosestEnemy();
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

roles.powerdefender.execute = function(creep) {
  creep.log('Execute!!!');
};
