'use strict';

roles.squadheal = {};

roles.squadheal.boostActions = ['heal'];

roles.squadheal.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, HEAL];
  return room.getPartConfig(energy, parts).sort();
};

roles.squadheal.energyRequired = function(room) {
  return Math.min(room.getEnergyCapacityAvailable(), 5100);
};

roles.squadheal.energyBuild = function(room, energy) {
  return Math.min(room.getEnergyCapacityAvailable(), 5100);
};

roles.squadheal.died = function(name, memory) {
  console.log('--->', name, 'Died naturally?');
  delete Memory.squads[Memory.creeps.name.squad].heal[Memory.creeps.name.id];
  delete Memory.creeps[name];
};

roles.squadheal.preMove = function(creep, directions) {
  if (creep.hits < creep.hitsMax) {
    creep.log('preMove heal');
    creep.heal(creep);
    creep.memory.routing.reverse = true;
    if (directions) {
      directions.direction = directions.backwardDirection;
    }
    return false;
  } else {
    creep.memory.routing.reverse = false;
  }

  var myCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 10, {
    filter: function(object) {
      if (object.hits < object.hitsMax) {
        return true;
      }
      return false;
    }
  });
  if (myCreeps.length > 0) {
    creep.say('heal', true);
    creep.moveTo(myCreeps[0], {
      reusePath: 0,
      ignoreCreeps: true
    });
    let range = creep.pos.getRangeTo(myCreeps[0]);
    if (range <= 1) {
      creep.heal(myCreeps[0]);
    } else {
      creep.rangedHeal(myCreeps[0]);
    }
    return true;
  }
  return false;
};

roles.squadheal.action = function(creep) {
  creep.memory.hitsLost = creep.memory.hitsLast - creep.hits;
  creep.memory.hitsLast = creep.hits;
  if (creep.hits - creep.memory.hitsLost < creep.hitsMax / 1.5 && creep.room.name == creep.memory.routing.targetRoom) {
    creep.say('Run & heal', true);
    creep.heal(creep);
    creep.cancelOrder('move');
    creep.cancelOrder('moveTo');

    if (creep.pos.x === 0 || creep.pos.y === 0 || creep.pos.x == 49 || creep.pos.y == 49) {
      return true;
    }
    let exitNext = creep.pos.findClosestByRange(FIND_EXIT);
    creep.moveTo(exitNext, {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  } else if (creep.hits < creep.hitsMax && creep.room.name != creep.memory.routing.targetRoom) {
    creep.say('wait:heal', true);
    creep.heal(creep);
    creep.moveTo(25, 25, {
      reusePath: 0
    });
    return true;
  }

  if (!creep.squadHeal()) {
    creep.heal(creep);
    let nextExits = creep.room.find(creep.memory.routing.route[creep.memory.routing.routePos].exit);
    let nextExit = nextExits[Math.floor(nextExits.length / 2)];
    creep.moveTo(nextExit, {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  }
  var attacker = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.memory.role == 'squadsiege' || object.memory.role == 'autoattackmelee';
    }
  });
  creep.moveTo(attacker, {
    reusePath: 0
  });
  return true;
};

roles.squadheal.execute = function(creep) {
  creep.log('Execute!!!');
};
