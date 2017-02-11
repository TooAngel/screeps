'use strict';

/*
 * repairer should be always present
 *
 * Repairs walls and ramparts
 */

// TODO get energy from links
// TODO move with the costmatrix

roles.repairer = {};

roles.repairer.stayInRoom = true;

roles.repairer.settings = {
  layoutString: 'MWC',
  amount: [2, 1, 1],
  //if (room.storage) {datas.maxEnergyUsed = (room.storage.store.energy / 10000) * 250;}
};

roles.repairer.boostActions = ['repair'];

// TODO needs to be enabled again, repair overwrites target
//module.exports.action = function(creep) {
//  return execute(creep);
//};

roles.repairer.execute = function(creep) {
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
          if (object.structureType === 'constructedWall') {
            return true;
          }

          if (object.structureType === 'rampart') {
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
    methods.push(Creep.repairStructure);
    methods.push(Creep.constructTask);

    if (Creep.execute(creep, methods)) {
      return true;
    }
    return true;
  };

  return execute(creep);
};
