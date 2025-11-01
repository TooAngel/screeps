'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Attacks structures, runs away if I will be destroyed (hopefully)
 */

roles.squadsiege = {};

roles.squadsiege.settings = {
  layoutString: 'MW',
  maxLayoutAmount: 21,
  fillTough: true,
};

roles.squadsiege.dismantleSurroundingStructures = function(creep, directions) {
  if (!directions || !directions.forwardDirection) {
    return false;
  }
  const posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
  const structures = posForward.lookFor(LOOK_STRUCTURES);
  const ramparts = [];
  const walls = [];
  for (const structure of structures) {
    if (structure.my) {
      continue;
    }
    switch (structure.structureType) {
    case STRUCTURE_ROAD:
    case STRUCTURE_CONTROLLER:
    case STRUCTURE_KEEPER_LAIR:
      continue;
    case STRUCTURE_RAMPART:
      ramparts.push(structure);
      continue;
    case STRUCTURE_WALL:
      walls.push(structure);
      continue;
    default:
      // do nothing
    }
    creep.dismantle(structure);
    creep.say('dismantle : ' + structure.id);
    return true;
  }
  // if no any other better structures to dismantle, we can only go for rampart and wall...
  if (ramparts.length) {
    creep.dismantle(ramparts[0]);
    creep.say('dismantle : ' + ramparts[0].id);
    return true;
  }
  if (walls.length) {
    creep.dismantle(walls[0]);
    creep.say('dismantle : ' + walls[0].id);
    return true;
  }
  return false;
};

roles.squadsiege.preMove = function(creep, directions) {
  // creep.log('preMove');
  if (!directions) {
    return false;
  }
  roles.squadsiege.dismantleSurroundingStructures(creep, directions);
  if (creep.memory.squad) {
    creep.initializeSquadMembership('siege');
    const squad = Memory.squads[creep.memory.squad];
    if (squad.action === 'move') {
      if (creep.squadMove(squad, 2, true, 'siege')) {
        return true;
      }
    }
  }
  return false;
};

roles.squadsiege.action = function(creep) {
  creep.say('action');

  if (creep.room.name !== creep.memory.routing.targetRoom) {
    // Not in target room yet - traveling
    if (creep.hits < creep.hitsMax) {
      creep.moveRandom();
    } else if (!creep.pos.isBorder(-1)) {
      // Only reset routing if not at border to prevent bouncing
      delete creep.memory.routing.reached;
    }
    return true; // Don't execute siege when traveling
  }

  // In target room - execute siege action
  return creep.siege();
};
