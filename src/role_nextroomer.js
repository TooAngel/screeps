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
  let message = `${name} ${JSON.stringify(creepMemory)}`;
  Game.notify(message);
  console.log('DIED:', message);
};

roles.nextroomer.getPartConfig = function(room, energy, heal, target) {
  var parts = [MOVE, WORK, MOVE, CARRY];
  var config = room.getPartConfig(energy, parts);
  return config;
};

roles.nextroomer.energyRequired = function(room) {
  return Math.min(700, room.energyCapacityAvailable - 50);
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

    var crl = creep.room.controller;
    if (crl) {
      var own = crl.owner ? crl.owner.username : '';
      var rsv = crl.reservation ? crl.reservation.username : '';
      if (own + rsv == 'AzuraStar') {
        creep.say('Not dismantle', true);
        break;
      }
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
