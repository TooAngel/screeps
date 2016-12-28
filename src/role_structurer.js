'use strict';

/*
 * structurer is called when there are structures in a reserved room
 *
 * Checks the paths for blocking structures => dismantles them
 * Searches for other structures => dismantles them
 * If there is 'threshold' energy below structurer => call a carry
 */

roles.structurer = {};
roles.structurer.boostActions = ['dismantle'];
roles.structurer.energyRequired = function(room) {
  return 1500;
};

roles.structurer.energyBuild = function(room, energy) {
  return Math.min(energy, 3750);
};

roles.structurer.getPartConfig = function(room, energy, heal) {
  let datas = {layout: [MOVE, WORK]};
  return room.getPartConfig(energy, datas);
};

roles.structurer.preMove = function(creep, directions) {
  if (creep.room.name == creep.memory.routing.targetRoom) {
    creep.log('preMove: ' + creep.memory.routing.targetId);
    let target = Game.getObjectById(creep.memory.routing.targetId);
    creep.log(target);
    if (target === null) {
      creep.log('Invalid target');
      delete creep.memory.routing.targetId;
    }
  }

  // Routing would end within the wall - this is the fix for that
  if (creep.memory.routing.targetId && creep.room.name == creep.memory.routing.targetRoom) {
    let target = Game.getObjectById(creep.memory.routing.targetId);
    if (target === null) {
      delete creep.memory.routing.targetId;
      return true;
    }
    if (creep.pos.getRangeTo(target.pos) <= 1) {
      creep.memory.routing.reached = true;
    }
  }
};

roles.structurer.action = function(creep) {
  if (!creep.room.controller || !creep.room.controller.my) {
    var structure;
    structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.ticksToDecay === null) {
          return false;
        }
        if (object.structureType == 'controller') {
          return false;
        }
        if (object.structureType == 'road') {
          return false;
        }
        return true;
      }
    });
    creep.dismantle(structure);
  }

  creep.spawnReplacement();
  creep.handleStructurer();
  return true;
};

roles.structurer.execute = function(creep) {
  creep.log('Execute!!!');
  if (!creep.memory.routing.targetId) {
    return creep.cleanSetTargetId();
  }
};
