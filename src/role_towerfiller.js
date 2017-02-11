'use strict';

/*
 * towerfiller is called when the room is under attack
 *
 * Moves to the associated tower and transfers the energy from the link to the tower
 */

roles.towerfiller = {};

roles.towerfiller.settings = {
  layoutString: 'MC',
  amount: [1, 4]
};

roles.towerfiller.execute = function(creep) {
  if (!creep.memory.target_id) {
    creep.log('Suiciding to target_id');
    creep.suicide();
    return false;
  }
  let room = Game.rooms[creep.room.name];
  if (room.memory.attackTimer > 50 && room.controller.level > 6) {
    creep.spawnReplacement();
  }

  if (!creep.memory.link) {
    let getTower = function(object) {
      return object.structureType === STRUCTURE_TOWER;
    };
    let getLink = function(object) {
      return object.structureType === STRUCTURE_LINK;
    };

    let pos = creep.memory.target_id;
    let posObject = new RoomPosition(pos.x, pos.y, creep.room.name);
    let towers = posObject.findInRange(FIND_STRUCTURES, 1, {
      filter: getTower
    });
    let links = posObject.findInRange(FIND_STRUCTURES, 1, {
      filter: getLink
    });
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
  let link = Game.getObjectById(creep.memory.link);
  let tower = Game.getObjectById(creep.memory.tower);
  link.transferEnergy(creep);
  let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
  if (returnCode === OK) {
    creep.setNextSpawn();
  }
  return true;
};
