'use strict';

/*
 * atkeeper is used to kill Source Keeper (ranged version)
 *
 * Attacks source keeper, move away when hits below 'threshold'
 * If no source keeper is available move to position where the next will spawn
 */

roles.atkeeper = {};

roles.atkeeper.settings = {
  layoutString: 'MRH',
  amount: [2, 1, 1],
  fillTough: true,
};

roles.atkeeper.action = function(creep) {
  // TODO Untested
  creep.spawnReplacement();
  creep.setNextSpawn();

  const heal = function(creep) {
    if (creep.hits < 500) {
      const target = creep.findClosestSourceKeeper();
      const range = creep.pos.getRangeTo(target);
      creep.heal(creep);
      if (range <= 3) {
        let direction = RoomPosition.oppositeDirection(creep.pos.getDirectionTo(target));
        const pos = creep.pos.getAdjacentPosition(direction);
        const terrain = pos.lookFor(LOOK_TERRAIN)[0];
        if (terrain === 'wall') {
          direction = _.random(1, 8);
        }
        creep.move(direction);
      } else if (range >= 5) {
        creep.moveTo(target);
      }
      creep.rangedAttack(target);
      return true;
    }
    return false;
  };

  const attack = function(creep) {
    const target = creep.findClosestSourceKeeper();
    let range;
    let direction;

    if (creep.hits < creep.hitsMax) {
      creep.heal(creep);
      creep.rangedAttack(target);
      range = creep.pos.getRangeTo(target);
      if (range >= 5) {
        creep.moveTo(target);
      }
      if (range < 3) {
        direction = RoomPosition.oppositeDirection(creep.pos.getDirectionTo(target));
      }
      return true;
    } else {
      const myCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
        filter: function(object) {
          return object.hits < object.hitsMax;
        },
      });
      if (myCreeps.length > 0) {
        creep.heal(myCreeps[0]);
      }
    }

    if (!target || target === null) {
      const myCreep = creep.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeeper'], {
        inverse: true,
        filter: (creep) => creep.hits < creep.hitsMax,
      });
      if (myCreep !== null) {
        creep.moveTo(myCreep);
        creep.rangedHeal(myCreep);
        return true;
      }

      const sourceKeepers = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_KEEPER_LAIR]);
      let minSpawnTime = 500;
      let minSourceKeeper = null;
      for (const sourceKeeper of sourceKeepers) {
        if (sourceKeeper.ticksToSpawn < minSpawnTime) {
          minSpawnTime = sourceKeeper.ticksToSpawn;
          minSourceKeeper = sourceKeeper;
        }
      }

      if (minSourceKeeper === null) {
        creep.moveRandom();
      } else {
        range = creep.pos.getRangeTo(minSourceKeeper);
        if (range > 3) {
          creep.moveTo(minSourceKeeper);
        }
      }
      return true;
    }
    range = creep.pos.getRangeTo(target);
    if (range > 3) {
      creep.moveTo(target);
    }

    creep.rangedAttack(target);
    if (range < 3) {
      direction = RoomPosition.oppositeDirection(creep.pos.getDirectionTo(target));
      creep.move(direction);
    }
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

roles.atkeeper.execute = function(creep) {
  creep.log('Execute!!!');
};
