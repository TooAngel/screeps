'use strict';

var helper = require('helper');


let parts = [];
for (let i = 0; i < 22; i++) {
  parts.push(MOVE);
}
for (let i = 0; i < 3; i++) {
  parts.push(MOVE);
}
for (let i = 0; i < 19; i++) {
  parts.push(ATTACK);
}
for (let i = 0; i < 6; i++) {
  parts.push(HEAL);
}
let costs = 0;
for (let part of parts) {
  costs += BODYPART_COST[part];
}

module.exports.get_part_config = function(room, energy, heal) {
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable, costs);
};

module.exports.energyBuild = function(room) {
  return Math.min(room.energyCapacityAvailable, costs);
};


function getNextSourceKeeper(creep) {
  var sourceKeeper = creep.room.find(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      return object.owner.username == 'Source Keeper';
    }
  });

  var sourceKeeperNext = _.sortBy(sourceKeeper, function(object) {
    return object.ticksToSpawn;
  });
  return sourceKeeperNext[0];
}


function heal(creep) {
  creep.say('heal');
  var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      if (object.owner.username == 'Source Keeper') {
        return true;
      }
      return false;
    }
  });
  if (target === null) {
    target = getNextSourceKeeper(creep);
    creep.log('heal: ' + JSON.stringify(target));
  }
  var range = creep.pos.getRangeTo(target);
  if (range > 1) {
    if (range > 7) {
      let sourcers = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
        filter: function(object) {
          let target = Game.getObjectById(object.id);
          if (target.memory.role == 'sourcer' && target.hits < target.hitsMax) {
            return true;
          }
          return false;
        }
      });

      if (sourcers.length > 0) {
        creep.heal(sourcers[0]);
        return true;
      }
    }


    creep.heal(creep);
    if (creep.hits == creep.hitsMax || range > 5 || range < 5) {
      let returnCode = creep.moveTo(target);
      if (returnCode != OK) {
        creep.log(`heal.move returnCode: ${returnCode}`);
      }
    }
    return true;
  }
  return false;
}

function attack(creep) {
  creep.say('attack');
  var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      if (object.owner.username == 'Source Keeper') {
        return true;
      }
      return false;
    }
  });
  if (target === null) {
    target = getNextSourceKeeper(creep);
  }
  if (creep.pos.getRangeTo(target.pos) > 1) {
    creep.moveTo(target);
  }
  creep.attack(target);
  return true;
}

function run(creep) {
  creep.setNextSpawn();

  if (heal(creep)) {
    return true;
  }

  if (attack(creep)) {
    return true;
  }
  creep.heal(creep);
}

module.exports.action = function(creep) {
  //TODO Untested
  creep.spawnReplacement();
  run(creep);
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
