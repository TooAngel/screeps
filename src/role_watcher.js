'use strict';

/*
 * scout moves around to provide visibility
 *
 * Pre observer the scout moves through surrounding rooms
 */
// role_watcher.js
roles.watcher = {};
roles.watcher.settings = {
  layoutString: 'M',
  amount: [1],
  maxLayoutAmount: 1,
};

roles.watcher.preMove = function(creep, directions) {
  if (creep.hits < creep.hitsMax) {
    creep.memory.routing.reverse = true;
    if (directions) {
      directions.direction = directions.backwardDirection;
    }
    return false;
  } else {
    creep.memory.routing.reverse = false;
  }
  if (creep.memory.routing.targetRoom === creep.room.name) {
    const pos = new RoomPosition(25, 25, creep.memory.routing.targetRoom);
    if (creep.pos.isNearTo(pos)) {
      creep.memory.routing.reached = true;
    }
  } else {
    delete creep.memory.routing.reached;
  }
};

roles.watcher.action = function(creep) {
  creep.setNextSpawn();
  creep.spawnReplacement(1);
  const pos = new RoomPosition(25, 25, creep.memory.routing.targetRoom);
  const near = 4;
  if (creep.pos.isNearTo(pos)) {
    creep.moveRandomWithin(pos);
    let creepOfRole = creep.room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['watcher'], {
      filter: (o) => o.memory.routing.targetRoom === creep.memory.routing.targetRoom,
    });
    if (creepOfRole.length > 1) {
      creepOfRole = _.sortBy(creepOfRole, (c) => c.ticksToLive);
      creepOfRole[0].suicide();
    }
  } else {
    creep.moveToMy(pos, near);
  }
};
