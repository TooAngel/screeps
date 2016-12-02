'use strict';

/*
 * squadsiege is part of a squad to attack a room
 * 
 * Attacks structures, runs away if I will be destroyed (hopefully)
 * 
 */

roles.squadsiege = {};
roles.squadsiege.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

roles.squadsiege.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, WORK];
  return room.get_part_config(energy, parts).sort().reverse();
};

roles.squadsiege.get_part_config = roles.squadsiege.getPartConfig;

roles.squadsiege.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

//TODO need to check if it works
roles.squadsiege.action = function(creep) {
  if (!creep.memory.initialized) {
    Memory.squads[creep.memory.squad].siege[creep.id] = {};
    creep.memory.initialized = true;
  }
  var squad = Memory.squads[creep.memory.squad];
  if (squad.action == 'move') {
    if (creep.room.name == squad.moveTarget) {
      let nextExits = creep.room.find(creep.memory.route[creep.memory.routePos].exit);
      let nextExit = nextExits[Math.floor(nextExits.length / 2)];
      let range = creep.pos.getRangeTo(nextExit.x, nextExit.y);
      if (range < 2) {
        Memory.squads[creep.memory.squad].siege[creep.id].waiting = true;
        return true;
      }
    }
  }
  this.siege();
  return true;
};

roles.squadsiege.execute = function(creep) {
  creep.log('Execute!!!');
};
