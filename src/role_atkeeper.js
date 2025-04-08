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
  amount: [18, 6, 12],
  fillTough: false,
};

roles.atkeeper.preMove = function(creep) {
  creep.checkForRoutingReached();
};

roles.atkeeper.action = function(creep) {
  // TODO Untested
  creep.spawnReplacement();
  creep.setNextSpawn();
  const center = new RoomPosition(25, 25, creep.memory.routing.targetRoom);
  const moveToCenter = function(creep, near) {
    near = near || 10;
    if (Game.time % 3 > 0) {
      return creep.moveToMy(center, near);
    } else {
      return creep.moveRandomWithin(center, near);
    }
  };
  const healAndMove = function(creep) {
    let creepsDamaged = creep.room.findDamagedCreeps();
    let creepsNearDamaged = creep.pos.findInRangeDamagedCreeps(3);

    creepsDamaged = _.sortBy(creepsDamaged, (c)=> c.isDamaged());
    creepsNearDamaged = _.sortBy(creepsNearDamaged, (c)=> c.isDamaged());
    if (creepsDamaged.length > 0 || creepsNearDamaged.length > 0) {
      const first = creepsNearDamaged[0] || creepsDamaged[0];
      if (first && first.pos) {
        creep.heal(first);
        creep.rangedHeal(first);
        if (center.getRangeTo(first) < 12) {
          creep.moveTo(first.pos, {ignoreCreeps: false, reusePath: 2});
        } else if ((first.memory.role === 'sourcer') || (first.memory.role === 'extractor')) {
          creep.moveTo(first.pos, {ignoreCreeps: false, reusePath: 2});
        }
        return true;
      }
    }
    return false;
  };
  const fightRangedInvaders = function(creep) {
    if (creep.getActiveBodyparts(RANGED_ATTACK) === 0) {
      return false;
    }
    const hostile = creep.pos.findClosestByRangeSystemCreeps();
    if (hostile) {
      return creep.fightRanged(hostile);
    }
    return false;
  };

  if (creep.room.name === creep.memory.routing.targetRoom) {
    if (!fightRangedInvaders(creep)) {
      moveToCenter(creep);
      if (healAndMove(creep)) {
        return true;
      }
      if (creep.room.keeperTeamReady()) {
        if (healAndMove(creep)) {
          return true;
        }
      }
    } else {
      creep.selfHeal();
      return true;
    }
  }

  return moveToCenter(creep);
};
