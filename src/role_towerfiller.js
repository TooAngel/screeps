'use strict';

/*
 * towerfiller is called when the room is under attack
 *
 * Moves to the associated tower and transfers the energy from the link to the tower
 */

roles.towerfiller = {};

roles.towerfiller.settings = {
  layoutString: 'MC',
  amount: [1, 4],
};

roles.towerfiller.execute = function(creep) {
  if (!creep.memory.target_id) {
    creep.log('Suiciding to target_id');
    creep.suicide();
    return false;
  }
  const room = Game.rooms[creep.room.name];
  if (room.memory.attackTimer > 50 && room.controller.level > 6) {
    creep.spawnReplacement();
  }

  if (!creep.memory.link) {
    const pos = creep.memory.target_id;
    const posObject = new RoomPosition(pos.x, pos.y, creep.room.name);
    const towers = posObject.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_TOWER]);
    const links = posObject.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_LINK]);
    if (towers.length === 0) {
      creep.suicide();
      return false;
    }
    if (links.length === 0) {
      creep.suicide();
      return false;
    }
    creep.memory.tower = towers[0].id;
    creep.memory.link = links[0].id;
  }

  creep.moveTo(creep.memory.target_id.x, creep.memory.target_id.y);
  const link = Game.getObjectById(creep.memory.link);
  const tower = Game.getObjectById(creep.memory.tower);
  creep.withdraw(link, RESOURCE_ENERGY);
  const returnCode = creep.transfer(tower, RESOURCE_ENERGY);
  if (returnCode === OK) {
    creep.setNextSpawn();
  }
  return true;
};
