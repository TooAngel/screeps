'use strict';

/*
 * mineral manages the mineral distributions
 *
 * Checks for room reactions and transfers mineral to the associated labs
 * Checks for boost request and transfers mineral to the associated labs
 * Fills the labs with energy
 */

roles.mineral = {};
roles.mineral.settings = {
  layoutString: 'MC',
  amount: [2, 2],
  maxLayoutAmount: 10,

};

roles.mineral.updateAmount = function(creep, room) {
  return config.mineral.enabled && room.terminal &&
    (
      (room.memory.mineralBuilds && Object.keys(room.memory.mineralBuilds).length > 0) ||
      room.memory.reaction || room.memory.mineralOrder
    ) ? 1 : 0;
};

roles.mineral.action = function(creep) {
  return creep.handleMineralCreep();
};

roles.mineral.execute = function(creep) {
  return creep.handleMineralCreep();
};
