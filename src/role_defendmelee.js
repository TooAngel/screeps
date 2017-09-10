'use strict';

/*
 * defendmelee is called after 'threshold' when a room is attacked
 *
 * Tries to fight against the hostile creeps
 */

roles.defendmelee = {};

roles.defendmelee.settings = {
  layoutString: 'MA',
  amount: [5, 5],
  fillTough: true,
};

roles.defendmelee.execute = function(creep) {
  const hostile = creep.findClosestEnemy();
  if (hostile === null) {
    return Creep.recycleCreep(creep);
  }
  const search = PathFinder.search(
    creep.pos,
    hostile.pos, {
      roomCallback: creep.room.getCostMatrixCallback(hostile.pos),
    });
  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }
  const direction = creep.pos.getDirectionTo(search.path[0]);
  creep.moveCreep(search.path[0], (direction + 3) % 8 + 1);
  creep.move(direction);
  creep.attack(hostile);
};
