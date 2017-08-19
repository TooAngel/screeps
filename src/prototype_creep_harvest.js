'use strict';

function existInArray(array, item) {
  for (var i in array) {
    if (array[i].role === item.role) {
      return true;
    }
  }
  return false;
}

Creep.prototype.handleSourcer = function() {
  this.setNextSpawn();
  this.spawnReplacement();
  let room = Game.rooms[this.room.name];
  let targetId = this.memory.routing.targetId;
  var source = Game.getObjectById(targetId);

  let target = source;
  let returnCode = this.harvest(source);
  if (returnCode != OK && returnCode != ERR_NOT_ENOUGH_RESOURCES) {
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

  const foundKey = Object.keys(config.carry.sizes).reverse()
    .find(key => (key <= Game.rooms[this.memory.base].energyCapacityAvailable));
  let carryCapacity = config.carry.sizes[foundKey][1] * CARRY_CAPACITY;

  const workParts = this.body.filter(part => part.type === WORK).length;

  let waitTime = carryCapacity / (HARVEST_POWER * workParts);

  var spawn = {
    role: 'carry',
    routing: {
      targetRoom: this.memory.routing.targetRoom,
      targetId: this.memory.routing.targetId
    }
  };

  let resourceAtPosition = 0;
  var resources = this.pos.lookFor(LOOK_RESOURCES);
  for (let resource of resources) {
    resourceAtPosition += resource.amount;
  }

  let containers = this.pos.findInRangeStructures(FIND_STRUCTURES, 0, STRUCTURE_CONTAINER);

  for (let container of containers) {
    resourceAtPosition += _.sum(container.store);
  }

  if (resourceAtPosition > carryCapacity) {
    Game.rooms[this.memory.base].checkRoleToSpawn('carry', 0, this.memory.routing.targetId, this.memory.routing.targetRoom);
  } else if (resourceAtPosition <= HARVEST_POWER * workParts) {
    const nearCarries = this.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 2, 'memory.role', ['carry'], false, {
      filter: creep => creep.memory.routing.targetId === this.memory.routing.targetId
    });
    if (nearCarries.length > 1) {
      nearCarries[0].memory.recycle = true;
    }
  }
  this.memory.wait = Math.max(waitTime, config.carry.minSpawnRate);
};
