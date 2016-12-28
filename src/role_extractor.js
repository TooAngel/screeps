'use strict';

/*
 * extractor gets minerals from the extractor
 *
 * Moves, harvest, brings to the terminal
 */

roles.extractor = {};

roles.extractor.boostActions = ['harvest', 'capacity'];

roles.extractor.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, CARRY, MOVE, WORK];
  return room.getPartConfig(energy, parts);
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
