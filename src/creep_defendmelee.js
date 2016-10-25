'use strict';

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

module.exports.execute = function(creep) {
  let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
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
