'use strict';

global.brain = {
  stats: {},
  main: {},
};
global.roles = {};
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
    showCostMatrices: false,
    showCostMatrixValues: false,
  },

  quests: {
    enabled: true,
    endTime: 10000,
    signControllerPercentage: 0.1,
    checkInterval: 100,
  },

  controller: {
    aboutToDowngradePercent: 10,
  },

  storage: {
    lowValue: 2000,
  },

  info: {
    signController: true,
    signText: 'Fully automated open source NPC: http://tooangel.github.io/screeps/',
    resignInterval: 500,
  },

  // Due to newly introduces via global variable caching this can be removed
  performance: {
    serializePath: true,
    costMatrixMemoryMaxGCL: 15,
  },

  // use username `tooangels` and password `tooSecretPassword` at https://screepspl.us/grafana
  stats: {
    screepsPlusEnabled: false,
    screepsPlusToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRvb2FuZ2VscyIsImlhdCI6MTQ4MzU2MTU3OSwiYXVkIjoic2NyZWVwc3BsLnVzIiwiaXNzIjoic2NyZWVwc3BsLnVzIn0.NhobT7Jg8bOAg-MYqrYsgeMgXEVXGVYG9s3G9Qpfm-o',
    enabled: false,
  },

  debug: {
    attack: false,
    baseBuilding: false,
    diplomacy: false,
    getPartsConfLogs: false,
    queue: false,
    spawn: false,
    mineral: false,
    creepLog: {
      roles: [],
      rooms: [],
    },
    power: false,
    reserver: false,
    nextroomer: false,
    quests: false,
    revive: false,
    market: false,
    invader: false,
    cpu: false,
    energyTransfer: false,
    constructionSites: false,
    routing: false,
    brain: false,
    commodities: false,
    memory: true,
    boosts: false,
  },

  tower: {
    healMyCreeps: true,
    repairStructures: false,
  },

  autoAttack: {
    notify: true,
    minAttackRCL: 6,
    timeBetweenAttacks: 2000,
    noReservedRoomMinMyRCL: 5,
    noReservedRoomInRange: 1,
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
    mineralValues: {
      [RESOURCE_HYDROGEN]: 15,
      [RESOURCE_OXYGEN]: 10,
      [RESOURCE_UTRIUM]: 15,
      [RESOURCE_KEANIUM]: 15,
      [RESOURCE_LEMERGIUM]: 15,
      [RESOURCE_ZYNTHIUM]: 15,
      [RESOURCE_CATALYST]: 10,
    },
    resourceStats: true,
    resourceStatsDivider: 10000,
    distanceFactor: 2,
  },

  carryHelpers: {
    ticksUntilHelpCheck: 400,
    maxHelpersAmount: 5,
    helpThreshold: 1500, // todo not used?
    needThreshold: 750, // todo not used?
    maxDistance: 7,
    factor: 0.2,
  },

  power: {
    disabled: false,
  },

  commodities: {
    disabled: false,
  },

  pixel: {
    enabled: false,
    minBucketAfter: 2500,
  },

  tickSummary: {
    bucket: false,
    gcl: false,
    separator: false,
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
    rememberInRoom: 1500,
  },

  path: {
    refresh: 2000000,
    allowRoutingThroughFriendRooms: false,
    pathFindIncomplete: true, // todo not used ?
  },

  external: {
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
    callUniversalPerResources: 100,
  },

  creep: {
    renewOffset: 0,
    queueTtl: 250,
    structurer: true,
    structurerInterval: 1500,
    structurerMinEnergy: 1300,
    reserverDefender: true,
    sortParts: true,
    swarmSourceHarvestingMaxParts: 10,
  },

  myRoom: {
    underAttackMinAttackTimer: 50,
    leastSpawnsToRebuildStructureSpawn: 1,
  },

  room: {
    reserveSpawnIdleThreshold: 0.2,
    spawnIdle: 0.1,
    nextroomerSpawnIdleThreshold: 0.05,
    spawnIdleFactor: 0.001,
    isHealthyStorageThreshold: 100000,
    handleNukeAttackInterval: 132,
    reviveEnergyCapacity: 1000,
    reviveEnergyAvailable: 1000,
    scoutInterval: 1499,
    scout: true,
    upgraderMinStorage: 0,
    upgraderStorageFactor: 2,
    lastSeenThreshold: 100000,
    notify: false,
    observerRange: 5, // Reduced to save memory OBSERVER_RANGE, // between 1 and 10:OBSERVER_RANGE
    spawnCarryIntervalOffset: 160,
  },

  layout: {
    borderAvoid: 40,
    creepAvoid: 0xFF,
    pathAvoid: 1,
    plainAvoid: 10,
    plainCost: 5,
    skLairAvoidRadius: 5,
    skLairAvoid: 50,
    sourceAvoid: 60,
    structureAvoid: 0xFF,
    swampCost: 8,
    version: 22,
    wallAvoid: 20,
    wallThickness: 1,
  },

  diplomacy: {
    checkPlayersInterval: 100,
  },

  terminal: {
    minEnergyAmount: 40000,
    maxEnergyAmount: 50000,
  },

  boosts: {
    enabled: true,
  },

  mineral: {
    enabled: true,
    storage: 100000,
    minAmount: 5000,
  },

  market: {
    // sets mineral in terminal could be called minAmountMineralsNotToSell
    minAmountToSell: 50000,
    minSellPrice: 0.6,
    energyCreditEquivalent: 1,
    sellByOwnOrders: true,
    sellOrderMaxAmount: 100,
    sellOrderReserve: 2000,
    sellOrderPriceMultiplicand: 5,
    maxAmountToBuy: 1000,
    maxBuyPrice: 0.5,
    // buyByOwnOrders: true,
    buyOrderPriceMultiplicand: 0.5,

    // buy power if we have more credits than config.market.minCredits
    buyPower: false,
    // 300M credits
    minCredits: 300000000,
    // disable to use power only in gathered room
    sendPowerOwnRoom: true,
    // equalizes the energy between your rooms via terminal
    sendEnergyToMyRooms: true,
  },

  priorityQueue: {
    sameRoom: {
      universal: 1,
      sourcer: 2,
      storagefiller: 3,
      defendranged: 4,
      carry: 5,
    },
    otherRoom: {
      claimer: 6,
      universal: 11,
      defender: 12,
      defendranged: 13,
      nextroomer: 14,
      sourcer: 15,
      carry: 16,
      reserver: 17,
      watcher: 18,
      atkeeper: 19,
      atkeepermelee: 19,
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

  useConstructingSpawnEmergencyOperations: {
    enabled: true,
  },

  maliciousNpcUsernames: ['Invader', 'Source Keeper'],
};

try {
  require('config_local'); // eslint-disable-line global-require
} catch (e) {
  // empty
}
