'use strict';

Creep.prototype.myHarvest = function(source) {
  const returnCode = this.harvest(source);
  if (returnCode === OK) {
    return true;
  }
  if (returnCode === ERR_NOT_ENOUGH_RESOURCES) {
    return true;
  }

  if (returnCode === ERR_NOT_OWNER) {
    this.log('Suiciding, someone else reserved the controller');
    this.memory.killed = true;
    this.suicide();
    return false;
  }

  if (returnCode === ERR_NO_BODYPART) {
    this.room.checkRoleToSpawn('defender', 2, undefined, this.room.name);
    this.respawnMe();
    this.suicide();
    return false;
  }

  if (returnCode === ERR_TIRED) {
    return false;
  }
  this.log('harvest: ' + returnCode);
  return false;
};

Creep.prototype.baseHarvesting = function() {
  if (!this.memory.link) {
    const links = this.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 1, 'structureType', [STRUCTURE_LINK]);
    if (links.length > 0) {
      this.memory.link = links[0].id;
    }
  }
  const link = Game.getObjectById(this.memory.link);
  if (link) {
    this.transfer(link, RESOURCE_ENERGY);
    const resources = this.pos.findInRangePropertyFilter(FIND_DROPPED_RESOURCES, 1, 'resourceType', [RESOURCE_ENERGY]);
    if (resources.length > 0) {
      this.pickup(resources);
    }
  }
};

Creep.prototype.spawnCarry = function() {
  if (this.memory.wait > 0) {
    this.memory.wait -= 1;
    return false;
  }

  const baseRoom = Game.rooms[this.memory.base];
  const creepMemory = baseRoom.creepMem('carry', this.memory.routing.targetId, this.memory.routing.targetRoom);
  const carrySettings = baseRoom.getSettings(creepMemory);
  const parts = {
    sourcerWork: this.body.filter((part) => part.type === WORK).length,
    carryParts: {
      move: carrySettings.amount[0],
      carry: carrySettings.amount[1],
      work: carrySettings.prefixString === '' ? 0 : 1,
    },
  };

  let resourceAtPosition = 0;
  const resources = this.pos.lookFor(LOOK_RESOURCES);
  for (const resource of resources) {
    resourceAtPosition += resource.amount;
  }

  const containers = this.pos.findInRangeStructures(FIND_STRUCTURES, 0, STRUCTURE_CONTAINER);

  for (const container of containers) {
    resourceAtPosition += _.sum(container.store);
  }
  if (!Game.rooms[this.memory.base].inQueue(creepMemory) && resourceAtPosition > parts.carryParts.carry * CARRY_CAPACITY) {
    Game.rooms[this.memory.base].checkRoleToSpawn('carry', 0, this.memory.routing.targetId, this.memory.routing.targetRoom, carrySettings);
  } else if (1 * resourceAtPosition <= HARVEST_POWER * parts.sourcerWork) {
    const nearCarries = this.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 2, 'memory.role', ['carry'], {
      filter: (creep) => creep.memory.routing.targetId === this.memory.routing.targetId,
    });
    if (nearCarries.length > 1) {
      nearCarries[0].memory.recycle = true;
    }
  }
  this.memory.wait = this.getCarrySpawnInterval();
  return this.memory.wait;
};

/**
 * getCarrySpawnInterval
 *
 * The interval is calculated via the time from the spawn to the source
 * (timeToTravel) plus some offset for delays
 *
 * @return {number}
 */
Creep.prototype.getCarrySpawnInterval = function() {
  return this.memory.timeToTravel + 50;
};
