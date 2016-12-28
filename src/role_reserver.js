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

roles.reserver.getPartConfig = function(room, energy, heal) {
  let datas = {layout: [MOVE, CLAIM]};
  return room.getPartConfig(energy, datas);
};

roles.reserver.energyRequired = function(room) {
  return BODYPART_COST[CLAIM] + BODYPART_COST[MOVE];
};

roles.reserver.energyBuild = function(room, energy, heal, level) {
  if (!level) {
    level = 1;
  }

  if (level == 5) {
    let value = Math.max((BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]) * level, energy);
    let energyLevel = level * (BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]);
    let multiplier = Math.floor(value / energyLevel);
    room.log('Build super reserver');
    return multiplier * energyLevel;
  }
  return (BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]) * level;
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
