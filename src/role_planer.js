'use strict';

/*
 * planer builds up construction sites
 *
 * Moves to the construction sites, does random walk to prevent traffic jam
 * builds up the structure
 */

roles.planer = {};

roles.planer.settings = {
  layoutString: 'MCW',
  amount: [2, 1, 1],
};

roles.planer.action = function(creep) {
  if (creep.getEnergy()) {
    return true;
  }
  if (creep.construct()) {
    creep.creepLog('construct');
    return true;
  }
  if (creep.room.memory.misplacedSpawn) {
    if (creep.transferEnergyMy()) {
      return true;
    }
    if (creep.repairStructure()) {
      return true;
    }
  } else {
    if (creep.recycleCreep()) {
      return true;
    }
  }
  if (creep.repairStructure()) {
    return true;
  }

  return creep.upgradeControllerTask();
};
