'use strict';

/*
 * extractor gets minerals from the extractor
 *
 * Moves, harvest, brings to the terminal
 */

roles.extractor = {};

roles.extractor.settings = {
  prefixString: 'WMC',
  layoutString: 'MW',
  amount: [1, 2],
  maxLayoutAmount: 999,
};

roles.extractor.boostActions = ['harvest'];
roles.extractor.buildRoad = true;

roles.extractor.preMove = function(creep, directions) {
  creep.preMoveExtractorSourcer(directions);
};

/**
 * getMineral - Gets the mineral from heap data, or sets if missing
 *
 * @param {object} creep - The creep
 * @return {object} - The tower
 **/
function getMineral(creep) {
  if (!creep.data.mineral) {
    const minerals = creep.room.findMinerals();
    creep.data.mineral = minerals[0].id;
  }
  return Game.getObjectById(creep.data.mineral);
}

roles.extractor.action = function(creep) {
  if (!creep.room.terminal) {
    creep.suicide();
    return true;
  }
  const mineral = getMineral(creep);
  creep.harvest(mineral);
  for (const key in creep.store) {
    if (creep.store[key] === 0) {
      continue;
    }
    creep.transfer(creep.room.terminal, key);
  }
  return true;
};
