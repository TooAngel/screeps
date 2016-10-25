'use strict';

// TODO get energy from links
// TODO move with the costmatrix

module.exports.stayInRoom = true;

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [CARRY, MOVE, WORK, MOVE];
  return room.get_part_config(energy, parts);
};

module.exports.energyBuild = function(room, energy) {
  if (room.storage) {
    return Math.max(250, Math.min(energy, Math.ceil(room.storage.store.energy / 10000) * 250));
  }
  return Math.max(250, energy);
};

module.exports.boostActions = ['repair'];

let execute = function(creep) {
  var structures;
  var structure;
  var i;

  creep.setNextSpawn();
  creep.spawnReplacement(1);
  if (!creep.memory.move_wait) {
    creep.memory.move_wait = 0;
  }

  if (creep.memory.step <= 0) {
    structures = creep.room.find(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.structureType == 'constructedWall') {
          return true;
        }

        if (object.structureType == 'rampart') {
          return true;
        }
        return false;
      }
    });
    if (structures.length > 0) {
      var min = structures[0].hits;

      for (i in structures) {
        if (min > structures[i].hits) {
          min = structures[i].hits;
        }
      }
      creep.memory.step = min;
    }
  }

  var methods = [Creep.getEnergy];
  if (creep.room.controller.level >= 5 && creep.room.storage && creep.room.storage.store.energy > config.creep.energyFromStorageThreshold) {
    methods = [Creep.getEnergyFromStorage];
  }

  methods.push(Creep.repairStructure);
  methods.push(Creep.constructTask);

  if (Creep.execute(creep, methods)) {
    return true;
  }
  return true;
};

// TODO needs to be enabled again, repair overwrites target
//module.exports.action = function(creep) {
//  return execute(creep);
//};

module.exports.execute = function(creep) {
  return execute(creep);
};
