'use strict';

/*
 * upgrader upgrades the controller
 *
 * Gets the energy from the storage
 * Shouts out the player idiot values
 */

roles.upgrader = {};
roles.upgrader.settings = {
  param: ['controller.level', 'storage.store.energy', 'memory.enemies.length'],
  prefixString: {
    1: 'MCW'
  },
  layoutString: {
    1: 'MWW',
    4: 'W'
  },
  amount: {
    4: [1]
  }
};

roles.upgrader.updateSettings = function(room, creep) {
  // One work part one energy per tick multiplied by config value with  lifetime
  // So have at least a specific amount of energy in storage that the upgrader
  // can use.
  // Example with upgraderStorageFactor 2:
  // 6453 energy in storage are 2 workParts
  // 3000 energy will be put in the controller
  let workParts = Math.floor((room.storage.store.energy + 1) / (CREEP_LIFE_TIME * config.room.upgraderStorageFactor));
  workParts = Math.min(workParts, 47);
  if (room.controller.level === 8) {
    workParts = Math.min(workParts, 15);
  }
  const maxLayoutAmount = Math.max(0, workParts - 1);
  if (config.debug.upgrader) {
    room.log(`upgrader updateSettings - storage.energy: ${room.storage.store.energy} upgraderStorageFactor: ${config.room.upgraderStorageFactor} workParts: ${workParts} maxLayoutAmount: ${maxLayoutAmount}`);
  }
  return {
    maxLayoutAmount: maxLayoutAmount
  };
};

roles.upgrader.stayInRoom = true;
// TODO disabled because the upgrader took energy from the extension
roles.upgrader.buildRoad = false;
roles.upgrader.killPrevious = true;

roles.upgrader.boostActions = ['upgradeController'];

roles.upgrader.work = function(creep) {
  return creep.handleUpgrader();
};

roles.upgrader.action = function(creep) {
  creep.mySignController();

  if (!creep.memory.routing.targetId && creep.memory.routing.reached) {
    creep.memory.routing.reached = false;
    creep.memory.routing.targetId = creep.room.controller.id;
  }
  if (creep.memory.routing.reached && creep.memory.routing.pathPos === 0) {
    creep.memory.routing.reached = false;
  }
  return creep.handleUpgrader();
};

roles.upgrader.execute = function(creep) {
  creep.log('Execute!!!');
};
