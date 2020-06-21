'use strict';

/*
 * powertransporter is used to get power from the destroyed power bank
 *
 * Moves to the power and brings it back to the storage and destroys itself.
 */

// todo check routing reverse: is it memory.routing.reverse or memory.reverse

roles.powertransporter = {};
roles.powertransporter.settings = {
  layoutString: 'MC',
  maxLayoutAmount: 20,
  fillTough: true,
};

roles.powertransporter.moveHome = function(creep) {
  if (creep.carry.power > 0) {
    let storagePos;
    if (!creep.memory.storagePos) {
      const baseRoom = creep.memory.base;
      creep.log('moving back to baseRoom', baseRoom);
      storagePos = Game.rooms[baseRoom].memory.position.structure.storage[0];
      creep.memory.storagePos = storagePos;
    } else {
      storagePos = creep.memory.storagePos;
    }
    creep.memory.routing.reverse = true;
    creep.memory.reverse = true;
    creep.moveTo(new RoomPosition(storagePos.x, storagePos.y, storagePos.roomName), {
      ignoreCreeps: true,
    });
    // creep.moveToMy(new RoomPosition(storagePos.x, storagePos.y, storagePos.roomName), 2);
    return true;
  }
  return false;
};

roles.powertransporter.moveToBankOrResource = function(creep) {
  const powerBank = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);
  if (powerBank.length > 0) {
    const range = creep.pos.getRangeTo(powerBank[0]);
    if (range > 3) {
      creep.moveTo(powerBank[0]);
    }
    return false;
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
  return resource;
};

roles.powertransporter.action = function(creep) {
  if (creep.carry.energy) {
    creep.drop(RESOURCE_ENERGY);
  }
  if (creep.memory.reverse && creep.inBase()) {
    creep.moveToMy(creep.room.storage.pos);
    const returnCode = creep.transfer(creep.room.storage, RESOURCE_POWER);
    if (returnCode === OK) {
      creep.log('Fill storage');
      // todo-msc no suicide if we have recycle functions
      return Creep.recycleCreep(creep);
    }
    return true;
  }

  if (roles.powertransporter.moveHome(creep)) {
    return true;
  }
  const resource = roles.powertransporter.moveToBankOrResource(creep);
  if (!resource) {
    return true;
  }
  creep.moveTo(resource, {
    ignoreCreeps: true,
  });
  const returnCode = creep.pickup(resource);
  if (returnCode === OK) {
    delete creep.memory.routing.reached;
    creep.memory.routing.reverse = true;
    creep.memory.reverse = true;
  }
  return true;
};
