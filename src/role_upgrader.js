'use strict';

/*
 * upgrader upgrades the controller
 *
 * Gets the energy from the storage
 * Shouts out the player idiot values
 */

roles.upgrader = {};
roles.upgrader.settings = {
  param: ['controller.level'],
  prefixString: {
    1: 'MCW',
  },
  layoutString: {
    1: 'MW',
  },
  amount: {
    4: [1, 2],
  },
  maxLayoutAmount: {
    1: 10,
    8: 1,
  },
};

roles.upgrader.updateSettings = function(room, creep) {
  if (!room.storage) {
    return false;
  }
  // One work part one energy per tick multiplied by config value with  lifetime
  // So have at least a specific amount of energy in storage that the upgrader
  // can use.
  // Example with upgraderStorageFactor 2:
  // 6453 energy in storage are 2 workParts
  // 3000 energy will be put in the controller

  const maxWorkingParts = _.random(36, 48);
  let workParts = Math.floor((room.storage.store.energy + 1) / (CREEP_LIFE_TIME * config.room.upgraderStorageFactor));
  workParts = Math.min(workParts, maxWorkingParts - 1);
  if (room.controller.level === 8) {
    workParts = Math.min(workParts, 15);
  }
  const maxLayoutAmount = Math.max(0, Math.floor((workParts - 1) / 2));
  if (config.debug.upgrader) {
    room.log(`upgrader updateSettings - storage.energy: ${room.storage.store.energy} upgraderStorageFactor: ${config.room.upgraderStorageFactor} workParts: ${workParts} maxLayoutAmount: ${maxLayoutAmount}`);
  }
  return {
    maxLayoutAmount: maxLayoutAmount,
  };
};

// disabled because the upgrader took energy from the extension
roles.upgrader.buildRoad = false;
roles.upgrader.killPrevious = true;

roles.upgrader.boostActions = ['upgradeController'];

roles.upgrader.work = function(creep) {
  creep.pickupEnergy();
  return creep.handleUpgrader();
};

roles.upgrader.action = function(creep) {
  creep.mySignController();
  creep.pickupEnergy();
  if (!creep.memory.routing.targetId && creep.memory.routing.reached) {
    creep.memory.routing.reached = false;
    creep.memory.routing.targetId = creep.room.controller.id;
  }
  if (creep.memory.routing.reached && creep.memory.routing.pathPos === 0) {
    creep.memory.routing.reached = false;
  }
  return creep.handleUpgrader();
};
