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
  parts: {layout: [MOVE, MOVE, RANGED_ATTACK, HEAL]},
  energy: {
    maxEnergyUsed: {1: 1000, 8: 6200},
    minEnergyStored: {8: 2000}
  }
};

roles.defender.action = function(creep) {
  if (creep.room.name == creep.memory.base && creep.memory.reverse) {
    return Creep.recycleCreep(creep);
  }
  // TODO Better in premove
  if (creep.room.name != creep.memory.base) {
    let walls = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: function(object) {
        if (object.structureType == STRUCTURE_WALL) {
          return true;
        }
        if (object.structureType == STRUCTURE_RAMPART) {
          return true;
        }
        return false;
      }
    });
    if (walls.length > 0) {
      if (!creep.room.controller || !creep.room.controller.my) {
        creep.rangedAttack(walls[0]);
      }
    }
  }

  creep.heal(creep);
  var room = Game.rooms[creep.room.name];
  if (room.memory.hostile) {
    creep.handleDefender();
    return true;
  }

  creep.handleDefender();
  return true;
};

roles.defender.preMove = function(creep, directions) {
  creep.heal(creep);
  let target = creep.findClosestEnemy();
  if (target !== null) {
    creep.handleDefender();
    return true;
  }
};

roles.defender.execute = function(creep) {
  creep.log('Execute!!!');
};
