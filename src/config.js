'use strict';

global.brain = {
  stats: {}
};
global.roles = {};
global.cache = {
  rooms: {}
};
console.log('!! No global cache !!');

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
    showStructures: true,
    showCreeps: true,
    refresh: true,
  },

  info: {
    signController: true,
    signText: 'Fully automated TooAngel bot: http://tooangel.github.io/screeps/',
  },

  // Due to newly introduces via global variable caching this can be removed
  performance: {
    serializePath: true,
  },

  stats: {
    enabled: false,
    summary: false,
  },

  debug: {
    getPartsConfLogs: false,
    queue: false,
    spawn: false
  },

  autoattack: {
    disabled: false,
    notify: false,
  },

  revive: {
    disabled: false,
    reviverMaxQueue: 4,
    reviverMinEnergy: 1300
  },

  nextRoom: {
    boostToControllerLevel: 4,
    scoutMinControllerLevel: 4,
    ttlPerRoomForScout: 500,
    numberOfNextroomers: 10,
    nextroomerInterval: _.ceil(1500 / 10),
    maxRooms: 30,
    revive: true,
    maxDistance: 17,
    minNewRoomDistance: 3,
    minEnergyForActive: 1000,
    minDowngradPercent: 90,
    notify: false,
  },

  carryHelpers: {
    ticksUntilHelpCheck: 100,
    maxHelpersAmount: 5,
    helpTreshold: 1500,
    needTreshold: 750,
    maxDistance: 7,
    factor: 0.2
  },

  power: {
    disabled: false,
    energyForCreeps: 800000,
    energyForSpawn: 250000,
  },

  buildRoad: {
    maxConstructionSitesTotal: 80,
    maxConstructionSitesRoom: 3,
  },

  constructionSite: {
    maxIdleTime: 5000,
  },

  hostile: {
    remeberInRoom: 1500,
  },

  path: {
    refresh: 2000000,
    allowRoutingThroughFriendRooms: false,
    pathfindIncomplete: true,
  },

  external: {
    distance: 3,
  },

  sourcer: {
    spawnCarryLevelMultiplier: 300,
    spawnCarryWaitTime: 400,
  },

  carry: {
    size: 200,
    carryPercentageBase: 0.2,
    carryPercentageExtern: 0.5,
  },

  creep: {
    renewOffset: 0,
    queueTtl: 100,
    structurer: true,
    structurerInterval: 1500,
    structurerMinEnergy: 1300,
    reserverDefender: true,
    energyFromStorageThreshold: 2000,
    sortParts: true,
  },

  room: {
    reservedRCL: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 2,
      6: 3,
      7: 6,
      8: 9,
    },
    revive: true,
    rebuildLayout: 7654,
    handleNukeAttackInterval: 132,
    reviveEnergyCapacity: 1000,
    reviveEnergyAvailable: 1000,
    reviveStorageAvailable: 3000,
    scoutInterval: 1499,
    scoutSkipWhenStuck: true, // Useful for novice areas.
    scout: true, // TODO somehow broken ?? Is it broken ??
    upgraderMinStorage: 0,
    lastSeenThreshold: 1000000,
    notify: false,
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
    version: 16,
  },

  mineral: {
    enabled: false,
    storage: 100000,
    minAmount: 5000,
    minAmountForMarket: 100000,
  },

  priorityQueue: {
    sameRoom: {
      harvester: 1,
      sourcer: 2,
      storagefiller: 3,
      defendranged: 3
    },
    otherRoom: {
      harvester: 1,
      defender: 2,
      defendranged: 3,
      nextroomer: 5,
      reserver: 6,
      carry: 7,
      sourcer: 8
    }
  }
};

try {
  require('config_local');
} catch (e) {}
