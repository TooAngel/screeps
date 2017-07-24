'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Attacks structures, runs away if I will be destroyed (hopefully)
 */

roles.squadsiege = {};

roles.squadsiege.settings = {
  layoutString: 'MW',
  maxLayoutAmount: 21
};

roles.squadsiege.dismantleSurroundingStructures = function(creep, directions) {
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
};

roles.squadsiege.preMove = function(creep, directions) {
  creep.log('preMove');
  if (!directions) {
    return false;
  }
  roles.squadsiege.dismantleSurroundingStructures(creep, directions);
  if (creep.memory.squad) {
    if (!creep.memory.initialized) {
      Memory.squads[creep.memory.squad].siege[creep.id] = {};
      creep.memory.initialized = true;
    }
    var squad = Memory.squads[creep.memory.squad];
    if (squad.action === 'move') {
      if (creep.squadMove(squad, 2, true, 'siege')) {
        return true;
      }
    }
  }
  return false;
};

//TODO need to check if it works
roles.squadsiege.action = function(creep) {
  creep.say('action');
  if (creep.room.name !== creep.memory.routing.targetRoom) {
    if (creep.hits < creep.hitsMax) {
      creep.moveRanom();
    } else {
      delete creep.memory.routing.reached;
    }
  }
  creep.siege();
};

roles.squadsiege.execute = function(creep) {
  creep.log('Execute!!!');
};
