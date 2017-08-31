'use strict';

/*
 * powertransporter is used to get power from the destroyed power bank
 *
 * Moves to the power and brings it back to the storage and destroys itself.
 */

roles.powertransporter = {};
roles.powertransporter.settings = {
  layoutString: 'MC',
  maxLayoutAmount: 20,
  fillTough: true,
};

roles.powertransporter.action = function(creep) {
  if (creep.memory.reverse) {
    creep.log('reversing');
  }
  if (creep.carry.energy) {
    creep.drop(RESOURCE_ENERGY);
  }

  if (creep.memory.reverse && creep.inBase()) {
    creep.log('Fill storage');
    creep.moveToMy(creep.room.storage);
    const returnCode = creep.transfer(creep.room.storage, RESOURCE_POWER);
    if (returnCode === OK) {
      creep.memory.target = creep.memory.old_target;
      creep.suicide();
    }
    return true;
  }

  const getResource = function(creep) {
    if (creep.carry.power > 0) {
      creep.log(creep.memory.route[creep.memory.route.length - 2].room);
      const exitDirection = creep.room.findExitTo(creep.memory.route[creep.memory.route.length - 2].room);
      const nextExits = creep.room.find(exitDirection);
      const nextExit = nextExits[Math.floor(nextExits.length / 2)];
      creep.moveTo(nextExit);
      return true;
    }
    const powerBank = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);
    if (powerBank.length > 0) {
      const range = creep.pos.getRangeTo(powerBank[0]);
      if (range > 3) {
        creep.moveTo(powerBank[0]);
      }
      return true;
    }

    const resource = creep.pos.findClosestByRangePropertyFilter(FIND_DROPPED_RESOURCES, 'resourceType', [RESOURCE_POWER]);
    if (resource === null) {
      if (creep.carry.power > 0) {
        return false;
      } else {
        creep.moveTo(25, 25);
        return false;
      }
    }

    creep.moveTo(resource, {
      ignoreCreeps: true,
    });
    const returnCode = creep.pickup(resource);
    if (returnCode === OK) {
      creep.memory.reverse = true;
    }
    return true;
  };

  getResource();
  return true;
};

roles.powertransporter.execute = function(creep) {
  creep.log('Execute!!!');
};
