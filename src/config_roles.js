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
global.config.sourcer.setup = {
  prefixParts: [MOVE,CARRY,WORK],
  layout: [WORK,HEAL],
  amount: [4,1],
  sufixParts: undefined,
  minEnergyStored: 200,
  sameRoomPriority: 2,
  otherRoomPriority: 8
};
