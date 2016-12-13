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

roles.upgrader.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, CARRY, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, WORK];
  return room.getPartConfig(energy, parts);
};

roles.upgrader.energyRequired = function(room) {
  var energyNeeded = 200;
  return energyNeeded;
};

roles.upgrader.energyBuild = function(room, energy) {
  if (room.controller.level >= 7) {
    if (room.storage && room.storage.store.energy < 50000) {
      return 350;
    }
    // TODO extract room.energyCapacityAvailable to a new method, which takes into account if the spawn is at the wrong place (-300) or the base is setup (-0)
    return Math.min(1950, room.energyCapacityAvailable - 300);
  }
  var energyNeeded = 200;
  if (room.controller.level < 7) {
    energyNeeded = Math.min(1950, room.energyCapacityAvailable - 300);
  }
  if (room.controller.level == 7) {
    // TODO Better calculation for the upgrader size
    //    energyNeeded = Math.min(3900, energy);
  }
  if (room.storage) {
    if (room.storage.store.energy > 800000) {
      return Math.min(3900, room.energyCapacityAvailable - 300);
    }
    if (room.storage.store.energy < 10000) {
      return 350;
    }
  }
  return energyNeeded;
};

roles.upgrader.work = function(creep) {
  return creep.handleUpgrader();
};

roles.upgrader.action = function(creep) {
  if (!creep.memory.routing.targetId && creep.memory.routing.reached) {
    creep.memory.routing.reached = false;
    creep.memory.routing.targetId = creep.room.controller.id;
  }
  if (creep.memory.routing.reached && creep.memory.routing.routePos === 0) {
    creep.memory.routing.reached = false;
  }
  return creep.handleUpgrader();
};

roles.upgrader.execute = function(creep) {
  creep.log('Execute!!!');
};
