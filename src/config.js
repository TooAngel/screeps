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
    showRoomPaths: false,
    showCreepPaths: false,
    showPathSearches: false,
    showStructures: false,
    showCreeps: false,
    showBlockers: false,
    showCostMatrixes: false,
    showCostMatrixValues: false,
  },

  quests: {
    enabled: true,
    endTime: 10000,
    signControllerPercentage: 0.1,
    checkInterval: 100,
  },

  info: {
    signController: true,
    signText: 'Fully automated open source bot: http://tooangel.github.io/screeps/',
    resignInterval: 500,
  },

  // Due to newly introduces via global variable caching this can be removed
  performance: {
    serializePath: true,
    costMatrixMemoryMaxGCL: 15,
  },

  memory: {
    segments: 20,
    segmentsEnabled: false,
  },

  // use username `tooangels` and password `tooSecretPassword` at https://screepspl.us/grafana
  stats: {
    screepsPlusEnabled: false,
    screepsPlusToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRvb2FuZ2VscyIsImlhdCI6MTQ4MzU2MTU3OSwiYXVkIjoic2NyZWVwc3BsLnVzIiwiaXNzIjoic2NyZWVwc3BsLnVzIn0.NhobT7Jg8bOAg-MYqrYsgeMgXEVXGVYG9s3G9Qpfm-o',
    enabled: false,
    summary: false,
  },

  debug: {
    getPartsConfLogs: false,
    baseBuilding: false,
    queue: false,
    spawn: false,
    mineral: false,
    creepLog: {
      roles: [], // Roles for debug output, e.g. ['repairer'] or '*' for all
      rooms: [], // Rooms for debug output, e.g. ['E21N8'] or '*' for all
    },
    power: false,
    reserver: false,
    nextroomer: false,
    quests: false,
    revive: false,
    quest: false,
    market: false,
    invader: false,
    cpu: false,
    energyTransfer: false,
    constructionSites: false,
    routing: false,
    brain: false,
    attack: true,
    // Check bugs:
    // - check wrong link order
    checkbugs: false,
  },

  tower: {
    healMyCreeps: true,
    repairStructures: false,
  },

  autoattack: {
    disabled: false,
    notify: true,
    timeBetweenAttacks: 2000,
    noReservedRoomMinMyRCL: 5,
    noReservedRoomInRange: 2,
    noReservedRoomInterval: 1600,
  },

  revive: {
    disabled: false,
    nextroomerInterval: 400,
  },

  nextRoom: {
    scoutMinControllerLevel: 4,
    intervalToCheck: CREEP_CLAIM_LIFE_TIME,
    maxRooms: 8,
    cpuPerRoom: 13, // Necessary CPU per room, prevent claiming new rooms
    // creep max run distance for next room
    // if terminal should send energy rooms should be close
    maxDistance: 10,
    minNewRoomDistance: 2,
    minEnergyForActive: 1000,
    notify: false,
  },

  carryHelpers: {
    ticksUntilHelpCheck: 400,
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

  pixel: {
    enabled: false,
    minBucketAfter: 2500,
  },

  ticksummary: {
    bucket: false,
    gcl: false,
    room: false,
    seperator: false,
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
    distance: 2,
    defendDistance: 1,
    checkForReservingInterval: 1499,
  },

  carry: {
    sizes: {
      0: [3, 3], // RCL 1
      550: [4, 4], // RCL 2
      600: [5, 3], // RCL 3 first extension, most of the roads should be build
      800: [5, 3], // RCL 3
      1300: [7, 4], // RCL 4
      1800: [9, 5], // RCL 5
      2300: [11, 6], // RCL 6
    },
    minSpawnRate: 50,
    // Percentage should increase from base to target room. Decrease may cause stack on border
    carryPercentageBase: 0.1,
    carryPercentageHighway: 0.2,
    carryPercentageExtern: 0.5,
    callHarvesterPerResources: 100,
  },

  creep: {
    renewOffset: 0,
    queueTtl: 250,
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
    isHealthyStorageThreshold: 50000,
    rebuildLayout: 7654,
    handleNukeAttackInterval: 132,
    reviveEnergyCapacity: 1000,
    reviveEnergyAvailable: 1000,
    scoutInterval: 1499,
    scout: true,
    upgraderMinStorage: 0,
    upgraderStorageFactor: 2,
    lastSeenThreshold: 1000000,
    notify: false,
    observerRange: 5, // Reduced to save memory OBSERVER_RANGE, // between 1 and 10:OBSERVER_RANGE
  },

  layout: {
    plainCost: 5,
    swampCost: 8,
    borderAvoid: 40,
    skLairAvoidRadius: 5,
    skLairAvoid: 50,
    wallAvoid: 20,
    plainAvoid: 10,
    sourceAvoid: 60,
    pathAvoid: 1,
    structureAvoid: 0xFF,
    creepAvoid: 0xFF,
    wallThickness: 1,
    version: 21,
  },

  terminal: {
    // terminals should not have to much enrgy, but not to less
    minEnergyAmount: 40000,
    maxEnergyAmount: 50000,
    storageMinEnergyAmount: 20000,
  },

  mineral: {
    enabled: true,
    storage: 100000,
    minAmount: 5000,
  },

  market: {
    // sets mineral in terminal could be called minAmountMinerlasNotToSell
    minAmountToSell: 50000,
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
    lowExecution: 0.5,
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
