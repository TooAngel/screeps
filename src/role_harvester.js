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
 *  - pathPos === 0 get energy from storage
 *  - transfer energy to extensions in range
 */

roles.harvester = {};

roles.harvester.settings = {
  param: ['controller.level', 'energyAvailable'],
  layoutString: 'MWC',
  amount: {
    1: [2, 1, 1],
    2: {
      0: [2, 1, 1],
      550: [4, 3, 1],
      750: [2, 1, 1],
    },
  },
  maxLayoutAmount: 6,
};
roles.harvester.updateSettings = function(room) {
  if (!room.isStruggeling() && room.energyAvailable >= 350) {
    // Layoutcost minimum: prefix 250 + layout 100 -> 350
    return {
      prefixString: 'WMC',
      layoutString: 'MC',
      amount: [1, 2],
      maxLayoutAmount: 12,
    };
  } else if (room.storage && !room.storage.my) {
    return {
      maxLayoutAmount: 999,
    };
  }
};

roles.harvester.buildRoad = true;
roles.harvester.boostActions = ['capacity'];

const harvesterBeforeStorage = function(creep) {
  if (creep.room.isStruggeling()) {
    creep.harvesterBeforeStorage();
    creep.memory.routing.reached = false;
    return true;
  }
  return false;
};

roles.harvester.preMove = function(creep, directions) {
  creep.creepLog(`preMove`);
  if (harvesterBeforeStorage(creep)) {
    return true;
  }

  const resources = creep.room.find(FIND_DROPPED_RESOURCES, {
    filter: Creep.pickableResources(creep),
  });
  if (resources.length > 0) {
    const resource = Game.getObjectById(resources[0].id);
    creep.pickup(resource);
  }

  if (typeof(creep.memory.move_forward_direction) === 'undefined') {
    creep.memory.move_forward_direction = true;
  }

  // changed controll flow: first transferToStructures then harvesterBeforeStorage
  let reverse = creep.carry.energy === 0;

  creep.setNextSpawn();
  creep.spawnReplacement(1);

  const transferred = creep.transferToStructures();
  if (transferred) {
    if (transferred.transferred >= _.sum(creep.carry)) {
      reverse = true;
    } else {
      if (transferred.moreStructures) {
        return true;
      }
    }
  }

  creep.memory.routing.targetId = 'harvester';

  if (creep.memory.routing.pathPos === 0) {
    for (const resource in creep.carry) {
      if (resource === RESOURCE_ENERGY) {
        continue;
      }
      creep.transfer(creep.room.storage, resource);
    }

    const returnCode = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
    if (returnCode === OK || returnCode === ERR_FULL) {
      creep.memory.move_forward_direction = true;
      reverse = false;
      creep.memory.routing.reverse = false;
      if (returnCode === OK) {
        return true;
      }
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
  creep.creepLog(`action`);
  if (!creep.memory.routing.targetId) {
    creep.memory.routing.targetId = 'harvester';
  }

  if (harvesterBeforeStorage(creep)) {
    return true;
  }

  creep.memory.move_forward_direction = false;
  creep.memory.routing.reverse = true;
  delete creep.memory.routing.reached;
  return true;
};
