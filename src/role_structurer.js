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
  amount: [5, 5],
};

roles.structurer.preMove = function(creep, directions) {
  if (creep.room.name === creep.memory.routing.targetRoom) {
    const target = Game.getObjectById(creep.memory.routing.targetId);
    if (target === null) {
      creep.log('Invalid target');
      delete creep.memory.routing.targetId;
    }

    if (directions && directions.forwardDirection) {
      const posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
      const structures = posForward.lookFor(LOOK_STRUCTURES);
      for (const structure of structures) {
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
    const target = Game.getObjectById(creep.memory.routing.targetId);
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
    const structure = creep.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_ROAD], {
      filter: (object) => object.ticksToDecay !== null,
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
