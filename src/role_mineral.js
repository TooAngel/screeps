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
  parts: {layout: [MOVE, CARRY]},
  energy: {
    maxEnergyUsed: 1000,
    minEnergyStored: 250
  }
};

roles.mineral.action = function(creep) {
  return creep.handleMineralCreep();
};

roles.mineral.execute = function(creep) {
  return creep.handleMineralCreep();
};
