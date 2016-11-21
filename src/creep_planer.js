'use strict';

module.exports.stayInRoom = true;

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, MOVE, WORK];
  return room.get_part_config(energy, parts);
};

module.exports.energyBuild = function(room, energy) {
  return Math.max(250, Math.min(energy, 3000));
};

module.exports.action = function(creep) {
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


module.exports.execute = function(creep) {
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
