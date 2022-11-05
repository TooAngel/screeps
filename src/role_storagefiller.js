'use strict';

/*
 * storagefiller should be present on RCL > 4
 *
 * Gets the energy from the link and transfers it to the tower or storage
 *
 */

roles.storagefiller = {};
roles.storagefiller.killPrevious = true;

roles.storagefiller.settings = {
  layoutString: 'MC',
  amount: [1, 4],
  maxLayoutAmount: 1,
};

/**
 * transferFromLink
 * @param {object} creep
 * @return {boolean}
 */
function transferFromLink(creep) {
  const tower = getTower(creep);
  const link = creep.getCloseByLink();
  if (!link) {
    creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
    creep.transfer(tower, RESOURCE_ENERGY);
    return true;
  }

  creep.withdraw(link, RESOURCE_ENERGY);
  if (tower && tower.store.getFreeCapacity(RESOURCE_ENERGY) > creep.store[RESOURCE_ENERGY]) {
    creep.transfer(tower, RESOURCE_ENERGY);
    return true;
  }

  const result = creep.transfer(creep.room.storage, RESOURCE_ENERGY);
  return result === OK;
}

/**
 * getTower - Gets the tower from heap data, or sets if missing
 *
 * @param {object} creep - The creep
 * @return {object} - The tower
 **/
function getTower(creep) {
  if (!creep.data.tower) {
    const structures = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType: STRUCTURE_TOWER}});
    if (structures.length === 0) {
      return;
    }
    creep.data.tower = structures[0].id;
  }
  return Game.getObjectById(creep.data.tower);
}

/**
 * getPowerSpawn - Gets the powerSpawn from heap data, or sets if missing
 *
 * @param {object} creep - The creep
 * @return {object} - The powerSpawn
 **/
function getPowerSpawn(creep) {
  if (!creep.data.powerSpawn) {
    const structures = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType: STRUCTURE_POWER_SPAWN}});
    if (structures.length === 0) {
      return;
    }
    creep.data.powerSpawn = structures[0].id;
  }
  return Game.getObjectById(creep.data.powerSpawn);
}

roles.storagefiller.action = function(creep) {
  creep.setNextSpawn();
  creep.spawnReplacement(1);

  if (transferFromLink(creep)) {
    return true;
  }

  if (creep.room.controller.level === 8) {
    const powerSpawn = getPowerSpawn(creep);
    if (powerSpawn) {
      if (creep.room.storage.store[RESOURCE_POWER] > 0) {
        creep.withdraw(creep.room.storage, RESOURCE_POWER);
        creep.transfer(powerSpawn, RESOURCE_POWER);
      }
    }
  }
  return true;
};
