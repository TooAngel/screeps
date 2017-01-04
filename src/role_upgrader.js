'use strict';

/*
 * upgrader upgrades the controller
 *
 * Gets the energy from the storage
 * Shouts out the player idiot values
 */

roles.upgrader = {};

roles.upgrader.stayInRoom = true;
// TODO disabled because the upgrader took energy from the extension
roles.upgrader.buildRoad = false;
roles.upgrader.killPrevious = true;

roles.upgrader.boostActions = ['upgradeController'];

roles.upgrader.getPartConfig = function(room) {
  let datas = {layout: [MOVE, WORK, WORK],
    prefixParts: [MOVE, CARRY, WORK],
    minEnergyStored: 200,
    maxEnergyUsed: 350
  };
  if (room.controller.level >= 4) {
    datas.layout = [WORK];
    datas.minEnergyStored = 1000;
    if (room.controller.level >= 7) {
      if (room.storage) {
        if (room.storage.store.energy > 50000) {
          datas.maxEnergyUsed = 1950;
        }else if (room.storage.store.energy > 800000) {
          datas.maxEnergyUsed = 3900;
        }
      }
    }
  }
  return room.getPartConfig(datas);
};

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
