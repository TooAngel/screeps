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
  room.debugLog('reserver', `role_reserver.updateSettings; targetRoom: ${creep.routing.targetRoom}`);
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
  room.debugLog('reserver', `role_reserver.updateSettings - Can not access targetRoom`);
  return {
    maxLayoutAmount: 1,
  };
};

roles.reserver.action = function(creep) {
  creep.mySignController();
  if (!creep.memory.routing.targetId) {
    // TODO check when this happens and fix it
    creep.log('creep_reserver.action No targetId !!!!!!!!!!!');
    if (creep.room.name === creep.memory.routing.targetRoom) {
      creep.memory.routing.targetId = creep.room.controller.id;
    }
  }

  // TODO this should be enabled, because the reserver should flee without being attacked
  creep.notifyWhenAttacked(false);

  creep.handleReserver();
  return true;
};
