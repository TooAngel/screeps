'use strict';

global.brain = {};
global.roles = {};
global.cache = {
  rooms: {}
};

try {
  global.friends = require('friends');
} catch (e) {
  global.friends = [];
}

global.config = {
  profiler: {
    enabled: false,
  },
  visualizer: {
    enabled: false,
    showRoomPaths: true,
    showCreepPaths: true,
    refresh: true,
  },

  info: {
    signController: true
  },

  // Due to newly introduces via global variable caching this can be removed
  performance: {
    serializePath: true
  },

  stats: {
    enabled: false,
    summary: false,
  },

  autoattack: {
    disabled: false,
    notify: false,
  },

  nextRoom: {
    scoutMinControllerLevel: 4,
    ttlPerRoomForScout: 500,
    numberOfNextroomers: 10,
    nextroomerInterval: _.ceil(1500 / 10),
    maxRooms: 30,
    revive: true,
    maxDistance: 17,
    minNewRoomDistance: 3,
    minEnergyForActive: 1000,
    minDowngradPercent: 90
  },

  power: {
    disabled: false,
    energyForCreeps: 800000,
    energyForSpawn: 250000
  },

  buildRoad: {
    maxConstructionSitesTotal: 80,
    maxConstructionSitesRoom: 3
  },

  constructionSite: {
    maxIdleTime: 5000
  },

  hostile: {
    remeberInRoom: 1500
  },

  path: {
    refresh: 20000,
    allowRoutingThroughFriendRooms: false,
    pathfindIncomplete: false
  },

  external: {
    distance: 3
  },

  sourcer: {
    spawnCarryLevelMultiplier: 300,
    spawnCarryWaitTime: 400
  },

  carry: {
    size: 200,
    carryPercentageBase: 0.2,
    carryPercentageExtern: 0.5
  },

  creep: {
    renewOffset: 0,
    queueTtl: 100,
    structurer: true,
    reserverDefender: true,
    energyFromStorageThreshold: 2000
  },

  room: {
    revive: true,
    rebuildLayout: 7654,
    handleNukeAttackInterval: 132,
    reviveEnergyAvailable: 1000,
    reviveStorageAvailable: 3000,
    scoutInterval: 1499,
    scoutSkipWhenStuck: true, // Useful for novice areas.
    scout: true, // TODO somehow broken ?? Is it broken ??
    upgraderMinStorage: 0,
    lastSeenThreshold: 10000
  },

  layout: {
    plainCost: 5,
    swampCost: 5,
    borderAvoid: 20,
    wallAvoid: 10,
    pathAvoid: 1,
    structureAvoid: 0xFF,
    creepAvoid: 0xFF,
    wallThickness: 1,
    version: 16
  },

  mineral: {
    enabled: false,
    storage: 100000,
    minAmount: 5000,
    minAmountForMarket: 100000
  }
};

try {
  require('config_local');
} catch (e) {}
