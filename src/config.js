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
    //--- Uncomment screepsplusToken for share datas on TooAngels datasboard on screepspl.us
    //--- You can acces datas contacting tooangel on tooangels slack channel or use your token.
    //screepsplusToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRvb2FuZ2VscyIsImlhdCI6MTQ4MzU2MTU3OSwiYXVkIjoic2NyZWVwc3BsLnVzIiwiaXNzIjoic2NyZWVwc3BsLnVzIn0.NhobT7Jg8bOAg-MYqrYsgeMgXEVXGVYG9s3G9Qpfm-o'
  },

  debug: {
    getPartsConfLogs: false
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
  },

  priorityQueue: {
    sameRoom: {
      harvester:     1,
      sourcer:       2,
      storagefiller: 3,
      defendranged:  3
    },
    otherRoom: {
      harvester:     1,
      defender:      2,
      defendranged:  3,
      nextroomer:    5,
      reserver:      6,
      carry:         7,
      sourcer:       8
    }
  }
};

try {
  require('config_local');
} catch (e) {}
