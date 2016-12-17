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
    enabled: true
  },

  // Due to newly introduces via global variable caching this can be removed
  performance: {
    serializePath: true
  },

  stats: {
    enabled: false,
    summary: false
  },

  autoattack: {
    disabled: false // Currently disabled, have to make sure my ally doesn't get attacked
  },

  nextRoom: {
    scoutMinControllerLevel: 4,
    ttlPerRoomForScout: 500,
    numberOfNextroomers: 3,
    maxRooms: 30,
    revive: true,
    maxDistance: 17,
    minNewRoomDistance: 3
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
    allowRoutingThroughFriendRooms: false
  },

  external: {
    distance: 3
  },

  sourcer: {
    spawnCarryLevelMultiplier: 300,
    spawnCarryWaitTime: 400
  },

  carry: {
    size: 200
  },

  creep: {
    renewOffset: 20,
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
    nextroomerInterval: 354,
    scoutInterval: 1032,
    scout: true, // TODO somehow broken ?? Is it broken ??
    upgraderMinStorage: 10000,
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
    minAmountForMarket: 1000
  }
};
