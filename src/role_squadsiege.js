'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Attacks structures, runs away if I will be destroyed (hopefully)
 */

roles.squadsiege = {};
roles.squadsiege.energyRequired = function(room) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.squadsiege.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, WORK];
  return room.getPartConfig(energy, parts).sort().reverse();
};

roles.squadsiege.energyBuild = function(room, energy) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.squadsiege.preMove = function(creep, directions) {
  if (!directions) {
    return false;
  }
  let posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
  let structures = posForward.lookFor(LOOK_STRUCTURES);
  for (let structure of structures) {
    if (structure.structureType == STRUCTURE_ROAD) {
      continue;
    }
    if (structure.structureType == STRUCTURE_RAMPART && structure.my) {
      continue;
    }

    creep.dismantle(structure);
    creep.say('dismantle');
    break;

  }

  if (creep.memory.squad) {
    if (!creep.memory.initialized) {
      Memory.squads[creep.memory.squad].siege[creep.id] = {};
      creep.memory.initialized = true;
    }
    var squad = Memory.squads[creep.memory.squad];
    if (squad.action == 'move') {
      if (creep.room.name == squad.moveTarget) {
        let nextExits = creep.room.find(creep.memory.routing.route[creep.memory.routing.routePos].exit);
        let nextExit = nextExits[Math.floor(nextExits.length / 2)];
        let range = creep.pos.getRangeTo(nextExit.x, nextExit.y);
        if (range < 2) {
          Memory.squads[creep.memory.squad].siege[creep.id].waiting = true;
          creep.moveRandom();
          return true;
        }
      }
    }
  }
  return false;
};

//TODO need to check if it works
roles.squadsiege.action = function(creep) {
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
