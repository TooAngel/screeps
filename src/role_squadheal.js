'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Heals creeps
 */

roles.squadheal = {};

roles.squadheal.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, HEAL];
  return room.getPartConfig(energy, parts).sort().reverse();
};

roles.squadheal.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 5100);
};

roles.squadheal.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 5100);
};

// TODO need to check if it works
roles.squadheal.action = function(creep) {
  var squad = Memory.squads[creep.memory.squad];
  if (!creep.memory.initialized) {
    squad.heal[creep.id] = {};
    creep.memory.initialized = true;
  }
  let reverse = false;
  if (squad.action == 'move') {
    if (creep.room.name == squad.moveTarget) {
      let nextExits = creep.room.find(creep.memory.route[creep.memory.routePos].exit);
      let nextExit = nextExits[Math.floor(nextExits.length / 2)];
      let range = creep.pos.getRangeTo(nextExit.x, nextExit.y);
      if (range < 4) {
        Memory.squads[creep.memory.squad].heal[creep.id].waiting = true;
        //        if (Math.random() > 0.5 * (range - 2)) {
        //          reverse = true;
        //        }
      }
    }
  }
  creep.squadHeal();
  return true;
};

roles.squadheal.execute = function(creep) {
  //  creep.log('Execute!!!');
};
