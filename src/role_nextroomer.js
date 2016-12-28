'use strict';

/*
 * nextroomer is used to build up rooms
 *
 * Bring the controller to level 3 after that build constructionSites
 * and continue upgrading.
 *
 * If the room is 'underSiege', build a tower next to a source, build ramparts
 * and fill the tower.
 */

roles.nextroomer = {};

roles.nextroomer.died = function(name, creepMemory) {
  let roomName = creepMemory.routing.route[creepMemory.routing.route].room;
  let message = `${name} ${roomName} ${JSON.stringify(creepMemory)}`;
  if (roomName == creepMemory.routing.targetRoom) {
    // TODO make underSiege to a counter
  }
  console.log('DIED:', message);
};

roles.nextroomer.getPartConfig = function(room, energy, heal) {
  let datas = {layout: [MOVE, MOVE, WORK, CARRY]};
  return room.getPartConfig(energy, datas);
};

roles.nextroomer.energyRequired = function(room) {
  return Math.min(700, room.getEnergyCapacityAvailable());
};

roles.nextroomer.energyBuild = function(room, energy) {
  return Math.min(3150, energy);
};

roles.nextroomer.preMove = function(creep, directions) {
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
};

roles.nextroomer.action = function(creep) {
  // TODO when does this happen?
  if (creep.room.name != creep.memory.routing.targetRoom) {
    delete creep.memory.routing.reached;
    return false;
  }

  // TODO ugly fix cause, target gets deleted
  creep.memory.targetBackup = creep.memory.targetBackup || creep.memory.target;
  if (creep.room.name == creep.memory.targetBackup) {
    return creep.handleNextroomer();
  }
  return creep.handleNextroomer();
};

roles.nextroomer.execute = function(creep) {
  creep.log('Execute!!!');
  creep.moveTo(25, 25);
};
