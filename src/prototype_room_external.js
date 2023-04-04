'use strict';

const {getMyRoomWithinRange, findMyRoomsSortByDistance} = require('./helper_findMyRooms');
const {addToReputation, initPlayer, addRoomToPlayer} = require('./diplomacy');
const {haveActiveQuest} = require('./quests_player');

Room.prototype.checkBlocked = function() {
  const exits = Game.map.describeExits(this.name);
  const callerRoom = this;
  const roomCallback = (roomName) => {
    const room = Game.rooms[roomName] || callerRoom;
    const costMatrix = new PathFinder.CostMatrix();
    const structures = room.findStructures();
    room.setCostMatrixStructures(costMatrix, structures, 255);
    return costMatrix;
  };
  for (const fromDirection of Object.keys(exits)) {
    const fromExitDirection = this.findExitTo(exits[fromDirection]);
    const fromExitPoss = this.find(fromExitDirection);
    const fromNextExit = fromExitPoss[Math.floor(fromExitPoss.length / 2)];
    for (const toDirection in exits) {
      if (fromDirection === toDirection) {
        continue;
      }

      const toExitDirection = this.findExitTo(exits[toDirection]);
      const toExitPoss = this.find(toExitDirection);
      const toNextExit = toExitPoss[Math.floor(toExitPoss.length / 2)];

      const search = PathFinder.search(fromNextExit, toNextExit, {
        maxRooms: 0,
        roomCallback: roomCallback,
      });
      if (search.incomplete) {
        const indestructableWall = this.lookForAt(LOOK_STRUCTURES, toNextExit[0]);
        if (indestructableWall.length && indestructableWall.find((object) => object.structureType === STRUCTURE_WALL && !object.hitsMax)) {
          return false;
        }
        return true;
      }
    }
  }
  return false;
};

Room.prototype.isHighwayRoom = function() {
  if (this.controller) {
    return false;
  }
  const nameSplit = this.splitRoomName();
  if (nameSplit[2] % 10 === 0 || nameSplit[4] % 10 === 0) {
    return true;
  }
  return false;
};

Room.prototype.isCenterRoom = function() {
  if (this.controller) {
    return false;
  }
  const nameSplit = this.splitRoomName();
  if (nameSplit[2].endsWith('5') && nameSplit[4].endsWith('5')) {
    return true;
  }
  return false;
};

/**
 * isQuestValid
 *
 * @param {object} room
 * @return {boolean}
 */
function isQuestValid(room) {
  if (Game.time - room.data.lastSeen < config.quests.checkInterval) {
    return;
  }
  if (haveActiveQuest()) {
    return;
  }
  const sign = room.controller.sign;
  if (!sign) {
    return;
  }

  if (sign.username === Memory.username) {
    return;
  }
  return true;
}

/**
 * getQuestData
 * @param {object} room
 * @return {object}
 */
function getQuestData(room) {
  const sign = room.controller.sign;
  let data;
  try {
    data = JSON.parse(sign.text);
  } catch (e) {
    if (sign.text.startsWith('{')) {
      room.log(`checkForQuest JSON.parse text: "${sign.text}" exception: ${e}`);
    }
    return;
  }
  if (!data.type) {
    room.log(`checkForQuest no type: ${JSON.stringify(data)}`);
    return;
  }
  if (data.type !== 'quest') {
    room.log(`checkForQuest type not quest: ${JSON.stringify(data)}`);
    return;
  }
  if (Game.time > data.end) {
    room.log(`checkForQuest already ended: ${JSON.stringify(data)}`);
    return;
  }
  return data;
}

Room.prototype.checkForQuest = function() {
  if (!isQuestValid(this)) {
    return;
  }
  const data = getQuestData(this);
  if (!data) {
    return;
  }

  this.log(`checkForQuest quest found: ${JSON.stringify(data)}`);
  for (const roomName of findMyRoomsSortByDistance(data.origin)) {
    this.log(`checkForQuest iterate over rooms: ${roomName}`);
    const room = Game.rooms[roomName];
    if (!room.terminal) {
      this.log(`checkForQuest no terminal`);
      continue;
    }
    const response = {
      type: 'quest',
      id: data.id,
      action: 'apply',
    };
    this.log(`checkForQuest apply for quest from ${room.name} to ${data.origin} ${JSON.stringify(response)}`);
    const terminalResponse = room.terminal.send(RESOURCE_ENERGY, 100, data.origin, JSON.stringify(response));
    if (terminalResponse === OK) {
      global.data.activeQuest = {
        state: 'applied',
        tick: Game.time,
        quest: data,
      };
      this.log(`checkForQuest apply for quest terminalResponse: ${JSON.stringify(terminalResponse)}`);
      break;
    } else {
      this.debugLog('quests', `terminal.send response code: ${terminalResponse}`);
    }
  }
};

Room.prototype.handleHostileReservedRoom = function() {
  this.data.state = 'HostileReserved';
  if (!this.data.lastBreakReservationAttempt) {
    this.data.lastBreakReservationAttempt = Game.time;
    return false;
  }

  if (Game.time - this.data.lastBreakReservationAttempt < config.autoAttack.noReservedRoomInterval) {
    return false;
  }
  this.debugLog('attack', `room.handleHostileReservedRoom`);
  const nearMyRoomName = getMyRoomWithinRange(this.name, config.autoAttack.noReservedRoomInRange, config.autoAttack.noReservedRoomMinMyRCL);
  if (!nearMyRoomName) {
    this.data.lastBreakReservationAttempt = Game.time;
    return false;
  }

  this.debugLog('attack', `room.handleHostileReservedRoom sending attack creeps from ${nearMyRoomName}`);
  this.data.lastBreakReservationAttempt = Game.time;
  const nearMyRoom = Game.rooms[nearMyRoomName];
  nearMyRoom.checkRoleToSpawn('attackunreserve', 1, undefined, this.name);
};

Room.prototype.checkIfRoomIsBlocked = function() {
  if (!this.data.blockedCheck || Game.time - this.data.blockedCheck > 100000) {
    this.data.blockedCheck = Game.time;
    const blocked = this.checkBlocked();
    if (blocked) {
      this.data.state = 'Blocked';
    }
  }
};

Room.prototype.handleNoControllerRooms = function() {
  if (this.isHighwayRoom()) {
    return this.externalHandleHighwayRoom();
  }

  const sourceKeepers = this.findSourceKeepersStructures();
  if (sourceKeepers.length > 0) {
    return this.handleSourceKeeperRoom();
  }
  if (this.isCenterRoom()) {
    // this.log(`${this.name} is center room`);
    return;
  }
  this.log('Can not handle this room, no controller, no highway, no source keeper');
  delete Memory.rooms[this.roomName];
  return false;
};

Room.prototype.externalHandleRoom = function() {
  if (!this.controller) {
    return this.handleNoControllerRooms();
  }

  this.checkForQuest();
  this.checkIfRoomIsBlocked();

  if (this.controller.owner) {
    return this.handleOccupiedRoom();
  }

  if (this.controller.reservation) {
    if (this.controller.reservation.username === Memory.username) {
      return this.handleReservedRoom();
    }
    return this.handleHostileReservedRoom();
  }

  return this.handleUnreservedRoom();
};

/**
 * spawnPowerTransporters
 *
 * @param {object} room
 * @param {object} powerBank
 */
function spawnPowerTransporters(room, powerBank) {
  if (Memory.powerBanks[room.name].transporter_called) {
    return;
  }
  if (powerBank.hits < 350000) {
    const amountPowerTransporter = Math.ceil(powerBank.power / 1000);
    for (let i = 0; i < amountPowerTransporter; i++) {
      Memory.rooms[Memory.powerBanks[room.name].target].queue.push({
        role: 'powertransporter',
        routing: {
          targetRoom: room.name,
        },
      });
    }
    room.log('Adding ' + amountPowerTransporter + ' powertransporter at ' + Memory.powerBanks[room.name].target);
    Memory.powerBanks[room.name].transporter_called = true;
  }
}

Room.prototype.externalHandleHighwayRoom = function() {
  this.harvestPower();
  this.harvestCommodities();
};

Room.prototype.harvestCommodities = function() {
  if (config.commodities.disabled) {
    return false;
  }
  if (!Memory.commodities) {
    Memory.commodities = {};
  }
  if (Memory.commodities[this.name]) {
    if (Memory.commodities[this.name].lastCheck + 1500 > Game.time) {
      return;
    }
    const sourcers = this.findMyCreepsOfRole('sourcers');
    if (sourcers.length > 0) {
      return;
    }
  }
  Memory.commodities[this.name] = {
    lastCheck: Game.time,
  };
  const deposits = this.find(FIND_DEPOSITS, {
    filter: (structure) => structure.lastCooldown < 100,
  });
  if (deposits.length === 0) {
    delete Memory.commodities[this.name];
    return;
  }
  this.debugLog('commodities', `Commodities found ${JSON.stringify(deposits)}`);
  const baseRoomName = getMyRoomWithinRange(this.name, 6, 6, 0.9);
  if (!baseRoomName) {
    this.debugLog('commodities', 'No room for commodity farming found');
    return;
  }
  Memory.commodities[this.name].base = baseRoomName;
  this.debugLog('commodities', `Send creeps from ${baseRoomName} to harvest commodities`);
  Memory.rooms[baseRoomName].queue.push({
    role: 'sourcer',
    routing: {
      targetRoom: this.name,
      targetId: deposits[0].id,
      type: 'commodity',
    },
  });
  Memory.rooms[baseRoomName].queue.push({
    role: 'carry',
    routing: {
      targetRoom: this.name,
      targetId: deposits[0].id,
    },
  });
  Memory.rooms[baseRoomName].queue.push({
    role: 'carry',
    routing: {
      targetRoom: this.name,
      targetId: deposits[0].id,
    },
  });
};

/**
 * wasPowerBankRecentlyChecked
 *
 * @param {object} memoryPowerBank
 * @return {boolean}
 */
function wasPowerBankRecentlyChecked(memoryPowerBank) {
  if (memoryPowerBank) {
    if (memoryPowerBank.lastChecked + 1500 > Game.time) {
      return true;
    }
  }
}

/**
 * spawnPowerCreeps
 *
 * @param {object} room
 * @param {string} baseRoomName
 */
function spawnPowerCreeps(room, baseRoomName) {
  room.log('--------------> Start power harvesting in: ' + room.name + ' from ' + baseRoomName + ' <----------------');
  Game.notify('Start power harvesting in: ' + room.name + ' from ' + baseRoomName);
  Memory.rooms[baseRoomName].queue.push({
    role: 'powerattacker',
    routing: {
      targetRoom: room.name,
    },
  });
  Memory.rooms[baseRoomName].queue.push({
    role: 'powerhealer',
    routing: {
      targetRoom: room.name,
    },
  });
  Memory.rooms[baseRoomName].queue.push({
    role: 'powerhealer',
    routing: {
      targetRoom: room.name,
    },
  });
  Memory.rooms[baseRoomName].queue.push({
    role: 'powerattacker',
    routing: {
      targetRoom: room.name,
    },
  });
  Memory.rooms[baseRoomName].queue.push({
    role: 'powerhealer',
    routing: {
      targetRoom: room.name,
    },
  });
}

Room.prototype.harvestPower = function() {
  if (config.power.disabled) {
    return false;
  }

  let memoryPowerBank = Memory.powerBanks[this.name];
  if (wasPowerBankRecentlyChecked(memoryPowerBank)) {
    return false;
  }

  const structures = this.findPowerBanks();
  if (structures.length === 0) {
    delete Memory.powerBanks[this.name];
    return false;
  }

  this.debugLog('power', `Found PowerBank ticksToDecay: ${structures[0].ticksToDecay}`);

  if (!memoryPowerBank) {
    Memory.powerBanks[this.name] = {};
    memoryPowerBank = Memory.powerBanks[this.name];
  }
  memoryPowerBank.lastChecked = Game.time;
  if (memoryPowerBank.target) {
    spawnPowerTransporters(this, structures[0]);
    return;
  }

  if (structures[0].ticksToDecay < 3000) {
    return true;
  }

  const baseRoomName = getMyRoomWithinRange(this.name, 6, 6, 0.8);
  if (!baseRoomName) {
    this.debugLog('power', 'No room found for power farming');
    return;
  }

  memoryPowerBank.target = baseRoomName;

  spawnPowerCreeps();
};

Room.prototype.handleOccupiedRoom = function() {
  this.data.state = 'Occupied';
  this.data.player = this.controller.owner.username;
  this.data.controller = {
    level: this.controller.level,
  };
  const player = initPlayer(this.data.player);
  addRoomToPlayer(player, this);

  this.data.safeMode = this.controller.safeMode;
  this.data.spawns = this.findHostileSpawn();
};

Room.prototype.checkBlockedPath = function() {
  for (const pathName of Object.keys(this.getMemoryPaths())) {
    const path = this.getMemoryPath(pathName) || {};
    for (const pos of path) {
      const roomPos = new RoomPosition(pos.x, pos.y, this.name);
      const structures = roomPos.lookFor('structure');

      for (const structure of structures) {
        if (!structure.hitsMax) {
          continue;
        }
        if (structure.structureType === STRUCTURE_ROAD) {
          continue;
        }
        if (structure.structureType === STRUCTURE_RAMPART) {
          continue;
        }
        if (structure.structureType === STRUCTURE_CONTAINER) {
          continue;
        }
        if (structure.structureType === STRUCTURE_INVADER_CORE) {
          continue;
        }
        if (structure.structureType === STRUCTURE_TOWER && structure.my) {
          continue;
        }
        this.log(`Path ${pathName} blocked on ${pos} due to ${structure.structureType}`);
        return true;
      }
    }
  }
};

Room.prototype.checkAndSpawnReserver = function() {
  if (!this.data.reservation) {
    // TODO Check the closest room and set reservation
    this.log('No reservation');
    console.log(new Error().stack);
    return false;
  }

  const baseRoom = Game.rooms[this.data.reservation.base];
  if (baseRoom === undefined) {
    delete this.data.reservation;
    return false;
  }

  if (this.checkBlockedPath()) {
    if (this.executeEveryTicks(config.creep.structurerInterval)) {
      this.log('Call structurer from ' + baseRoom.name);
      baseRoom.checkRoleToSpawn('structurer', 1, undefined, this.name);
      return;
    }
  }

  this.debugLog('reserver', `Spawning creeps from ${baseRoom.name}`);
  // TODO this should be handled in the reserver role
  if (baseRoom.getEnergyCapacityAvailable() >= 2 * (BODYPART_COST.claim + BODYPART_COST.move)) {
    this.debugLog('reserver', `Spawning reserver from ${baseRoom.name}`);
    baseRoom.checkRoleToSpawn('reserver', 1, this.controller.id, this.name, 2);
  } else if (baseRoom.getEnergyCapacityAvailable() >= BODYPART_COST.claim + BODYPART_COST.move) {
    this.debugLog('reserver', `Spawning reserver from ${baseRoom.name}`);
    baseRoom.checkRoleToSpawn('reserver', 1, this.controller.id, this.name, 1);
  }
};

const checkSourcerMatch = function(sourcers, sourceId) {
  for (const sourcer of sourcers) {
    if (sourcer.memory.routing.targetId === sourceId) {
      return true;
    }
  }
  return false;
};

Room.prototype.checkSourcer = function() {
  const sources = this.findSources();
  const sourcers = this.findSourcer();

  for (const source of sources) {
    if (!checkSourcerMatch(sourcers, source.id)) {
      if (this.data.reservation) {
        Game.rooms[this.data.reservation.base].checkRoleToSpawn('sourcer', 1, source.id, source.pos.roomName);
      }
    }
  }
};

Room.prototype.isRoomRecentlyChecked = function() {
  if (!this.data.lastChecked) {
    this.data.lastChecked = Game.time;
    return true;
  }
  if (Game.time - this.data.lastChecked < 500) {
    return true;
  }
  this.data.lastChecked = Game.time;
  return false;
};

Room.prototype.handleReservedRoom = function() {
  this.data.state = 'Reserved';
  if (this.isRoomRecentlyChecked()) {
    return false;
  }

  const hostileCreeps = this.findHostileAttackingCreeps();
  for (const hostileCreep of hostileCreeps) {
    addToReputation(hostileCreep.owner.username, -1);
  }

  const reserver = this.findReserver();
  if (reserver.length === 0) {
    if (this.data.reservation) {
      this.checkAndSpawnReserver();
    }
  }

  this.checkSourcer();
  return false;
};

/**
 * isRouteValidForReservedRoom - Checks if the rooms on the route to the rooms
 * are valid (visible, have a controller and the state is reserved)
 *
 * @param {object} room - The room to check to
 * @param {list} route - A list of route entries
 * @return {boolean} - If the route is valid
 **/
function isRouteValidForReservedRoom(room, route) {
  // Only allow pathing through owned rooms or already reserved rooms.
  for (const routeEntry of route) {
    const routeRoomName = routeEntry.room;
    if (!Game.rooms[routeRoomName]) {
      room.debugLog('reserver', `unreserved - route check room undefined ${routeRoomName}`);
      return false;
    }
    const routeRoom = Game.rooms[routeRoomName];
    if (!routeRoom.controller) {
      room.debugLog('reserver', `unreserved - route check room controller undefined ${routeRoomName}`);
      return false;
    }
    if (!routeRoom.isMy() && routeRoom.data.state !== 'Reserved') {
      room.debugLog('reserver', `Not reserverd ${routeRoom.name} ${JSON.stringify(routeRoom.data.state)} ${JSON.stringify(routeRoom.data.reservation)}`);
      return false;
    }
  }
  return true;
}

/**
 * filterReservedBy - Filter for reserved rooms for a specific room
 *
 * @param {string} roomName - The room name to check the reservation base
 * @return {function} - If it is reserved by the given roomName
 **/
function filterReservedBy(roomName) {
  return (reservedRoomName) => {
    const roomData = global.data.rooms[reservedRoomName];
    return roomData.state === 'Reserved' && (roomData.reservation || {}).base === roomName;
  };
}

Room.prototype.handleUnreservedRoomWithReservation = function() {
  this.debugLog('reserver', 'handleUnreservedRoom reserved room');
  const reservation = this.data.reservation;
  if (this.name === reservation.base) {
    this.log('Want to spawn reserver for the base room, why?');
    delete this.data.reservation;
    return false;
  }

  // Give up reservation on spawnIdle
  const room = Game.rooms[reservation.base];
  if (room.memory.spawnIdle < config.room.reserveSpawnIdleThreshold) {
    this.debugLog('reserver', `Discarding reservation in ${this.name} - base spawnIdle threshold not met ${room.memory.spawnIdle} (${room.name}) < ${config.room.reserveSpawnIdleThreshold}`);
    delete this.data.reservation;
    return false;
  }

  // Give up reservation on unHealthyBase
  if (!room.isHealthy()) {
    this.debugLog('reserver', `Discarding reservation in ${this.name} - base (${room.name}) is unhealthy`);
    delete this.data.reservation;
    return false;
  }

  this.debugLog('reserver', `handleUnreservedRoom reserved room - send creeps from ${room.name} spawnIdle ${room.memory.spawnIdle} < ${config.room.reserveSpawnIdleThreshold}`);

  this.data.state = 'Reserved';
  this.checkAndSpawnReserver();
  this.checkSourcer();
  return true;
};

/**
 * getReserveRoomDistanceThreshold
 *
 * @param {object} toReserve
 * @param {object} myRoom
 * @return {number}
 */
function getReserveRoomDistanceThreshold(toReserve, myRoom) {
  const distance = Game.map.getRoomLinearDistance(toReserve.name, myRoom.name);
  /**
   * Base reservability on number of spawns, distance and number of sources
   *
   * sources: 1, distance: 1, spawns: 1 = 1 fine
   * sources: 1, distance: 2, spawns: 1 = 0.5 not fine
   * sources: 2, distance: 2, spawns: 1 = 1 fine
   * sources: 1, distance: 2, spawns: 2 = 1 fine
   *
   */
  const spawns = myRoom.find(FIND_MY_SPAWNS).length;
  const threshold = toReserve.data.sources / distance * spawns;
  // toReserve.debugLog('reserver', `unreserved check linear Distance: ${threshold} <= ${toReserve.data.sources} ${distance} ${spawns} ${toReserve.name} ${myRoom.name}`);
  return threshold;
}

/**
 * getReserveRouteDistanceThreshold
 *
 * @param {object} toReserve
 * @param {object} myRoom
 * @return {number}
 */
function getReserveRouteDistanceThreshold(toReserve, myRoom) {
  const spawns = myRoom.find(FIND_MY_SPAWNS).length;
  const route = Game.map.findRoute(toReserve.name, myRoom.name);

  if (!isRouteValidForReservedRoom(toReserve, route)) {
    toReserve.debugLog('reserver', `route not valid ${toReserve.name} ${myRoom.name}`);
    return 0;
  }

  const routeDistance = route.length;
  const routeThreshold = toReserve.data.sources / routeDistance * spawns;
  // toReserve.debugLog('reserver', `unreserved check route Distance: ${routeThreshold} <= ${toReserve.data.sources} ${routeDistance} ${spawns} ${toReserve.name} ${myRoom.name}`);
  return routeThreshold;
}

/**
 * isReservedRoomValid
 *
 * @param {string} reservedRoomName
 * @return {boolean}
 */
function isReservedRoomValid(reservedRoomName) {
  const reservedRoom = Game.rooms[reservedRoomName];
  if (!reservedRoom) {
    return false;
  }
  if (!reservedRoom.controller.reservation) {
    reservedRoom.debugLog('reserver', `reservedRoom ${reservedRoom.name} has no active reservation, not reserving a new room`);
    return false;
  }
  if (reservedRoom.controller.reservation.ticksToEnd < 2000) {
    reservedRoom.debugLog('reserver', `reservedRoom ${reservedRoom.name} reservation not long enough ${reservedRoom.controller.reservation.ticksToEnd} < 2000`);
    return false;
  }
  if (reservedRoom.controller.reservation.username !== Memory.username) {
    reservedRoom.debugLog('reserver', `reservedRoom ${reservedRoom.name} is reserved by ${reservedRoom.controller.reservation.username}, not reserving a new room`);
    return false;
  }
  return true;
}

/**
 * spawnCreepsForReservation
 *
 * @param {object} reservationCandidate
 * @return {boolean}
 */
function spawnCreepsForReservation(reservationCandidate) {
  for (const roomName of findMyRoomsSortByDistance(reservationCandidate.name)) {
    const room = Game.rooms[roomName];
    if (!room) {
      continue;
    }

    if (room.memory.spawnIdle < config.room.reserveSpawnIdleThreshold) {
      continue;
    }

    if (getReserveRoomDistanceThreshold(reservationCandidate, room) < 1) {
      continue;
    }

    if (getReserveRouteDistanceThreshold(reservationCandidate, room) < 1) {
      continue;
    }

    const reservedRoomNames = _.filter(Object.keys(global.data.rooms), filterReservedBy(roomName));
    // RCL: target reserved rooms

    for (const reservedRoomName of reservedRoomNames) {
      if (!isReservedRoomValid(reservedRoomName)) {
        return false;
      }
    }

    reservationCandidate.data.reservation = {
      base: room.name,
    };
    reservationCandidate.data.state = 'Reserved';
    reservationCandidate.checkAndSpawnReserver();
    reservationCandidate.checkSourcer();
    reservationCandidate.debugLog('reserver', `Reserving unreserved Room from ${room.name} spawnIdle: ${room.memory.spawnIdle}`);
    return true;
  }
  return false;
}

Room.prototype.handleUnreservedRoom = function() {
  if (this.isRoomRecentlyChecked()) {
    return false;
  }
  this.data.state = 'Unreserved';

  if (this.data.reservation) {
    return this.handleUnreservedRoomWithReservation();
  }

  spawnCreepsForReservation(this);

  return true;
};

Room.prototype.handleSourceKeeperRoom = function() {
  this.data.sourceKeeperRoom = true;
  this.data.state = 'SourceKeeper';
  if (config.keepers.enabled) {
    return false;
  }

  if (!this.data.base) {
    this.updateClosestSpawn();
  }

  this.spawnKeepersEveryTicks(50);
  return false;
};
