'use strict';

/*
 * mineral manages the mineral distributions
 *
 * Checks for room reactions and transfers mineral to the associated labs
 * Checks for boost request and transfers mineral to the associated labs
 * Fills the labs with energy
 */

roles.mineral = {};
roles.mineral.getPartConfig = function(room) {
  let datas = {layout: [MOVE, CARRY],
    maxEnergyUsed: 1000,
    minEnergyStored: 250};
  return room.getPartConfig(datas);
};

roles.mineral.action = function(creep) {
  return creep.handleMineralCreep();
};

roles.mineral.execute = function(creep) {
  return creep.handleMineralCreep();
};
