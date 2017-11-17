'use strict';

/*
 * extractor gets minerals from the extractor
 *
 * Moves, harvest, brings to the terminal
 */

roles.extractor = {};

roles.extractor.boostActions = ['harvest', 'capacity'];

roles.extractor.settings = {
  layoutString: 'MCW',
  amount: [5, 1, 4],
  maxLayoutAmount: 5,
};

function executeExtractor(creep) {
  return creep.handleExtractor();
}

// todo-msc preMove parts from sourcer
roles.extractor.preMove = function(creep, directions) {
  creep.pickupEnergy();
  if (creep.allowOverTake(directions)) {
    return true;
  }

  if (!creep.room.controller) {
    const target = creep.findClosestSourceKeeper();
    if (target !== null) {
      const range = creep.pos.getRangeTo(target);
      if (range > 6) {
        creep.memory.routing.reverse = false;
      }
      if (range < 6) {
        creep.memory.routing.reverse = true;
      }
    } else {
      // todo-msc if SourceKeeper is killed while reverse == true
      creep.memory.routing.reverse = false;
    }
  }
  if (!directions) {
    return false;
  }

  if (directions.forwardDirection) {
    const posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
    let terrain = posForward.lookFor(LOOK_TERRAIN);
    const structures = posForward.lookFor(LOOK_STRUCTURES);
    let structure;
    for (structure of structures) {
      if (structure.structureType === STRUCTURE_ROAD) {
        terrain = ['road'];
        continue;
      }
      if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
        continue;
      }
      if (structure.structureType === STRUCTURE_SPAWN && structure.my) {
        continue;
      }
      creep.dismantle(structure);
      creep.say('dismantle', true);
      break;
    }
    if (!creep.memory.last || creep.pos.x !== creep.memory.last.pos1.x || creep.pos.y !== creep.memory.last.pos1.y) {
      if (!creep.memory.pathDatas) {
        creep.memory.pathDatas = {swamp: 0, plain: 0, road: 0};
      }
      creep.memory.pathDatas[terrain[0]]++;
    }
  }
};

roles.extractor.action = executeExtractor;

roles.extractor.execute = executeExtractor;
