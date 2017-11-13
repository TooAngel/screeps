'use strict';

/*
 * atkeeper is used to kill Source Keeper (ranged version)
 *
 * Attacks source keeper, move away when hits below 'threshold'
 * If no source keeper is available move to position where the next will spawn
 */

roles.atkeeper = {};

roles.atkeeper.settings = {
  layoutString: 'MH',
  sufixString: 'MH',
  amount: [12, 12],
  fillTough: false,
  maxLayoutAmount: 2,
};

roles.atkeeper.preMove = function(creep, direction) {
  if (creep.room.name === creep.memory.routing.targetRoom) {
    creep.memory.routing.reached = true;
  }
};

roles.atkeeper.action = function(creep) {
  // TODO Untested
  creep.spawnReplacement();
  creep.setNextSpawn();

  const moveToCenter = function(creep, near) {
    near = near || 10;
    const center = new RoomPosition(25, 25, creep.memory.routing.targetRoom);
    return creep.moveToMy(center, near);
  };

  const healAndMove = function(creep) {
    let creepsToHeal = creep.room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeeper', 'atkeepermelee'], false, {
      filter: (o) => o.hits < o.hitsMax,
    });
    creepsToHeal = _.sortBy(creepsToHeal, (c)=> c.isDamaged());
    let creepsNearToHeal = creep.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 3, 'memory.role', ['atkeeper', 'atkeepermelee'], false, {
      filter: (o) => o.hits < o.hitsMax,
    });
    creepsNearToHeal = _.sortBy(creepsNearToHeal, (c)=> c.isDamaged());
    const closestKeeper = creep.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeepermelee']);
    if (creepsToHeal.length > 0 || creepsNearToHeal.length > 0 || closestKeeper) {
      const first = creepsNearToHeal[0] || creepsToHeal[0] || closestKeeper;
      if (first && first.pos) {
        creep.heal(first);
        creep.rangedHeal(first);
        creep.moveTo(first.pos, {ignoreCreeps: false, reusePath: 2});
      }
    }
    return true;
  };

  if (creep.room.name === creep.memory.routing.targetRoom) {
    moveToCenter(creep);
    if (healAndMove(creep)) {
      return true;
    }
    if (creep.room.keeperTeamReady()) {
      if (healAndMove(creep)) {
        return true;
      }
      return true;
    }
  }

  return moveToCenter(creep);
};

roles.atkeeper.execute = function(creep) {
  creep.log('Execute!!!');
};
