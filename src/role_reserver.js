'use strict';

/*
 * reserver is used to reserve controller in external harvesting rooms
 *
 * Moves to the controller and reserves
 * Currently checks if there are enough sourcer and maybe trigger a defender.
 */

roles.reserver = {};
roles.reserver.killPrevious = true;
// TODO should be true, but flee must be fixed  (2016-10-13)
roles.reserver.flee = false;

roles.reserver.settings = {
  layoutString: 'MK',
  maxLayoutAmount: 1,
};
roles.reserver.updateSettings = function(room, creep) {
  // room.debugLog('reserver', `role_reserver.updateSettings; targetRoom: ${creep.routing.targetRoom}`);
  const targetRoom = Game.rooms[creep.routing.targetRoom];
  if (targetRoom) {
    const reservation = targetRoom.controller.reservation;
    if (reservation) {
      const maxReserveTicks = CONTROLLER_RESERVE_MAX - reservation.ticksToEnd;
      // E.g. ticksToEnd: 3300, RESERVE_MAX: 5000, LIFE_TIME 500
      // maxReserveTicks = 1700
      // maxClaimParts = 4 (1 to keep up the ticking + 3 to increase the ticksToEnd)
      const maxClaimParts = Math.ceil(maxReserveTicks / CREEP_CLAIM_LIFE_TIME);
      room.debugLog('reserver', `role_reserver.updateSettings - maxReserveTicks: ${maxReserveTicks} life_time: ${CREEP_CLAIM_LIFE_TIME} maxClaimParts: ${maxClaimParts}`);
      return {
        maxLayoutAmount: maxClaimParts,
      };
    }
  }
  // room.debugLog('reserver', `role_reserver.updateSettings - Can not access targetRoom ${targetRoom}`);
  return {
    maxLayoutAmount: 1,
  };
};

/**
 * callCleaner
 *
 * @param {object} creep
 * @return {boolean}
 */
function callCleaner(creep) {
  if (creep.inBase()) {
    return false;
  }

  if (!Game.rooms[creep.memory.base].storage) {
    return false;
  }

  if (!creep.room.executeEveryTicks(1000)) {
    return false;
  }

  if (config.creep.structurer) {
    callStructurer(creep);
  }
}

/**
 * callStructurer
 *
 * @param {object} creep
 */
function callStructurer(creep) {
  if (creep.room.isMy()) {
    creep.log(`Calling structurer with my room`);
    return;
  }
  const resourceStructures = creep.room.findDestructibleStructures();
  if (resourceStructures.length > 0) {
    creep.log('Call structurer from ' + creep.memory.base + ' because of ' + resourceStructures[0].structureType);
    Game.rooms[creep.memory.base].checkRoleToSpawn('structurer', 1, undefined, creep.room.name);
  }
}

/**
 * interactWithControllerSuccess
 *
 * @param {object} creep
 */
function interactWithControllerSuccess(creep) {
  if (creep.room.controller.reservation) {
    creep.room.data.reservation = {
      base: creep.memory.base,
      tick: Game.time,
      ticksToLive: creep.ticksToLive,
      ticksToEnd: creep.room.controller.reservation.ticksToEnd,
    };
  }
}

/**
 * interactWithController
 *
 * @param {object} creep
 * @return {boolean}
 */
function interactWithController(creep) {
  let returnCode;
  if (creep.room.controller.owner && creep.room.controller.owner.username !== Memory.username) {
    creep.say('attack');
    returnCode = creep.attackController(creep.room.controller);
  } else if (creep.room.controller.reservation && creep.room.controller.reservation.username !== Memory.username) {
    creep.say('unreserve');
    returnCode = creep.attackController(creep.room.controller);
  } else {
    returnCode = creep.reserveController(creep.room.controller);
  }

  if (returnCode === OK || returnCode === ERR_NO_BODYPART) {
    interactWithControllerSuccess(creep);
    return true;
  }
  if (returnCode === ERR_NOT_IN_RANGE) {
    return true;
  }
  if (returnCode === ERR_INVALID_TARGET) {
    return true;
  }

  creep.log('reserver: ' + returnCode);
}

/**
 * callDefender
 *
 * @param {object} creep
 */
function callDefender(creep) {
  const hostiles = creep.room.findEnemies();
  const invaderCores = creep.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_INVADER_CORE}});
  if (hostiles.length > 0 || invaderCores.length > 0) {
    // this.log('Reserver under attack');
    if (!creep.memory.defender_called) {
      Game.rooms[creep.memory.base].memory.queue.push({
        role: 'defender',
        routing: {
          targetRoom: creep.room.name,
        },
      });
      creep.memory.defender_called = true;
    }
  }
}


roles.reserver.action = function(creep) {
  creep.mySignController();
  creep.setNextSpawn();
  if (creep.room.data.state !== 'Controlled') {
    creep.spawnReplacement();
  }

  callCleaner(creep);

  if (config.creep.reserverDefender) {
    callDefender(creep);
  }

  interactWithController(creep);
  return true;
};
