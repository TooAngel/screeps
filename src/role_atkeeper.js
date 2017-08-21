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
  fillTough: true
};

roles.atkeeper.action = function(creep) {
  //TODO Untested
  creep.spawnReplacement();
  creep.setNextSpawn();

  let heal = function(creep) {
    if (creep.hits < 500) {
      var target = creep.findClosestSourceKeeper();
      var range = creep.pos.getRangeTo(target);
      creep.heal(creep);
      if (range <= 3) {
        var direction = creep.pos.getDirectionTo(target);
        direction = (direction + 3) % 8 + 1;
        var pos = creep.pos.getAdjacentPosition(direction);
        var terrain = pos.lookFor(LOOK_TERRAIN)[0];
        if (terrain === 'wall') {
          direction = (Math.random() * 8) + 1;
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

  let attack = function(creep) {
    var target = creep.findClosestSourceKeeper();
    var range;
    var direction;

    if (creep.hits < creep.hitsMax) {
      creep.heal(creep);
      creep.rangedAttack(target);
      range = creep.pos.getRangeTo(target);
      if (range >= 5) {
        creep.moveTo(target);
      }
      if (range < 3) {
        direction = creep.pos.getDirectionTo(target);
        creep.move((direction + 4) % 8);
      }
      return true;
    } else {
      var my_creeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
        filter: function(object) {
          return object.hits < object.hitsMax;
        }
      });
      if (my_creeps.length > 0) {
        creep.heal(my_creeps[0]);
      }
    }

    if (!target || target === null) {
      const my_creep = creep.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeeper'], true, {
        filter: creep => creep.hits < creep.hitsMax
      });
      if (my_creep !== null) {
        creep.moveTo(my_creep);
        creep.rangedHeal(my_creep);
        return true;
      }

      const source_keepers = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_KEEPER_LAIR]);
      let min_spawn_time = 500;
      let min_source_keeper = null;
      for (let source_keeper of source_keepers) {
        if (source_keeper.ticksToSpawn < min_spawn_time) {
          min_spawn_time = source_keeper.ticksToSpawn;
          min_source_keeper = source_keeper;
        }
      }

      if (min_source_keeper === null) {
        creep.moveRandom();
      } else {
        range = creep.pos.getRangeTo(min_source_keeper);
        if (range > 3) {
          creep.moveTo(min_source_keeper);
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
      direction = creep.pos.getDirectionTo(target);
      creep.move((direction + 4) % 8);
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
