global.config.priorityQueue = {
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
};
// Work On Progress
global.config.sourcer = {
  sameRoomPriority: 2,
  otherRoomPriority: 8,
  param: 'controller.level',
  step: 1,
  setup: {
    prefixParts: {1: [MOVE,CARRY,WORK]},
    layout: {1: [WORK,HEAL], 4: [WORK,MOVE]},
    amount: {1: [4,1], 4: []},
    sufixParts: {4: [HEAL]},
    minEnergyStored: {1: 200},
    maxEnergyUsed: {4: 1000}
  }
};
global.config.upgrader = {
  //TODO found how to mix that with storage check
  param: 'controller.level',
  step: 1,
  setup: {
    prefixParts: {1: [MOVE,CARRY,WORK]},
    layout: {1: [MOVE,WORK,WORK], 4: [WORK]},
    minEnergyStored: {1: 200, 4: 1000},
    maxEnergyUsed: {1: 350}
  }
};
global.config.harvester = {
  param: 'storage.store.energy',
  step: config.creep.energyFromStorageThreshold,
  sameRoomPriority: 1,
  otherRoomPriority: 1,
  setup: {
    layout: {1: [MOVE,MOVE,WORK,CARRY]},
    sufixParts: {2: [WORK, MOVE]},
    minEnergyStored: {1: 250},
    maxEnergyUsed: {1: 1500}
  }
};
