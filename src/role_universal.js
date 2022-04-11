'use strict';

/*
 * universal makes sure that extensions are filled
 *
 * Before storage or certain store threshold:
 *  - get dropped energy or from source
 *  - fill extensions
 *  - build constructionSites
 *  - upgrade Controller
 *
 * Proper storage store level:
 *  - Move along the universal path
 *  - pathPos === 0 get energy from storage
 *  - transfer energy to extensions in range
 */

roles.universal = {};

roles.universal.settings = {
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

/**
 * @param {object} room - the room to spawn in
 * @return {{maxLayoutAmount: number}|{amount: number[], maxLayoutAmount: number, layoutString: string, prefixString: string}}
 */
roles.universal.updateSettings = function(room) {
  if (!room.isStruggling() && room.energyAvailable >= 350) {
    // LayoutCost minimum: prefix 250 + layout 100 -> 350
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

roles.universal.buildRoad = true;
roles.universal.boostActions = ['capacity'];

const universalBeforeStorage = function(creep) {
  if (creep.room.isStruggling()) {
    creep.universalBeforeStorage();
    creep.memory.routing.reached = false;
    return true;
  }
  return false;
};

/**
 * pickupResourcesInRange
 *
 * @param {object} creep
 */
function pickupResourcesInRange(creep) {
  const resources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
  if (resources.length > 0) {
    creep.pickup(resources[0]);
  }
}

/**
 * handlePathEnd
 *
 * @param {object} creep
 */
function handlePathEnd(creep) {
  if (creep.room.memory.position.pathEndLevel) {
    if (creep.memory.routing.pathPos >= creep.room.memory.position.pathEndLevel[creep.room.controller.level]) {
      creep.memory.move_forward_direction = false;
      creep.memory.routing.reverse = true;
      delete creep.memory.routing.reached;
    }
  }
}

/**
 * handlePathStart
 *
 * @param {object} creep
 * @param {boolean} reverse
 * @return {boolean}
 */
function handlePathStart(creep, reverse) {
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
}

roles.universal.preMove = function(creep, directions) {
  creep.creepLog(`preMove`);
  if (universalBeforeStorage(creep)) {
    return true;
  }

  pickupResourcesInRange(creep);

  if (typeof(creep.memory.move_forward_direction) === 'undefined') {
    creep.memory.move_forward_direction = true;
  }

  // changed control flow: first transferToStructures then universalBeforeStorage
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

  creep.memory.routing.targetId = 'universal';

  if (handlePathStart(creep, reverse)) {
    return true;
  }

  if (directions && creep.memory.routing.reverse) {
    directions.direction = directions.backwardDirection;
  }

  handlePathEnd(creep);
};

roles.universal.action = function(creep) {
  creep.creepLog(`action`);
  if (!creep.memory.routing.targetId) {
    creep.memory.routing.targetId = 'universal';
  }

  if (universalBeforeStorage(creep)) {
    return true;
  }

  creep.memory.move_forward_direction = false;
  creep.memory.routing.reverse = true;
  delete creep.memory.routing.reached;
  return true;
};
