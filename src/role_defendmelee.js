'use strict';

/*
 * defendmelee is called after 'threshold' when a room is attacked
 *
 * Tries to fight against the hostile creeps
 */

roles.defendmelee = {};

roles.defendmelee.settings = {
  parts: {layout: [MOVE, ATTACK]},
  energy: {
    maxEnergyUsed: 3250,
    minEnergyStored: 1000
  }
};

roles.defendmelee.execute = function(creep) {
  let hostile = creep.findClosestEnemy();
  if (hostile === null) {
    return Creep.recycleCreep(creep);
  }
  let search = PathFinder.search(
    creep.pos,
    hostile.pos, {
      roomCallback: creep.room.getAvoids(creep.room)
    });
  let direction = creep.pos.getDirectionTo(search.path[0]);
  creep.moveCreep(search.path[0], (direction + 3) % 8 + 1);
  let returnCode = creep.move(direction);
  creep.attack(hostile);
};
