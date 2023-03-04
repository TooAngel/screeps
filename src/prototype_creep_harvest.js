'use strict';

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

  const containers = this.pos.findInRange(FIND_STRUCTURES, 0, {filter: {structureType: STRUCTURE_CONTAINER}});
  for (const container of containers) {
    resourceAtPosition += _.sum(container.store);
  }

  if (resourceAtPosition > parts.carryParts.carry * CARRY_CAPACITY || (this.memory.routing.type === 'commodity' && this.store.getFreeCapacity() === 0)) {
    const baseRoom = Game.rooms[this.memory.base];
    if (baseRoom.hasSpawnCapacity()) {
      if (!baseRoom.inQueue(creepMemory)) {
        baseRoom.checkRoleToSpawn('carry', 0, this.memory.routing.targetId, this.memory.routing.targetRoom, carrySettings);
      }
    }
  }
  if (resourceAtPosition < 50) {
    const nearCarries = this.pos.findInRangeCarryWithSameTargetPower(2, this.memory.routing.targetId);
    if (nearCarries.length > 2) {
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
  return this.memory.timeToTravel + config.room.spawnCarryIntervalOffset;
};
