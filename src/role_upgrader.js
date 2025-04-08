'use strict';

/*
 * upgrader upgrades the controller
 *
 * Gets the energy from the storage
 */

roles.upgrader = {};
roles.upgrader.settings = {
  param: ['controller.level'],
  prefixString: {
    1: 'MCW',
  },
  layoutString: {
    1: 'W',
  },
  maxLayoutAmount: {
    1: 50,
  },
};

/**
 * updateSettings
 *
 * One work part one energy per tick multiplied by config value with  lifetime
 * So have at least a specific amount of energy in storage that the upgrader
 * can use.
 * Example with upgraderStorageFactor 2:
 * 6453 energy in storage are 2 workParts
 * 3000 energy will be put in the controller
 *
 * @param {object} room
 * @return {boolean|{maxLayoutAmount: number}}
 */
roles.upgrader.updateSettings = function(room) {
  if (!room.storage) {
    return false;
  }

  let workParts = Math.floor((room.storage.store.energy + 1) / (CREEP_LIFE_TIME * config.room.upgraderStorageFactor));
  if (room.controller.level === 8) {
    workParts = Math.min(workParts, CONTROLLER_MAX_UPGRADE_PER_TICK);
  }
  const maxLayoutAmount = Math.max(0, workParts - 1);
  if (config.debug.upgrader) {
    room.log(`upgrader updateSettings - storage.energy: ${room.storage.store.energy} upgraderStorageFactor: ${config.room.upgraderStorageFactor} workParts: ${workParts} maxLayoutAmount: ${maxLayoutAmount}`);
  }
  return {
    maxLayoutAmount: maxLayoutAmount,
  };
};

roles.upgrader.killPrevious = true;
roles.upgrader.boostActions = ['upgradeController'];

roles.upgrader.action = function(creep) {
  creep.mySignController();
  creep.spawnReplacement(1);
  if (!creep.room.controller.isAboutToDowngrade()) {
    if (creep.room.isUnderAttack()) {
      return true;
    }
    if (creep.room.storage && creep.room.storage.isLow()) {
      return true;
    }
  }

  creep.upgradeController(creep.room.controller);
  creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
  return true;
};
