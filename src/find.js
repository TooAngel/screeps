'use strict';

Room.prototype.findHostileStructureWithEnergy = function() {
  return this.find(FIND_HOSTILE_STRUCTURES, {
    filter: (object) => object.store && object.store.energy,
  });
};

Room.prototype.findCreep = function(role) {
  return this.find(FIND_MY_CREEPS, {
    filter: (object) => object.role === role,
  });
};

RoomPosition.prototype.findInRangeTowers = function(range) {
  return this.findInRange(FIND_STRUCTURES, range, {
    filter: (object) => object.structureType === STRUCTURE_TOWER,
  });
};

RoomPosition.prototype.findInRangeLinks = function(range) {
  return this.findInRange(FIND_STRUCTURES, range, {
    filter: (object) => object.structureType === STRUCTURE_LINK,
  });
};
Room.prototype.findConstructionSiteLink = function() {
  return this.find(FIND_MY_CONSTRUCTION_SITES, {filter: (object) => object.structureType === STRUCTURE_LINK});
};

Room.prototype.findKeeperLair = function() {
  return this.find(FIND_STRUCTURES, {filter: (object) => object.structureType === STRUCTURE_KEEPER_LAIR});
};

const filterRoad = (object) => object.structureType === STRUCTURE_ROAD;
RoomPosition.prototype.findInRangeConstructionSiteRoad = function(range) {
  return this.findInRange(FIND_MY_CONSTRUCTION_SITES, range, {
    filter: filterRoad,
  });
};
Room.prototype.findConstructionSiteRoad = function() {
  return this.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: filterRoad,
  });
};

const filterDamagedCreeps = (roles) => (object) => {
  if (!roles.includes(object.memory.role)) {
    return false;
  }
  return object.hits < object.hitsMax;
};
Room.prototype.findDamagedCreeps = function(roles=['atkeeper', 'atkeepermelee', 'sourcer', 'carry', 'extractor']) {
  return this.find(FIND_MY_CREEPS, {
    filter: filterDamagedCreeps(roles)});
};
RoomPosition.prototype.findInRangeDamagedCreeps = function(range, roles=['atkeeper', 'atkeepermelee', 'sourcer', 'carry', 'extractor']) {
  return this.findInRange(FIND_MY_CREEPS, range, {
    filter: filterDamagedCreeps(roles)});
};

RoomPosition.prototype.findInRangeWall = function(range) {
  return this.findInRange(FIND_STRUCTURES, range, {
    filter: (object) => object.structureType === STRUCTURE_WALL,
  });
};

const filterByRole = (role) => (object) => object.memory.role === role;

RoomPosition.prototype.findInRangeSourcer = function(range, minEnergy = -1) {
  return this.findInRange(FIND_MY_CREEPS, range, {
    filter: (object) => {
      if (!filterByRole('sourcer')(object)) {
        return false;
      }
      return object.store.energy > minEnergy;
    }});
};
Room.prototype.findSameSourcer = function(source) {
  return this.find(FIND_MY_CREEPS, {filter: (object) => {
    if (!filterByRole('sourcer')(object)) {
      return false;
    }
    return object.memory.routing.targetId === source.id && object.memory.routing.targetRoom === source.pos.roomName;
  }});
};
Room.prototype.findSourcer = function() {
  return this.find(FIND_MY_CREEPS, {filter: (object) => filterByRole('sourcer')(object)});
};

Room.prototype.findReserver = function() {
  return this.find(FIND_MY_CREEPS, {filter: (object) => filterByRole('reserver')(object)});
};

Room.prototype.findWatcher = function() {
  return this.find(FIND_MY_CREEPS, {filter: (object) => filterByRole('watcher')(object)});
};

Room.prototype.findAtkeepermelee = function() {
  return this.find(FIND_MY_CREEPS, {filter: (object) => filterByRole('atkeepermelee')(object)});
};

Room.prototype.findAtkeeper = function() {
  return this.find(FIND_MY_CREEPS, {filter: (object) => filterByRole('atkeeper')(object)});
};

RoomPosition.prototype.findInRangeStructuresWithUsableEnergy = function(range) {
  return this.findInRange(FIND_STRUCTURES, range, {filter: (object) => [STRUCTURE_CONTAINER, STRUCTURE_STORAGE].includes(object.structureType)});
};

RoomPosition.prototype.findInRangeCarryWithSameTargetPower = function(range, targetId) {
  return this.findInRange(FIND_MY_CREEPS, range, {
    filter: (object) => {
      if (object.memory.role !== 'carry') {
        return false;
      }
      return object.memory.routing.targetId === targetId;
    },
  });
};

RoomPosition.prototype.findClosestByRangeDroppedPower = function() {
  return this.findClosestByRange(FIND_DROPPED_RESOURCES, {filter: (object) => object.resourceType === RESOURCE_POWER});
};

RoomPosition.prototype.findClosestByRangeCreepPowerAttacker = function() {
  return this.findClosestByRange(FIND_MY_CREEPS, {filter: (object) => object.memory.role === 'powerattacker'});
};

const filterCreepsWithoutEnergy = (object) => object.carry.energy === 0;
RoomPosition.prototype.findClosestByRangeCreepWithoutEnergy = function() {
  return this.findClosestByRange(FIND_MY_CREEPS, {filter: filterCreepsWithoutEnergy});
};
RoomPosition.prototype.findInRangeCreepWithoutEnergy = function(range) {
  return this.findInRange(FIND_MY_CREEPS, range, {filter: filterCreepsWithoutEnergy});
};


RoomPosition.prototype.findClosestByRangeSystemCreeps = function() {
  return this.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: (object) => config.maliciousNpcUsernames.includes(object.owner.username)});
};

RoomPosition.prototype.findClosestByRangeLowHitStructures = function() {
  return this.findClosestByRange(FIND_STRUCTURES, {
    filter: (object) => {
      if ([STRUCTURE_WALL, STRUCTURE_RAMPART].includes(object.structureType)) {
        return false;
      }
      if (!object.hitsMax) {
        return false;
      }
      return object.hits < object.hitsMax / 2;
    },
  });
};

const filterBuildings = (object) => ![STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_WALL].includes(object.structureType);
RoomPosition.prototype.findClosestByRangeBuildingConstructionSites = function() {
  return this.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: filterBuildings});
};
RoomPosition.prototype.findInRangeBuildings = function(range) {
  return this.findInRange(FIND_CONSTRUCTION_SITES, range, {filter: filterBuildings});
};
Room.prototype.findBuildingConstructionSites = function() {
  return this.find(FIND_CONSTRUCTION_SITES, {filter: filterBuildings});
};
Room.prototype.findAllBuilding = function() {
  return this.find(FIND_STRUCTURES, {filter: filterBuildings});
};


RoomPosition.prototype.findClosestByRangeStandardConstructionSites = function() {
  return this.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: (object) => object.structureType !== STRUCTURE_RAMPART});
};

RoomPosition.prototype.findClosestByRangeBlockerConstructionSite = function() {
  return this.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: (object) => [STRUCTURE_RAMPART, STRUCTURE_WALL].includes(object.structureType) && !!object.hitsMax,
  });
};


RoomPosition.prototype.findClosestByRangeHostileStructures = function() {
  return this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: (object) => ![STRUCTURE_ROAD, STRUCTURE_CONTROLLER, STRUCTURE_KEEPER_LAIR, STRUCTURE_WALL].includes(object.structureType)});
};

RoomPosition.prototype.findClosestByRangeLab = function() {
  return this.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (object) => object.structureType === STRUCTURE_LAB,
  });
};

RoomPosition.prototype.findClosestByRangeLabWithMinerals = function() {
  return this.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (object) => object.structureType === STRUCTURE_LAB && object.mineralAmount > 0,
  });
};

const filterStructureTypeSpawn = (object) => object.structureType === STRUCTURE_SPAWN;
RoomPosition.prototype.findClosestByRangeSpawn = function() {
  return this.findClosestByRange(FIND_MY_STRUCTURES, {filter: filterStructureTypeSpawn});
};
RoomPosition.prototype.findClosestByRangeHostileSpawn = function() {
  return this.findClosestByRange(FIND_HOSTILE_STRUCTURES, {filter: filterStructureTypeSpawn});
};
Room.prototype.findSpawn = function() {
  return this.find(FIND_MY_STRUCTURES, {filter: filterStructureTypeSpawn});
};
Room.prototype.findAllSpawn = function() {
  return this.find(FIND_STRUCTURES, {filter: filterStructureTypeSpawn});
};
Room.prototype.findHostileSpawn = function() {
  return this.find(FIND_HOSTILE_STRUCTURES, {filter: filterStructureTypeSpawn});
};


const filterDroppedEnergy = (object) => {
  if (object.resourceType !== RESOURCE_ENERGY) {
    return false;
  }
  return object.amount > 0;
};
RoomPosition.prototype.findClosestByRangeEnergy = function() {
  return this.findClosestByRange(FIND_DROPPED_RESOURCES, {
    filter: filterDroppedEnergy,
  });
};
RoomPosition.prototype.findInRangeDroppedEnergy = function(range) {
  return this.findInRange(FIND_DROPPED_RESOURCES, range, {
    filter: filterDroppedEnergy,
  });
};

RoomPosition.prototype.findClosestByRangeSquadSiegeCreep = function() {
  return this.findClosestByRange(FIND_MY_CREEPS, {
    filter: (object) => object.memory.role === 'squadsiege',
  });
};

RoomPosition.prototype.findClosestByRangeRampart = function() {
  return this.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (object) => {
      if (object.structureType !== STRUCTURE_RAMPART) {
        return false;
      }
      if (this.getRangeTo(object) === 0) {
        return false;
      }
      return !object.pos.checkForObstacleStructure();
    },
  });
};

RoomPosition.prototype.findClosestByRangeSourceKeeper = function() {
  return this.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: (object) => object.owner.username === 'Source Keeper'});
};

const filterStructuresToDestroy = (object) => {
  if ([STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTAINER].includes(object.structureType)) {
    return false;
  }
  return !object.ticksToDecay;
};
RoomPosition.prototype.findClosestByRangeStructureToDestroy = function() {
  return this.findClosestByRange(FIND_STRUCTURES, {
    filter: filterStructuresToDestroy,
  });
};
RoomPosition.prototype.findInRangeStructureToDestroy = function(range) {
  return this.findInRange(FIND_STRUCTURES, range, {
    filter: filterStructuresToDestroy,
  });
};
Room.prototype.findStructuresToDestroy = function() {
  return this.find(FIND_STRUCTURES, {
    filter: filterStructuresToDestroy,
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

