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
  return room.get_part_config(energy, parts);
};

roles.extractor.get_part_config = roles.extractor.getPartConfig;

roles.extractor.energyBuild = function(room, energy, source, heal) {
  var max = 2000;
  energy = Math.max(250, Math.min(max, room.energyCapacityAvailable));
  return energy;
};

roles.extractor.action = function(creep) {
  return creep.handleExractor();
};

roles.extractor.execute = function(creep) {
  return creep.handleExractor();
};
