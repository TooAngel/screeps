'use strict';

/*
 * repairer should be always present
 *
 * Repairs walls and ramparts
 */

// TODO get energy from links
// TODO move with the costmatrix

roles.repairer = {};

roles.repairer.settings = {
  layoutString: 'MWC',
  amount: [2, 1, 1],
  maxLayoutAmount: 5,
};

roles.repairer.boostActions = ['repair'];

roles.repairer.action = function(creep) {
  creep.setNextSpawn();
  creep.spawnReplacement(1);
  creep.pickupEnergy();
  if (!creep.memory.move_wait) {
    creep.memory.move_wait = 0;
  }

  if (creep.memory.step <= 0) {
    const structures = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_WALL, STRUCTURE_RAMPART]);
    if (structures.length > 0) {
      let min = WALL_HITS_MAX;

      for (const structure of structures) {
        if (min > structure.hits) {
          min = structure.hits;
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
