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

roles.reserver.getPartConfig = function(room, creep) {
  let level = creep.level ? creep.level : 1;
  let datas = {layout: [MOVE, CLAIM],
    maxEnergyUsed: 650 * level,
    minEnergyStored: 650 * level};

  if (level === 5) {
    room.log('Build super reserver');
    datas.minEnergyStored = 5 * 650;
    datas.maxEnergyUsed = room.energyAvailable;
  }
  return room.getPartConfig(datas);
};

roles.reserver.action = function(creep) {
  if (!creep.memory.routing.targetId) {
    // TODO check when this happens and fix it
    creep.log('creep_reserver.action No targetId !!!!!!!!!!!' + JSON.stringify(creep.memory));
    if (creep.room.name == creep.memory.routing.targetRoom) {
      creep.memory.routing.targetId = creep.room.controller.id;
    }
  }

  // TODO this should be enabled, because the reserver should flee without being attacked
  creep.notifyWhenAttacked(false);

  creep.handleReserver();
  return true;
};

roles.reserver.execute = function(creep) {
  creep.log('Execute!!!');
};
