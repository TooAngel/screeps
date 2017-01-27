'use strict';

/*
 * autoattackmelee is the first wave of autoattacks
 *
 * Kills tower and spawn, hostile creeps and construction sites
 */

roles.autoattackmelee = {};

roles.autoattackmelee.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.getPartConfig(energy, parts).sort();
};

roles.autoattackmelee.energyRequired = function(room) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.autoattackmelee.energyBuild = function(room, energy) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.autoattackmelee.died = function(name, memory) {
  console.log('--->', name, 'Died naturally?');
  delete Memory.squads[Memory.creeps.name.squad].heal[Memory.creeps.name.id];
  delete Memory.creeps[name];
};

roles.autoattackmelee.preMove = function(creep, directions) {
  let closestHostileCreep = creep.findClosestEnemy();
  let healer = creep.find(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.role == 'squadheal';
    }
  });
  if (creep.pos.getRangeTo(closestHostileCreep && healer) < 10) {
    creep.say('ARRRGH!!', true);
    creep.moveTo(closestHostileCreep, {
      reusePath: 0
    });
    creep.attack(closestHostileCreep);
    return true;
  }
  if (closestHostileCreep) {
    creep.memory.routing.reverse = true;
    return false;
  }
  if (healer) {
    creep.memory.routing.reverse = false;
    return false;
  }
  return false;
};

roles.autoattackmelee.action = function(creep) {
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
      if (healerRangeToTower >= creep.pos.getRangeTo(creep.pos.findClosestByRange(STRUCTURE_TOWER))) {
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
  creep.autosiege();
  if (creep.room.name != creep.memory.routing.targetRoom && creep.hits == creep.hitsMax && creep.memory.squad) {
    let closestHostileCreep = creep.findClosestEnemy();
    if (creep.pos.getRangeTo(closestHostileCreep) < 25) {
      creep.say('ARRRGH!!', true);
      creep.moveTo(closestHostileCreep, {
        reusePath: 0
      });
      creep.attack(closestHostileCreep);
      return true;
    }
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
    let closestHostileCreep = creep.findClosestEnemy();
    if (creep.pos.getRangeTo(closestHostileCreep) < 25) {
      creep.say('ARRRGH!!', true);
      creep.moveTo(closestHostileCreep, {
        reusePath: 0
      });
      creep.attack(closestHostileCreep);
      return true;
    }
    let healer = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
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

roles.autoattackmelee.execute = function(creep) {
  creep.log('Execute!!!');
};
