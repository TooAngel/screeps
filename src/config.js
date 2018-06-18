'use strict';

global.brain = {
  stats: {},
  main: {},
};
global.roles = {};
global.cache = {
  rooms: {},
  segments: {},
};
global.profiler = {};

try {
  global.friends = require('friends'); // eslint-disable-line global-require
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
    showPathSearches: true,
    showStructures: true,
    showCreeps: true,
    showBlockers: true,
    showCostMatrixes: false,
  },

  quests: {
    enabled: true,
    signControllerPercentage: 0.1,
  },

  info: {
    signController: true,
    signText: 'Fully automated TooAngel bot: http://tooangel.github.io/screeps/',
    resignInterval: 500,
  },

  // Due to newly introduces via global variable caching this can be removed
  performance: {
    serializePath: true,
    costMatrixMemoryMaxGCL: 15,
  },

  memory: {
    segments: 10,
    segmentsEnabled: true,
  },

  // use username `tooangels` and password `tooSecretPassword` at https://screepspl.us/grafana
  stats: {
    screepsPlusEnabled: false,
    screepsPlusToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRvb2FuZ2VscyIsImlhdCI6MTQ4MzU2MTU3OSwiYXVkIjoic2NyZWVwc3BsLnVzIiwiaXNzIjoic2NyZWVwc3BsLnVzIn0.NhobT7Jg8bOAg-MYqrYsgeMgXEVXGVYG9s3G9Qpfm-o',
    enabled: true,
    summary: false,
  },

  debug: {
    getPartsConfLogs: false,
    queue: false,
    spawn: false,
    mineral: false,
    creepLog: {
      roles: [], // Roles for debug output, e.g. ['repairer']
      rooms: [], // Rooms for debug output, e.g. ['E21N8']
    },
    power: false,
    nextroomer: false,
    quests: false,
  },

  tower: {
    // in the most cases they need heal not to break path movement
    // mostly npcs damaged my creeps, "big" players around me are on friend my list
    healMyCreeps: true, // so they should be healed
    repairStructures: true, // so they should be repair Structures (mostly roads)
  },

  autoattack: {
    disabled: false,
    notify: false,
    timeBetweenAttacks: 2000,
  },

  revive: {
    disabled: false,
    reviverMaxQueue: 4,
    reviverMinEnergy: 1300,
  },

  nextRoom: {
    boostToControllerLevel: 4,
    scoutMinControllerLevel: 4,
    ttlPerRoomForScout: 1500,
    numberOfNextroomers: 10,
    nextroomerInterval: 150, // default 500 (changed for fast build)
    maxRooms: _.max([Math.ceil(Game.gcl.level / 2), 2]), // default: 20 (changed for cpu reason)
    cpuPerRoom: 13, // Necessary CPU per room, prevent claiming new rooms
    revive: true,
    maxDistance: 10, // default 17 (if more than 10, some code will break eg helper carry and terminal energy transfer ??? unsure)
    minNewRoomDistance: 2,
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
    factor: 0.2,
  },

  power: {
    disabled: false,
    energyForCreeps: 800000,
    energyForSpawn: 250000,
  },

  buildRoad: {
    maxConstructionSitesTotal: 80,
    maxConstructionSitesRoom: 3,
    buildToOtherMyRoom: false,
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
    defendDistance: 1,
  },

  carry: {
    sizes: {
      0: [3, 3], // RCL 1
      550: [4, 4], // RCL 2
      800: [6, 6], // RCL 3
      1300: [6, 11], // RCL 4
      1800: [8, 15], // RCL 5
      2300: [11, 21], // RCL 6
    },
    minSpawnRate: 50,
    // Percentage should increase from base to target room. Decrease may cause stack on border
    carryPercentageBase: 0.1,
    carryPercentageHighway: 0.2,
    carryPercentageExtern: 0.5,
    callHarvesterPerResources: 1000,
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
    swarmSourceHarvestingMaxParts: 10,
  },

  room: {
    reservedRCL: {
      0: 1,
      1: 1,
      2: 1,
      3: 1,
      4: 1,
      5: 1,
      6: 1,
      7: 1,
      8: 1,
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
    upgraderStorageFactor: 2,
    lastSeenThreshold: 1000000,
    notify: false,
    observerRange: OBSERVER_RANGE, // between 1 and 10:OBSERVER_RANGE
  },

  layout: {
    plainCost: 5,
    swampCost: 8,
    borderAvoid: 20,
    skLairAvoidRadius: 5,
    skLairAvoid: 30,
    wallAvoid: 10,
    sourceAvoid: 20,
    pathAvoid: 1,
    structureAvoid: 0xFF,
    creepAvoid: 0xFF,
    wallThickness: 1,
    version: 19,
  },

  terminal: {
    minEnergyAmount: 40000, // was 80000
    maxEnergyAmount: 50000, // was 120000
    storageMinEnergyAmount: 20000,
  },

  mineral: {
    enabled: true,
    storage: 100000,
    minAmount: 5000,
  },

  market: {
    minAmountToSell: 50000, // was 100000
    minSellPrice: 0.6,
    energyCreditEquivalent: 1,
    sellByOwnOrders: true,
    sellOrderMaxAmount: 100,
    sellOrderReserve: 2000,
    sellOrderPriceMultiplicator: 5,
    maxAmountToBuy: 1000,
    maxBuyPrice: 0.5,
    // buyByOwnOrders: true,
    buyOrderPriceMultiplicator: 0.5,

    // buy power if we have more credits than config.market.minCredits
    buyPower: false,
    // 3M credits
    minCredits: 3000000,
    // disable to use power only in gathered room
    sendPowerOwnRoom: true,
    // equalizes the energy beween your rooms via termial
    sendEnergyToMyRooms: true,
  },

  priorityQueue: {
    sameRoom: {
      harvester: 1,
      sourcer: 2,
      storagefiller: 3,
      defendranged: 4,
      carry: 5,
    },
    otherRoom: {
      harvester: 11,
      defender: 12,
      defendranged: 13,
      nextroomer: 15,
      carry: 16,
      watcher: 17,
      atkeeper: 18,
      atkeepermelee: 18,
      sourcer: 19,
      reserver: 20,
    },
  },

  main: {
    enabled: true,
    randomExecution: false,
    executeAll: 10,
  },

  keepers: {
    enabled: false,
    minControllerLevel: 8,
  },

  cpuStats: {
    enabled: false,
  },

};

try {
  require('config_local'); // eslint-disable-line global-require
} catch (e) {
  // empty
}
