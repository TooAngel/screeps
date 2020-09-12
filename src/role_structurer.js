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


/**
 * dismantleStructure - Dismantles structures in moving direction
 *
 * @param {object} creep - The creep object
 * @param {object} structure - The structure to check and dismantle
 * @return {boolean} - Dismantling
 **/
function dismantleStructure(creep, structure) {
  if (structure.structureType === STRUCTURE_ROAD) {
    return false;
  }
  if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
    return false;
  }

  creep.say('dismantle');
  creep.dismantle(structure);
  return true;
}


/**
 * findAndDismantleStructure - Finds and dismantles strucutes
 *
 * @param {object} creep - The creep object
 * @param {object} directions - The directions object
 * @return {void}
 **/
function findAndDismantleStructure(creep, directions) {
  if (!directions || !directions.forwardDirection) {
    return;
  }
  const posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
  const structures = posForward.lookFor(LOOK_STRUCTURES);
  for (const structure of structures) {
    if (dismantleStructure(creep, structure)) {
      break;
    }
  }
  return;
}

/**
 * preMoveTargetRoom - preMove in targetRoom
 *
 * @param {object} creep - The creep object
 * @param {object} directions - The directions object
 * @return {void}
 **/
function preMoveTargetRoom(creep, directions) {
  if (creep.room.name !== creep.memory.routing.targetRoom) {
    return;
  }

  const target = Game.getObjectById(creep.memory.routing.targetId);
  if (target === null) {
    creep.log('Invalid target');
    delete creep.memory.routing.targetId;
  }

  findAndDismantleStructure(creep, directions);
}

roles.structurer.preMove = function(creep, directions) {
  creep.creepLog(`preMove: targetId: ${creep.memory.routing.targetId}`);
  preMoveTargetRoom(creep, directions);

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
  creep.creepLog('action');
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
