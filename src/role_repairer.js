'use strict';

/*
 * repairer should be always present
 *
 * Repairs walls and ramparts
 */

// TODO get energy from links
// TODO move with the CostMatrix

roles.repairer = {};

roles.repairer.settings = {
  layoutString: 'MWC',
  amount: [2, 1, 1],
  maxLayoutAmount: 5,
};

roles.repairer.boostActions = ['repair', 'capacity'];

roles.repairer.preMove = function(creep) {
  creep.memory.routing.reached = true;
  if (creep.memory.routing && creep.memory.routing.targetId) {
    if (Game.getObjectById(creep.memory.routing.targetId) === null) {
      creep.creepLog('target does not exist anymore');
      delete creep.memory.routing.targetId;
      roles.repairer.action(creep);
      return true;
    }
  }
};

roles.repairer.action = function(creep) {
  if (creep.pos.roomName !== creep.memory.base) {
    creep.log(`Not in my base room why? ${creep.memory.routing.targetId} carry: ${JSON.stringify(creep.carry)} positions: ${JSON.stringify(creep.memory.lastPositions)}`);
  }
  creep.setNextSpawn();
  creep.spawnReplacement(1);
  creep.pickupEnergy();
  if (!creep.memory.move_wait) {
    creep.memory.move_wait = 0;
  }

  if (creep.memory.step <= 0) {
    const structures = creep.room.findDefenseStructures();
    let min = WALL_HITS_MAX;
    if (structures.length > 0) {
      for (const structure of structures) {
        if (min > structure.hits) {
          min = structure.hits;
        }
      }
    }
    creep.memory.step = min;
  }

  const methods = [Creep.getEnergy];
  methods.push(Creep.repairStructure);
  methods.push(Creep.constructTask);

  if (Creep.execute(creep, methods)) {
    return true;
  }
  return true;
};
