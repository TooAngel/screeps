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

roles.structurer.settings = {
  layoutString: 'MW',
  amount: [5, 5]
};

roles.structurer.preMove = function(creep, directions) {
  if (creep.room.name === creep.memory.routing.targetRoom) {
    let target = Game.getObjectById(creep.memory.routing.targetId);
    if (target === null) {
      creep.log('Invalid target');
      delete creep.memory.routing.targetId;
    }

    if (directions && directions.forwardDirection) {
      let posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
      let structures = posForward.lookFor(LOOK_STRUCTURES);
      for (let structure of structures) {
        if (structure.structureType === STRUCTURE_ROAD) {
          continue;
        }
        if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
          continue;
        }

        creep.dismantle(structure);
        creep.say('dismantle');
        break;
      }
    }
  }

  // Routing would end within the wall - this is the fix for that
  if (creep.memory.routing.targetId && creep.room.name === creep.memory.routing.targetRoom) {
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
        if (object.structureType === 'controller') {
          return false;
        }
        if (object.structureType === 'road') {
          return false;
        }
        return true;
      }
    });
    creep.dismantle(structure);
  }

  creep.spawnReplacement(1);
  creep.handleStructurer();
  return true;
};

roles.structurer.execute = function(creep) {
  creep.log('Execute!!!');
  if (!creep.memory.routing.targetId) {
    return creep.cleanSetTargetId();
  }
};
