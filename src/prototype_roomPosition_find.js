'use strict';

RoomPosition.prototype.findClosestByRangeDroppedPower = function() {
  return this.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: (object) => object.resourceType === RESOURCE_POWER});
};

RoomPosition.prototype.findClosestByRangeCreepPowerAttacker = function() {
  return this.findClosestByRange(FIND_MY_CREEPS, {filter: (object) => object.memory.role === 'powerattacker'});
};

RoomPosition.prototype.findClosestByRangeCreepWithoutEnergy = function() {
  return this.findClosestByRange(FIND_MY_CREEPS, {filter: (object) => object.carry.energy === 0});
};

RoomPosition.prototype.findClosestByRangeSystemCreeps = function() {
  return this.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: (object) => config.maliciousNpcUsernames.includes(object.owner.username)});
};

RoomPosition.prototype.findClosestByRangeLowHitStructures = function() {
  return this.findClosestByRange(FIND_STRUCTURES, {filter: (object) => {
    if ([STRUCTURE_WALL, STRUCTURE_RAMPART].includes(object.structureType)) {
      return false;
    }
    return object.hits < object.hitsMax / 2;
  }});
};

RoomPosition.prototype.findClosestByRangeBuildingConstructionSites = function() {
  return this.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: (object) => ![STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_WALL].includes(object.structureType)});
};

RoomPosition.prototype.findClosestByRangeStandardConstructionSites = function() {
  return this.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: (object) => object.structureType !== STRUCTURE_RAMPART});
};

RoomPosition.prototype.findClosestByRangeBlockerConstructionSite = function() {
  return this.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: (object) => [STRUCTURE_RAMPART, STRUCTURE_WALL].includes(object.structureType),
  });
};


RoomPosition.prototype.findClosestByRangeHostileStructures = function() {
  return this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: (object) => ![STRUCTURE_ROAD, STRUCTURE_CONTROLLER, STRUCTURE_KEEPER_LAIR, STRUCTURE_WALL].includes(object.structureType)});
};

RoomPosition.prototype.findClosestByRangeHostileSpawn = function() {
  return this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: (object) => object.structureType === STRUCTURE_SPAWN});
};

RoomPosition.prototype.findClosestByRangeLabWithMinerals = function() {
  return this.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (object) => object.structureType === STRUCTURE_LAB && object.mineralAmount > 0,
  });
};

RoomPosition.prototype.findClosestByRangeSpawn = function() {
  return this.findClosestByRange(FIND_MY_STRUCTURES, {filter: (object) => object.structureType === STRUCTURE_SPAWN});
};

RoomPosition.prototype.findClosestByRangeEnergy = function() {
  return this.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: (object) => {
    if (object.resourceType !== RESOURCE_ENERGY) {
      return false;
    }
    return object.amount > 0;
  }});
};

RoomPosition.prototype.findClosestByRangeSquadSiegeCreep = function() {
  return this.findClosestByRange(FIND_MY_CREEPS, {
    filter: (object) => object.memory.role === 'squadsiege',
  });
};

RoomPosition.prototype.findClosestByRangeRampart = function() {
  return this.findClosestByRange(FIND_MY_STRUCTURES, {filter: (object) => {
    if (object.structureType !== STRUCTURE_RAMPART) {
      return false;
    }
    if (this.pos.getRangeTo(object) === 0) {
      return false;
    }
    return !object.pos.checkForObstacleStructure();
  }});
};

RoomPosition.prototype.findClosestByRangeSourceKeeper = function() {
  return this.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: (object) => object.owner.username ==='Source Keeper'});
};

RoomPosition.prototype.findClosestByRangeStructureToDestroy = function() {
  return this.findClosestByRange(FIND_STRUCTURES, {
    filter: (object) => {
      if ([STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_CONTAINER].includes(object.structureType)) {
        return false;
      }
      return !object.ticksToDecay;
    },
  });
};

RoomPosition.prototype.findClosestByRangeLowHitRamparts = function() {
  return this.findClosestByRange(FIND_STRUCTURES, {
    filter: (object) => {
      if (object.structureType !== STRUCTURE_RAMPART) {
        return false;
      }
      if (object.hits > 10000) {
        return false;
      }
      return true;
    },
  });
};

RoomPosition.prototype.findCloseByLowHitRamparts = function() {
  return this.findInRange(FIND_STRUCTURES, 4, {
    filter: (object) => {
      if (object.structureType !== STRUCTURE_RAMPART) {
        return false;
      }
      if (object.hits > 10000) {
        return false;
      }
      return true;
    },
  });
};

RoomPosition.prototype.findClosestByRangeRepairableRoad = function() {
  return this.findClosestByRange(FIND_STRUCTURES, {
    filter: (object) => {
      if (object.structureType !== STRUCTURE_ROAD) {
        return;
      }
      return object.hits < 0.5 * object.hitsMax;
    },
  });
};

