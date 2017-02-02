'use strict';

/*
 * atkeeper is used to kill Source Keeper (melee version)
 *
 * Attacks source keeper, move away when hits below 'threshold'
 * If no source keeper is available move to position where the next will spawn
 */

roles.atkeepermelee = {};

roles.atkeepermelee.getPartConfig = function(room, energy, heal) {
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
  return room.getPartConfig(energy, parts);
};

roles.atkeepermelee.energyRequired = function(room) {
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
  return Math.min(room.getEnergyCapacityAvailable(), costs);
};

roles.atkeepermelee.energyBuild = function(room) {
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
  return Math.min(room.getEnergyCapacityAvailable(), costs);
};

roles.atkeepermelee.action = function(creep) {
  //TODO Untested
  creep.spawnReplacement();
  creep.setNextSpawn();

  let getNextSourceKeeper = function(creep) {
    var sourceKeeper = creep.room.find(FIND_HOSTILE_STRUCTURES, {
      filter: function(object) {
        return object.owner.username == 'Source Keeper';
      }
    });

    var sourceKeeperNext = _.sortBy(sourceKeeper, function(object) {
      return object.ticksToSpawn;
    });
    return sourceKeeperNext[0];
  };

  let heal = function(creep) {
    creep.say('heal');
    var target = creep.findClosestSourceKeeper();
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
  };

  let attack = function(creep) {
    creep.say('attack');
    var target = creep.findClosestSourceKeeper();
    if (target === null) {
      target = getNextSourceKeeper(creep);
    }
    if (creep.pos.getRangeTo(target.pos) > 1) {
      creep.moveTo(target);
    }
    creep.attack(target);
    return true;
  };

  if (heal(creep)) {
    return true;
  }

  if (attack(creep)) {
    return true;
  }
  creep.heal(creep);
  return true;
};

roles.atkeepermelee.execute = function(creep) {
  creep.log('Execute!!!');
};
