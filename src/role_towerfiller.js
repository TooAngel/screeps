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

/**
 * suicide() - Suicides the creep if necessary
 *
 * @param {object} creep - The creep object
 * @return {boolean} - If the creep was suicided
 **/
function suicide(creep) {
  if (creep.memory.target_id) {
    return false;
  }

  creep.log('Suiciding to target_id');
  creep.suicide();
  return true;
}

/**
 * checkForStructures - Checks for towerfiller and link to get and fetch
 * energy
 *
 * @param {object} creep - The creep object
 * @return {boolean} - If the creep was suicided
 **/
function checkForStructures(creep) {
  const pos = creep.memory.target_id;
  const posObject = new RoomPosition(pos.x, pos.y, creep.room.name);
  const towers = posObject.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_TOWER]);
  const links = posObject.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_LINK]);
  if (towers.length === 0) {
    creep.suicide();
    return true;
  }
  if (links.length === 0) {
    creep.suicide();
    return true;
  }
  creep.memory.tower = towers[0].id;
  creep.memory.link = links[0].id;
  return false;
}

/**
 * handleEnergy - Transfers energy from link to tower
 *
 * @param {object} creep - The creep object
 * @return {void}
 **/
function handleEnergy(creep) {
  creep.moveTo(creep.memory.target_id.x, creep.memory.target_id.y);
  const link = Game.getObjectById(creep.memory.link);
  const tower = Game.getObjectById(creep.memory.tower);
  creep.withdraw(link, RESOURCE_ENERGY);
  const returnCode = creep.transfer(tower, RESOURCE_ENERGY);
  if (returnCode === OK) {
    creep.setNextSpawn();
  }
}

roles.towerfiller.action = function(creep) {
  if (suicide(creep)) {
    return false;
  }

  const room = Game.rooms[creep.room.name];
  if (room.memory.attackTimer > 50 && room.controller.level > 6) {
    creep.spawnReplacement();
  }

  if (!creep.memory.link) {
    if (!checkForStructures(creep)) {
      return false;
    }
  }

  handleEnergy(creep);
  return true;
};
