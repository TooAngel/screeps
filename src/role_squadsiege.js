'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Attacks structures, runs away if I will be destroyed (hopefully)
 */

roles.squadsiege = {};

roles.squadsiege.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, WORK];
  return room.getPartConfig(energy, parts).sort().reverse();
};

roles.squadsiege.energyRequired = function(room) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.squadsiege.energyBuild = function(room, energy) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.squadsiege.died = function(name, memory) {
  console.log('--->', name, 'Died naturally?');
  delete Memory.squads[Memory.creeps.name.squad].heal[Memory.creeps.name.id];
  delete Memory.creeps[name];
};

roles.squadsiege.preMove = function(creep, directions) {
  return false;
};

roles.squadsiege.action = function(creep) {
  creep.memory.hitsLost = creep.memory.hitsLast - creep.hits;
  creep.memory.hitsLast = creep.hits;
  if (creep.hits - creep.memory.hitsLost < creep.hitsMax / 1.5 && creep.room.name == creep.memory.routing.targetRoom && creep.memory.squad) {
    creep.say('Run Away!', true);
    let healer = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function(object) {
        return object.memory.role == 'squadheal';
      }
    });
    if (healer) {
      var healerRangeToTower = healer.pos.getRangeTo(creep.pos.findClosestByRange(STRUCTURE_TOWER));
      if (healerRangeToTower > creep.pos.getRangeTo(creep.pos.findClosestByRange(STRUCTURE_TOWER))) {
        creep.moveTo(healer, {
          reusePath: 0,
          ignoreCreeps: true
        });
        return true;
      }
    }
    let exitNext = creep.pos.findClosestByRange(FIND_EXIT);
    creep.cancelOrder('move');
    creep.cancelOrder('moveTo');
    creep.moveTo(exitNext, {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  }
  creep.siege();
  if (creep.room.name != creep.memory.routing.targetRoom && creep.hits == creep.hitsMax && creep.memory.squad) {
    let nextExits = creep.room.find(creep.memory.routing.route[creep.memory.routing.routePos].exit);
    let nextExit = nextExits[Math.floor(nextExits.length / 2)];
    creep.say('Going back', true);
    creep.cancelOrder('move');
    creep.cancelOrder('moveTo');
    creep.moveTo(nextExit, {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  } else if (creep.hits < creep.hitsMax && creep.room.name != creep.memory.routing.targetRoom && creep.memory.squad) {
    var healer = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function(object) {
        return object.memory.role == 'squadheal';
      }
    });
    creep.say('wait:heal', true);
    if (healer) {
      creep.moveTo(healer, {
        reusePath: 0
      });
    }
    return true;
  }
};

roles.squadsiege.execute = function(creep) {
  creep.log('Execute!!!');
};
