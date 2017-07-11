'use strict';

brain.getFullPath = function* (startRoom, startId, targetRoom, targetId) {
  const route = Game.rooms[startRoom].findRoute(startRoom, targetRoom);
  route.splice(0, 0, {room: startRoom});
  for (let routePos = 0; routePos < route.length; ++routePos) {
    yield* Game.rooms[route[routePos].room].getPath(route, routePos, startId, targetId, false);
  }
};

const mem = {};
brain.getFullPathMemory = (sourceRoom, sourceId, targetRoom, targetId) => {
  const key = `${sourceRoom}:${sourceId}-${targetRoom}:${targetId}`;
  if (!mem[key]) {
    mem[key] = Array.from(brain.getFullPath(sourceRoom, sourceId, targetRoom, targetId))
  }
  return mem[key];
};

brain.getRoadsForRoom = (baseRoom, targetRoom, roads = {}) => {
  const sources = Game.rooms[targetRoom].find(FIND_SOURCES);
  for (let source of sources) {
    for (let road of brain.getFullPathMemory(baseRoom, 'pathStart', targetRoom, source.id)) {
      roads[road] = road;
    }
  }
  return roads;
};

brain.getRoadsMaintainCostPerTick = (baseRoom, ...targetRooms) => {
  const harvestPathRoads = {};
  for (let road of brain.getFullPathMemory(baseRoom, 'pathStart', baseRoom, 'harvester')) {
    harvestPathRoads[road] = road;
  }
  const roads = {};
  for (let targetRoom of targetRooms) {
    brain.getRoadsForRoom(baseRoom, targetRoom, roads);
  }
  let decaySum = 0;
  for (let pos of _.values(roads)) {
    if (!harvestPathRoads.hasOwnProperty(pos)) {
      decaySum += ROAD_DECAY_AMOUNT / ROAD_DECAY_TIME * (pos.lookFor(LOOK_TERRAIN)[0] === 'swamp' ? CONSTRUCTION_COST_ROAD_SWAMP_RATIO : 1);
    }
  }
  return decaySum * REPAIR_COST;
};

brain.getSourcersMaintainCostPerTick = (baseRoom, ...targetRooms) => {
  const creepCost = BODYPART_COST[WORK] * 5 + BODYPART_COST[MOVE] * 3 + BODYPART_COST[CARRY];
  let totalCost = 0;
  for (let targetRoom of targetRooms) {
    const sources = Game.rooms[targetRoom].find(FIND_SOURCES);
    for (let source of sources) {
      const pathToSource = brain.getFullPathMemory(baseRoom, 'pathStart', targetRoom, source.id);
      totalCost += creepCost / (CREEP_LIFE_TIME - pathToSource.length);
    }
  }
  return totalCost;
};

brain.getReserversMaintainCostPerTick = (baseRoom, ...targetRooms) => {
  const creepCost = BODYPART_COST[CLAIM] + BODYPART_COST[MOVE];
  let totalCost = 0;
  for (let targetRoom of targetRooms) {
    const roads = brain.getRoadsForRoom(baseRoom, targetRoom);
    let pathTime = 0;
    for (let pos of brain.getFullPathMemory(baseRoom, 'pathStart', targetRoom, Game.rooms[targetRoom].controller.id)) {
      if (!roads.hasOwnProperty(pos) && pos.lookFor(LOOK_TERRAIN)[0] === 'swamp') {
        pathTime += 5;
      } else {
        pathTime += 1;
      }
    }
    totalCost += creepCost / (CREEP_CLAIM_LIFE_TIME - pathTime);
  }
  return totalCost;
};

brain.getCarryOptimalSize = (baseRoom, targetRoom, targetId) => {
  const roundtripLength = brain.getFullPathMemory(baseRoom, 'pathStart', targetRoom, targetId).length * 2;
  const throughput = roundtripLength * SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME;
  const optimalSize = Math.floor((throughput / CARRY_CAPACITY - 1) / 2);
  console.log('optimal carry size for', baseRoom, '-', targetRoom, targetId, 'is', optimalSize, 'capacity', Math.floor(throughput / CARRY_CAPACITY) * CARRY_CAPACITY);
  return optimalSize;
};

brain.getCarryCost = size => BODYPART_COST[WORK] + BODYPART_COST[MOVE] * (size + 1) + BODYPART_COST[CARRY] * (size * 2 + 1);

brain.getCarriesMaintainCostPerTick = (baseRoom, ...targetRooms) => {
  let totalCost = 0;
  for (let targetRoom of targetRooms) {
    const sources = Game.rooms[targetRoom].find(FIND_SOURCES);
    for (let source of sources) {
      const optimalSize = brain.getCarryOptimalSize(baseRoom, targetRoom, source.id);
      let needCount = 1;
      while (brain.getCarryCost(Math.floor(optimalSize / needCount)) > Game.rooms[baseRoom].energyCapacityAvailable) {
        ++needCount;
      }
      const creepCost = brain.getCarryCost(Math.floor(optimalSize / needCount));
      console.log('we need', needCount, 'carries, each costs', creepCost);
      totalCost += creepCost / CREEP_LIFE_TIME;
    }
  }
  return totalCost;
};

brain.getTotalSourcersIncomePerTick = (baseRoom, ...targetRooms) => {
  let totalIncome = 0;
  for (let targetRoom of targetRooms) {
    const sources = Game.rooms[targetRoom].find(FIND_SOURCES);
    for (let source of sources) {
      totalIncome += SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME;
    }
  }
  return totalIncome;
};

brain.printTotalExternalMaintainCosts = (baseRoom, ...targetRooms) => {
  const roads = brain.getRoadsMaintainCostPerTick(baseRoom, ...targetRooms);
  const soucers = brain.getSourcersMaintainCostPerTick(baseRoom, ...targetRooms);
  const reservers = brain.getReserversMaintainCostPerTick(baseRoom, ...targetRooms);
  const carries = brain.getCarriesMaintainCostPerTick(baseRoom, ...targetRooms);
  const Income = brain.getTotalSourcersIncomePerTick(baseRoom, ...targetRooms);
  console.log('roads per decay =', roads * ROAD_DECAY_TIME, 'per tick =', roads);
  console.log('soucers per life =', soucers * CREEP_LIFE_TIME, 'per tick =', soucers);
  console.log('reservers per life =', reservers * CREEP_CLAIM_LIFE_TIME, 'per tick =', reservers);
  console.log('carries per life =', carries * CREEP_LIFE_TIME, 'per tick =', carries);
  console.log('Income per regen =', Income * ENERGY_REGEN_TIME, 'per tick =', Income);
  const total = roads + soucers + reservers + carries;
  console.log('total costs per normal creep life =', total * CREEP_LIFE_TIME, 'per tick =', total);
  console.log('net profit per normal creep life =', (Income - total) * CREEP_LIFE_TIME, 'per tick =', Income - total);
};

brain.getTimeForBuildUpRoads = (baseRoom, targetRoom, ...readyRooms) => {
  const readyRoads = {};
  for (let road of brain.getFullPathMemory(baseRoom, 'pathStart', baseRoom, 'harvester')) {
    readyRoads[road] = road;
  }
  for (let readyRoom of readyRooms) {
    brain.getRoadsForRoom(baseRoom, readyRoom, readyRoads);
  }

  const roads = brain.getRoadsForRoom(baseRoom, targetRoom);
  let totalBuildCost = 0;
  for (let pos of _.values(roads)) {
    if (!readyRoads.hasOwnProperty(pos)) {
      totalBuildCost += CONSTRUCTION_COST[STRUCTURE_ROAD] * (pos.lookFor(LOOK_TERRAIN)[0] === 'swamp' ? CONSTRUCTION_COST_ROAD_SWAMP_RATIO : 1);
    }
  }
  // TODO estimate roads that builded by several carries
  const buildTime = totalBuildCost / BUILD_POWER;
  // TODO correctly estimate time for moving between construction sites
  const moveTimeRatio = 2;
  return buildTime * moveTimeRatio;
};

brain.printCostOfCreepsWhileBuildingUpRoads = (baseRoom, targetRoom, ...readyRooms) => {
  // Withou roads sourcer and reserver needs more time to move by path, so we need to build it more often. Some average ratio for this
  const costRatio = 1.1;
  const buildTime = brain.getTimeForBuildUpRoads(baseRoom, targetRoom, ...readyRooms);
  const soucers = brain.getSourcersMaintainCostPerTick(baseRoom, targetRoom);
  const reservers = brain.getReserversMaintainCostPerTick(baseRoom, targetRoom) * costRatio;
  const carries = brain.getCarriesMaintainCostPerTick(baseRoom, targetRoom) * costRatio;
  console.log('time to build up', buildTime);
  console.log('soucers', soucers * buildTime, 'per tick =', soucers);
  console.log('reservers', reservers * buildTime, 'per tick =', reservers);
  console.log('carries', carries * buildTime, 'per tick =', carries);
  // TODO estimate the income while building up roads, depending on path length, swamp ratio and carry capacity
  const total = soucers + reservers + carries;
  console.log('total', total * buildTime, 'per tick =', total);
};

// console.log(Array.from(brain.getFullPath('E44S99', 'pathStart', 'E44S99', '58dbc91934e898064bcc2cb4')).length);
// console.log(Array.from(brain.getFullPath('E44S99', 'pathStart', 'E44S98', '58dbc4c68283ff5308a3f86b')).length);
// console.log(brain.getRoadsForRoom('E44S99', 'E44S98').length);
// console.log(brain.getRoadsMaintainCostPerTick('E44S99', 'E44S98') * ROAD_DECAY_TIME);
// console.log(brain.getSourcersMaintainCostPerTick('E44S99', 'E44S98') * CREEP_LIFE_TIME);
// console.log(brain.getReserversMaintainCostPerTick('E44S99', 'E44S98') * CREEP_CLAIM_LIFE_TIME);
// brain.printTotalExternalMaintainCosts('E44S99', 'E44S98');
