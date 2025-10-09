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
 * For RCL < 8:
 * One work part one energy per tick multiplied by config value with lifetime
 * So have at least a specific amount of energy in storage that the upgrader
 * can use.
 * Example with upgraderStorageFactor 2:
 * 6453 energy in storage are 2 workParts
 * 3000 energy will be put in the controller
 *
 * For RCL 8:
 * Linear scaling based on storage energy:
 * 10k storage → 1 WORK part (1 energy/tick)
 * 800k storage → 15 WORK parts (15 energy/tick, max)
 *
 * @param {object} room
 * @return {boolean|{maxLayoutAmount: number}}
 */
roles.upgrader.updateSettings = function(room) {
  if (!room.storage) {
    return false;
  }

  let workParts;

  if (room.controller.level === 8) {
    // Linear scaling for RCL 8: uses config.room.upgraderRcl8MinStorage → 1 WORK, config.room.upgraderRcl8MaxStorage → 15 WORK
    const minStorage = config.room.upgraderRcl8MinStorage;
    const maxStorage = config.room.upgraderRcl8MaxStorage;
    const minParts = 1;
    const maxParts = CONTROLLER_MAX_UPGRADE_PER_TICK;

    if (room.storage.store.energy <= minStorage) {
      workParts = minParts;
    } else if (room.storage.store.energy >= maxStorage) {
      workParts = maxParts;
    } else {
      workParts = minParts + Math.floor((room.storage.store.energy - minStorage) / (maxStorage - minStorage) * (maxParts - minParts));
    }
  } else {
    // Keep existing formula for RCL < 8
    workParts = Math.floor((room.storage.store.energy + 1) / (CREEP_LIFE_TIME * config.room.upgraderStorageFactor));
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
  // Stop upgrading when trapped - let controller die
  if (Memory.trapped && Memory.trapped.isTrapped) {
    return true;
  }
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
