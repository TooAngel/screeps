'use strict';

/*
 * harvester makes sure that extensions are filled
 *
 * Before storage or certains store threshold:
 *  - get dropped energy or from source
 *  - fill extensions
 *  - build constructionSites
 *  - upgrade Controller
 *
 * Proper storage store level:
 *  - Move along the harvester path
 *  - pathPos == 0 get energy from storage
 *  - transfer energy to extensions in range
 */

roles.harvester = {};
roles.harvester.stayInRoom = true;
roles.harvester.buildRoad = true;
//roles.harvester.boostActions = ['capacity'];

roles.harvester.preMove = function(creep, directions) {
  let pickableResources = function(object) {
    return creep.pos.getRangeTo(object.pos.x, object.pos.y) < 2;
  };
  let resources = _.filter(creep.room.getDroppedResources(), pickableResources);
  if (resources.length > 0) {
    let resource = Game.getObjectById(resources[0].id);
    creep.pickup(resource);
  }

  if (typeof(creep.memory.move_forward_direction) == 'undefined') {
    creep.memory.move_forward_direction = true;
  }

  creep.setNextSpawn();
  creep.spawnReplacement(1);

  if (!creep.room.storage || (creep.room.storage.store.energy + creep.carry.energy) < config.creep.energyFromStorageThreshold) {
    creep.harvesterBeforeStorage();
    creep.memory.routing.reached = true;
    return true;
  }

  let reverse = creep.carry.energy === 0;

  if (creep.memory.routing.pathPos === 0) {
    for (let resource in creep.carry) {
      if (resource == RESOURCE_ENERGY) {
        continue;
      }
      creep.transfer(creep.room.storage, resource);
    }

    let returnCode = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
    if (returnCode == OK || returnCode == ERR_FULL) {
      creep.memory.move_forward_direction = true;
      reverse = false;
      creep.memory.routing.reverse = false;
      if (returnCode == OK) {
        return true;
      }
    }
  }

  // TODO Decide between, transfered no more energy (reverse), transferred other structures to transfer available (stay still), transferred no more structures (forward)
  let transferred = creep.transferToStructures();
  if (!reverse && transferred) {
    if (transferred.moreStructures) {
      reverse = true;
      return true;
    }
  }
  creep.memory.routing.reverse = reverse || !creep.memory.move_forward_direction;
  if (directions && creep.memory.routing.reverse) {
    directions.direction = directions.backwardDirection;
  }

  if (creep.room.memory.position.pathEndLevel) {
    if (creep.memory.routing.pathPos >= creep.room.memory.position.pathEndLevel[creep.room.controller.level]) {
      creep.memory.move_forward_direction = false;
      creep.memory.routing.reverse = true;
      delete creep.memory.routing.reached;
    }
  }
};

roles.harvester.action = function(creep) {
  if (!creep.memory.routing.targetId) {
    creep.memory.routing.targetId = 'harvester';
  }

  if (!creep.room.storage || (creep.room.storage.store.energy + creep.carry.energy) < config.creep.energyFromStorageThreshold) {
    creep.harvesterBeforeStorage();
    creep.memory.routing.reached = true;
    return true;
  }

  creep.memory.move_forward_direction = false;
  creep.memory.routing.reverse = true;
  delete creep.memory.routing.reached;
  return true;
};

roles.harvester.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, WORK, MOVE, CARRY];
  let partConfig = room.getPartConfig(energy, parts);
  if (room.storage && room.storage.my && room.storage.store.energy > config.creep.energyFromStorageThreshold) {
    parts = [MOVE, CARRY, CARRY];
    partConfig = room.getPartConfig(energy - 150, parts);
    partConfig.unshift(WORK);
    partConfig.unshift(MOVE);
  }
  return partConfig;
};

roles.harvester.energyRequired = function(room) {
  return 250;
};

roles.harvester.energyBuild = function(room, energy) {
  let build = Math.min(1500, Math.max(energy, 250));
  return build;
};

roles.harvester.execute = function(creep) {
  creep.log('execute');
  // TODO Something is broken
  creep.harvesterBeforeStorage();
  //   if (true) throw new Error();
  return false;
};
