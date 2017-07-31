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
  maxLayoutAmount: {
    6: {
      0: 1,
      50000: 20,
      800000: undefined
    },
    7: {
      0: 1,
      50000: 20,
      800000: undefined,
    },
    8: {
      0: 1,
      50000: 1,
      800000: 14
    }
  }
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
