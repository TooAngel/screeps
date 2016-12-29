'use strict';

/*
 * extractor gets minerals from the extractor
 *
 * Moves, harvest, brings to the terminal
 */

roles.extractor = {};

roles.extractor.boostActions = ['harvest', 'capacity'];

roles.extractor.getPartConfig = function(room) {
  let datas = {layout: [MOVE, MOVE, CARRY, WORK],
    maxEnergyUsed: 2000,
    minEnergyStored: 250};
  return room.getPartConfig(datas);
};

roles.extractor.action = function(creep) {
  return creep.handleExractor();
};

roles.extractor.execute = function(creep) {
  return creep.handleExractor();
};
