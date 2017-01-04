'use strict';

/*
 * upgrader upgrades the controller
 *
 * Gets the energy from the storage
 * Shouts out the player idiot values
 */

roles.upgrader = {};
roles.upgrader.settings = {
  //TODO found how to mix that with storage check
  param: ['controller.level','storage.store.energy','memory.enemies.length'],
  parts: {
    prefixParts: {1: [MOVE,CARRY,WORK]},
    layout: {1: [MOVE,WORK,WORK], 4: [WORK]},
    sufixParts: {4: {0: {1: [HEAL]}}}
  },
  energy: {
    minEnergyStored: {1: 200, 4: 1000},
    maxEnergyUsed: {1: 350, 7: {1: 350, 50000: 1950, 800000: 3900}}
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
  if (config.info.signController && !creep.room.controller.sign) {
    let text = 'Fully automated TooAngel bot: https://github.com/TooAngel/screeps';
    let returnCode = creep.signController(creep.room.controller, text);
    creep.log(returnCode);
  }

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
