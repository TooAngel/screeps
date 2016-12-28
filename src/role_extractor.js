'use strict';

/*
 * extractor gets minerals from the extractor
 *
 * Moves, harvest, brings to the terminal
 */

roles.extractor = {};

roles.extractor.boostActions = ['harvest', 'capacity'];

roles.extractor.getPartConfig = function(room, energy, heal) {
  let datas = {layout: [MOVE, MOVE, CARRY, WORK]};
  return room.getPartConfig(energy, datas);
};

roles.extractor.energyBuild = function(room, energy, heal) {
  var max = 2000;
  energy = Math.max(250, Math.min(max, room.getEnergyCapacityAvailable()));
  return energy;
};

roles.extractor.action = function(creep) {
  return creep.handleExractor();
};

roles.extractor.execute = function(creep) {
  return creep.handleExractor();
};
