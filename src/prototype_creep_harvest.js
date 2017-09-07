'use strict';

Creep.prototype.handleSourcer = function() {
  this.setNextSpawn();
  this.spawnReplacement();
  const targetId = this.memory.routing.targetId;
  const source = Game.getObjectById(targetId);

  const returnCode = this.harvest(source);
  if (returnCode !== OK && returnCode !== ERR_NOT_ENOUGH_RESOURCES) {
    this.log('harvest: ' + returnCode);
    return false;
  }

  this.buildContainer();

  if (!this.room.controller || !this.room.controller.my || this.room.controller.level >= 2) {
    this.spawnCarry();
  }

  if (this.inBase()) {
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
  }
};

Creep.prototype.spawnCarry = function() {
  if (this.memory.wait > 0) {
    this.memory.wait -= 1;
    return false;
  }

  const baseRoom = Game.rooms[this.memory.base];

  const foundKey = Object.keys(config.carry.sizes).reverse()
    .find((key) => (key <= baseRoom.energyCapacityAvailable));
  const carryCapacity = config.carry.sizes[foundKey][1] * CARRY_CAPACITY;

  const workParts = this.body.filter((part) => part.type === WORK).length;

  let resourceAtPosition = 0;
  const resources = this.pos.lookFor(LOOK_RESOURCES);
  for (const resource of resources) {
    resourceAtPosition += resource.amount;
  }

  const containers = this.pos.findInRangeStructures(FIND_STRUCTURES, 0, STRUCTURE_CONTAINER);

  for (const container of containers) {
    resourceAtPosition += _.sum(container.store);
  }

  const waitTime = carryCapacity / (HARVEST_POWER * workParts) *
    Math.sqrt(carryCapacity / Math.max(resourceAtPosition, carryCapacity));

  if (resourceAtPosition > carryCapacity) {
    baseRoom.checkRoleToSpawn('carry', 0, this.memory.routing.targetId,
      this.memory.routing.targetRoom, undefined, undefined, {
        checkRecycle: true,
      });
  }

  // low minSpawnRate helps carry recycling
  let minSpawnRate = 10;

  // higher minSpawnRate when RCL < 4
  if (baseRoom.controller.level < 4) {
    minSpawnRate = config.carry.minSpawnRate;
  }
  this.memory.wait = Math.max(waitTime, minSpawnRate);
};
