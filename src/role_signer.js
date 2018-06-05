'use strict';

/*
 * signer is used to sign controller in external rooms
 *
 * Moves to the controller and signs
 */

roles.signer = {};

roles.signer.settings = {
  layoutString: 'M',
  maxLayoutAmount: 1,
};

roles.signer.action = function(creep) {
  const returnCode = creep.signController(creep.room.controller, creep.memory.signText || config.info.signText);
  if (returnCode === OK) {
    // if (creep.memory.nextTarget) {
    //   creep.memory.signText = creep.memory.nextTarget.signText || creep.memory.signText;
    //   creep.memory.routing = creep.memory.nextTarget.routing;
    //   creep.memory.nextTarget = creep.memory.nextTarget.nextTarget;
    // } else {
    creep.suicide();
    // }
    return true;
  } else {
    creep.log(returnCode);
  }
};
