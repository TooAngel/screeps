'use strict';

/*
 * Called to defend external rooms
 *
 * Fights against hostile creeps
 */

roles.defender = {};
roles.defender.boostActions = ['rangedAttack', 'heal'];

roles.defender.settings = {
  param: ['controller.level'],
  layoutString: 'MRH',
  amount: {
    1: [2, 1, 1],
    8: [4, 1, 1],
  },
  // fillTough: true,
};

roles.defender.preMove = function(creep) {
  creep.selfHeal();
  const target = creep.findClosestEnemy();
  if (target !== null) {
    creep.creepLog(`preMove foundClosestEnemy ${target}`);
    creep.handleDefender();
    return true;
  }
  if (!creep.inMyRoom()) {
    let targets = creep.pos.findInRangeStructures(FIND_HOSTILE_STRUCTURES);
    if (targets.length === 0) {
      targets = creep.pos.findInRangeStructures(FIND_STRUCTURES, 1, [STRUCTURE_WALL, STRUCTURE_RAMPART]);
    }
    creep.rangeAttackOutsideOfMyRooms(targets);
  }
};

roles.defender.action = function(creep) {
  if (creep.inBase() && creep.memory.reverse) {
    return Creep.recycleCreep(creep);
  }

  creep.selfHeal();
  creep.handleDefender();
  return true;
};
