'use strict';

/*
 * atkeeper is used to kill Source Keeper (melee version)
 *
 * Attacks source keeper, move away when hits below 'threshold'
 * If no source keeper is available move to position where the next will spawn
 */

roles.atkeepermelee = {};
roles.atkeepermelee.settings = {
  layoutString: 'MAH',
  amount: [25, 19, 6],
  fillTough: true,
};

roles.atkeepermelee.action = function(creep) {
  // TODO Untested
  creep.spawnReplacement();
  creep.setNextSpawn();

  const getNextSourceKeeper = function(creep) {
    const sourceKeeper = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_KEEPER_LAIR]);
    const sourceKeeperNext = _.sortBy(sourceKeeper, (object) => object.ticksToSpawn);
    return sourceKeeperNext[0];
  };

  const heal = function(creep) {
    creep.say('heal');
    let target = creep.findClosestSourceKeeper();
    if (target === null) {
      target = getNextSourceKeeper(creep);
      creep.log('heal: ' + JSON.stringify(target));
    }
    const range = creep.pos.getRangeTo(target);
    if (range > 1) {
      if (range > 7) {
        const sourcers = creep.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 3, 'memory.role', ['sourcer'], {
          filter: (target) => target.hits < target.hitsMax,
        });

        if (sourcers.length > 0) {
          creep.heal(sourcers[0]);
          return true;
        }
      }

      creep.heal(creep);
      if (creep.hits === creep.hitsMax || range > 5 || range < 5) {
        const returnCode = creep.moveTo(target);
        if (returnCode !== OK) {
          creep.log(`heal.move returnCode: ${returnCode}`);
        }
      }
      return true;
    }
    return false;
  };

  const attack = function(creep) {
    creep.say('attack');
    let target = creep.findClosestSourceKeeper();
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
