'use strict';

/*
 * planer builds up construction sites
 * 
 * Moves to the construction sites, does random walk to prevent traffic jam
 * builds up the structure
 */


roles.planer = {};
roles.planer.stayInRoom = true;

roles.planer.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, MOVE, WORK];
  return room.get_part_config(energy, parts);
};

roles.planer.energyBuild = function(room, energy) {
  return Math.max(250, Math.min(energy, 3000));
};

roles.planer.action = function(creep) {
  var methods = [Creep.getEnergy];
  if (creep.room.storage && creep.room.storage.store.energy > config.creep.energyFromStorageThreshold) {
    methods = [Creep.getEnergyFromStorage];
  }

  methods.push(Creep.constructTask);
  methods.push(Creep.buildRoads);
  if (creep.room.memory.misplacedSpawn) {
    methods.push(Creep.transferEnergy);
  } else {
    methods.push(Creep.recycleCreep);
  }
  methods.push(Creep.upgradeControllerTask);

  return Creep.execute(creep, methods);
};


roles.planer.execute = function(creep) {
  var methods = [Creep.getEnergy];
  if (creep.room.storage && creep.room.storage.store.energy > config.creep.energyFromStorageThreshold) {
    methods = [Creep.getEnergyFromStorage];
  }

  methods.push(Creep.constructTask);
  methods.push(Creep.buildRoads);
  if (creep.room.memory.misplacedSpawn) {
    methods.push(Creep.transferEnergy);
  } else {
    methods.push(Creep.recycleCreep);
  }
  methods.push(Creep.upgradeControllerTask);

  return Creep.execute(creep, methods);
};
