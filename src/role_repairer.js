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
  // if (room.storage) {datas.maxEnergyUsed = (room.storage.store.energy / 10000) * 250;}
};

roles.repairer.boostActions = ['repair'];

// TODO needs to be enabled again, repair overwrites target
// module.exports.action = function(creep) {
//  return execute(creep);
// };

roles.repairer.execute = function(creep) {
  const execute = function(creep) {
    creep.setNextSpawn();
    creep.spawnReplacement(1);
    if (!creep.memory.move_wait) {
      creep.memory.move_wait = 0;
    }

    if (creep.memory.step <= 0) {
      const structures = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_WALL, STRUCTURE_RAMPART]);
      if (structures.length > 0) {
        let min = structures[0].hits;

        for (const i in structures) {
          if (min > structures[i].hits) {
            min = structures[i].hits;
          }
        }
        creep.memory.step = min;
      }
    }

    const methods = [Creep.getEnergy];
    methods.push(Creep.repairStructure);
    methods.push(Creep.constructTask);

    if (Creep.execute(creep, methods)) {
      return true;
    }
    return true;
  };

  return execute(creep);
};
