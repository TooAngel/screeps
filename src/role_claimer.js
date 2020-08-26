'use strict';

/*
 * claimer is called when the number of rooms is < possible rooms
 *
 * targetRoom and targetId is set so the creep just follows the path
 * Claims the controller and room revive will drop in.
 */

roles.claimer = {};

roles.claimer.settings = {
  layoutString: 'MK',
  maxLayoutAmount: 1,
};

roles.claimer.action = function(creep) {
  creep.creepLog('New claimer, in room, claiming');
  // TODO just added the targetId to the creep, I hope it works
  // const returnCodeMove = creep.moveTo(creep.room.controller.pos);
  // console.log(`Move returnCode ${returnCodeMove}`);
  const returnCode = creep.claimController(creep.room.controller);
  if (returnCode === OK) {
    creep.creepLog('New claimer, in room, claimed');
    creep.suicide();
  }
  return true;
};
