'use strict';

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

RoomPosition.prototype.findClosestByRangeBlockerConstructionSite = function() {
  return this.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: (object) => [STRUCTURE_RAMPART, STRUCTURE_WALL].includes(object.structureType),
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

