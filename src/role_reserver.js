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
  param: ['energyCapacityAvailable'],
  layoutString: 'MK',
  amount: {
    0: [1,0],
    650: [1,1],
    1300: [2,2]
  },
  maxLayoutAmount: 1
};
roles.reserver.updateSettings = function(room, creep) {
  if (creep.level === 5) {
    room.log('Build super reserver');
    return {
      amount: [5, 5],
    };
  }
};

roles.reserver.action = function(creep) {
  creep.mySignController();
  if (!creep.memory.routing.targetId) {
    // TODO check when this happens and fix it
    creep.log('creep_reserver.action No targetId !!!!!!!!!!!' + JSON.stringify(creep.memory));
    if (creep.room.name === creep.memory.routing.targetRoom) {
      creep.memory.routing.targetId = creep.room.controller.id;
    }
  }

  creep.say('Reserver -> ' + creep.memory.routing.targetRoom);

  // TODO this should be enabled, because the reserver should flee without being attacked
  if (!creep.memory.notifDisabled) {
    creep.notifyWhenAttacked(false);
    creep.memory.notifDisabled = true;
  }

  if (creep.room.name !== creep.memory.routing.targetRoom) {
    creep.memory.routing.reached = false;
    return false;
  }
  creep.reserverSetLevel();
  creep.spawnReplacement(1);

  creep.callCleaner();

  if (creep.room.exectueEveryTicks(100)) {
    creep.checkSourcer();
  }

  if (config.creep.reserverDefender) {
    creep.callDefender();
  }

  creep.interactWithController();
  return true;
};

roles.reserver.execute = function(creep) {
  creep.log('Execute!!!');
};
