'use strict';

/*
 * mineral manages the mineral distributions
 *
 * Checks for room reactions and transfers mineral to the associated labs
 * Checks for boost request and transfers mineral to the associated labs
 * Fills the labs with energy
 */

roles.mineral = {};
roles.mineral.getPartConfig = function(room, energy, heal) {
  let datas = {layout: [MOVE, CARRY]};
  return room.getPartConfig(energy, datas);
};

roles.mineral.energyBuild = function(room, energy, heal) {
  var max = 1000;
  energy = Math.max(250, Math.min(max, room.getEnergyCapacityAvailable()));
  return energy;
};

roles.mineral.action = function(creep) {
  return creep.handleMineralCreep();
};

roles.mineral.execute = function(creep) {
  return creep.handleMineralCreep();
};
