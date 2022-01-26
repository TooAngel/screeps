'use strict';

const {getMyRoomWithinRange, findMyRoomsSortByDistance} = require('./helper_findMyRooms');

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

Room.prototype.checkForQuest = function() {
  if (Game.time - this.getData().lastSeen < config.quests.checkInterval) {
    return;
  }
  const sign = this.controller.sign;
  if (!sign) {
    return;
  }

  if (sign.username === Memory.username) {
    return;
  }

  let data;
  try {
    data = JSON.parse(sign.text);
  } catch (e) {
    if (sign.text.startsWith('{')) {
      this.log(`checkForQuest JSON.parse text: "${sign.text}" exception: ${e}`);
    }
    return;
  }
  if (!data.type) {
    this.log(`checkForQuest no type: ${JSON.stringify(data)}`);
    return;
  }
  if (data.type !== 'Quest') {
    this.log(`checkForQuest type not quest: ${JSON.stringify(data)}`);
    return;
  }
  if (Game.time > data.end) {
    this.log(`checkForQuest already ended: ${JSON.stringify(data)}`);
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
      type: 'Quest',
      id: data.id,
      room: this.name,
    };
    this.log(`checkForQuest apply for quest ${JSON.stringify(response)}`);
    const terminalResponse = room.terminal.send(RESOURCE_ENERGY, 100, data.origin, JSON.stringify(response));
    if (terminalResponse === OK) {
      this.log(`checkForQuest apply for quest terminalResponse: ${JSON.stringify(terminalResponse)}`);
      break;
    } else {
      this.debugLog('quests', `terminal.send response code: ${terminalResponse}`);
    }
  }
};

Room.prototype.handleHostileReservedRoom = function() {
  const data = this.getData();
  data.state = 'HostileReserved';
  if (!data.lastBreakReservationAttempt) {
    data.lastBreakReservationAttempt = Game.time - config.autoattack.noReservedRoomInterval;
  }

  if (Game.time - data.lastBreakReservationAttempt < config.autoattack.noReservedRoomInterval) {
    return;
  }

  const nearMyRoomName = getMyRoomWithinRange(this.name, config.autoattack.noReservedRoomInRange, config.autoattack.noReservedRoomMinMyRCL);
  if (!nearMyRoomName) {
    return;
  }

  this.debugLog('attack', `room.handleHostileReservedRoom sending creeps from ${nearMyRoomName}`);
  data.lastBreakReservationAttempt = Game.time;
  const nearMyRoom = Game.rooms[nearMyRoomName];
  nearMyRoom.checkRoleToSpawn('attackunreserve', 1, undefined, this.name);
};

Room.prototype.checkIfRoomIsBlocked = function() {
  const data = this.getData();
  if (!data.blockedCheck || Game.time - data.blockedCheck > 100000) {
    data.blockedCheck = Game.time;
    const blocked = this.checkBlocked();
    if (blocked) {
      data.state = 'Blocked';
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
  if (Memory.powerBanks[room.name].target && Memory.powerBanks[room.name] !== null) {
    if (Memory.powerBanks[room.name].transporter_called) {
      return;
    }
    if (powerBank.hits < 350000) {
      const amountPowerTransporter = Math.ceil(powerBank.power / 1000);
      for (let i = 0; i < amountPowerTransporter; i++) {
        Game.rooms[Memory.powerBanks[room.name].target].memory.queue.push({
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
}

Room.prototype.externalHandleHighwayRoom = function() {
  if (config.power.disabled) {
    return false;
  }

  Memory.powerBanks = Memory.powerBanks || {};

  const structures = this.findPowerBanks();
  if (structures.length === 0) {
    delete Memory.powerBanks[this.name];
    return false;
  }

  if (Memory.powerBanks[this.name]) {
    spawnPowerTransporters(this, structures[0]);
    return;
  }

  if (structures[0].ticksToDecay < 3000) {
    Memory.powerBanks[this.name] = {
      target: null,
    };
    return true;
  } else {
    let minRoute = 6;
    let target = null;
    for (const roomId of Object.keys(Memory.myRooms)) {
      const room = Game.rooms[Memory.myRooms[roomId]];
      if (!room || !room.storage || room.storage.store.energy < config.power.energyForCreeps) {
        continue;
      }
      const routeToTest = Game.map.findRoute(this.name, room.name);
      if (routeToTest.length < minRoute) {
        minRoute = routeToTest.length;
        target = room;
      }
    }
    if (target !== null) {
      Memory.powerBanks[this.name] = {
        target: target.name,
        min_route: minRoute,
      };
      this.log('--------------> Start power harvesting in: ' + this.name + ' from ' + target.name + ' <----------------');
      Game.notify('Start power harvesting in: ' + this.name + ' from ' + target.name);
      Game.rooms[target.name].memory.queue.push({
        role: 'powerattacker',
        routing: {
          targetRoom: this.name,
        },
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerhealer',
        routing: {
          targetRoom: this.name,
        },
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerhealer',
        routing: {
          targetRoom: this.name,
        },
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerattacker',
        routing: {
          targetRoom: this.name,
        },
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerhealer',
        routing: {
          targetRoom: this.name,
        },
      });
    } else {
      Memory.powerBanks[this.name] = {
        target: null,
      };
    }
  }
};

Room.prototype.handleOccupiedRoom = function() {
  this.getData().state = 'Occupied';
  this.memory.player = this.controller.owner.username;

  if (this.controller.safeMode) {
    return;
  }

  const spawns = this.findPropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (spawns.length > 0) {
    this.attackRoom();
  }
};

Room.prototype.checkBlockedPath = function() {
  for (const pathName of Object.keys(this.getMemoryPaths())) {
    const path = this.getMemoryPath(pathName) || {};
    for (const pos of path) {
      const roomPos = new RoomPosition(pos.x, pos.y, this.name);
      const structures = roomPos.lookFor('structure');

      for (const structure of structures) {
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
        this.log(`Path ${pathName} blocked on ${pos} due to ${structure.structureType}`);
        return true;
      }
    }
  }
};

Room.prototype.checkAndSpawnReserver = function() {
  const data = this.getData();
  const reservation = data.reservation;
  if (reservation === undefined) {
    // TODO Check the closest room and set reservation
    this.log('No reservation');
    return false;
  }

  const baseRoom = Game.rooms[reservation.base];
  if (baseRoom === undefined) {
    delete data.reservation;
    return false;
  }

  if (this.checkBlockedPath()) {
    if (this.executeEveryTicks(config.creep.structurerInterval)) {
      this.log('Call structurer from ' + baseRoom.name);
      baseRoom.checkRoleToSpawn('structurer', 1, undefined, this.name);
      return;
    }
  }

  this.debugLog('reserver', 'Spawning creeps');
  // TODO this should be handled in the reserver role
  if (baseRoom.getEnergyCapacityAvailable() >= 2 * (BODYPART_COST.claim + BODYPART_COST.move)) {
    this.debugLog('reserver', 'Spawning reserver');
    baseRoom.checkRoleToSpawn('reserver', 1, this.controller.id, this.name, 2);
  } else if (baseRoom.getEnergyCapacityAvailable() >= BODYPART_COST.claim + BODYPART_COST.move) {
    this.debugLog('reserver', 'Spawning reserver');
    baseRoom.checkRoleToSpawn('reserver', 1, this.controller.id, this.name, 1);
  }
};

const checkSourcerMatch = function(sourcers, sourceId) {
  for (let i = 0; i < sourcers.length; i++) {
    const sourcer = Game.creeps[sourcers[i].name];
    if (sourcer.memory.routing.targetId === sourceId) {
      return true;
    }
  }
  return false;
};

Room.prototype.checkSourcer = function() {
  const sources = this.findSources();
  const sourcers = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['sourcer']);

  if (sourcers.length < sources.length) {
    const sourceParse = (source) => {
      if (!checkSourcerMatch(sourcers, source.pos)) {
        const data = this.getData();
        if (data && data.reservation) {
          Game.rooms[this.getData().reservation.base].checkRoleToSpawn('sourcer', 1, source.id, source.pos.roomName);
        }
      }
    };
    _.each(sources, (sourceParse));
  }
};

Room.prototype.isRoomRecentlyChecked = function() {
  const data = this.getData();
  if (data.lastChecked !== undefined &&
    Game.time - data.lastChecked < 500) {
    return true;
  }
  data.lastChecked = Game.time;
  return false;
};

Room.prototype.handleReservedRoom = function() {
  this.getData().state = 'Reserved';
  if (this.isRoomRecentlyChecked()) {
    return false;
  }

  const idiotCreeps = this.findHostileAttackingCreeps();
  for (const idiotCreep of idiotCreeps) {
    brain.increaseIdiot(idiotCreep.owner.username);
  }

  const reservers = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['reserver']);
  if (reservers.length === 0) {
    this.checkAndSpawnReserver();
  }

  this.checkSourcer();
  return false;
};

/**
 * isRouteValidForReservedRoom - Checks if the rooms on the route to the rooms
 * are valid (visible, have a constroller and the state is reserved)
 *
 * @param {object} room - The room to check to
 * @param {list} route - A list of route entries
 * @return {bool} - If the route is valid
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
    if (!routeRoom.isMy() && routeRoom.getData().state !== 'Reserved') {
      return false;
    }
  }
  return true;
}

/**
 * filterReservedBy - Filter for reserved rooms for a specific room
 *
 * @param {string} roomName - The room name to check the reservation base
 * @return {bool} - If it is reservered by the given roomName
 **/
function filterReservedBy(roomName) {
  return (roomData) => {
    return roomData.state === 'Reserved' && (roomData.reservation || {}).base === roomName;
  };
}

Room.prototype.handleUnreservedRoom = function() {
  const data = this.getData();
  data.state = 'Unreserved';
  if (this.isRoomRecentlyChecked()) {
    return false;
  }
  this.debugLog('reserver', 'handleUnreservedRoom');

  if (data.reservation) {
    this.debugLog('reserver', 'handleUnreservedRoom reserved room');
    const reservation = data.reservation;
    if (this.name === reservation.base) {
      this.log('Want to spawn reserver for the base room, why?');
      delete data.reservation;
      return false;
    }
    this.getData().state = 'Reserved';
    this.checkAndSpawnReserver();
    this.checkSourcer();
    return true;
  }

  for (const roomName of findMyRoomsSortByDistance(this.name)) {
    const room = Game.rooms[roomName];
    if (!room) {
      continue;
    }
    const distance = Game.map.getRoomLinearDistance(this.name, room.name);
    this.debugLog('reserver', `unreserved check linear Distance: ${distance} <= ${config.external.distance} ${this.name} ${room.name}`);
    if (distance > config.external.distance) {
      continue;
    }
    const route = Game.map.findRoute(this.name, room.name);
    const routeDistance = route.length;
    this.debugLog('reserver', `unreserved check route Distance: ${routeDistance} <= ${config.external.distance} ${this.name} ${room.name}`);
    if (routeDistance > config.external.distance) {
      continue;
    }

    if (!isRouteValidForReservedRoom(this, route)) {
      this.debugLog('reserver', 'route not valid');
      continue;
    }

    const reservedRooms = _.filter(global.data.rooms, filterReservedBy(roomName));
    // RCL: target reserved rooms
    const numRooms = config.room.reservedRCL;
    this.debugLog('reserver', `number checked: ${reservedRooms.length} ${numRooms[room.controller.level]}`);
    if (reservedRooms.length >= numRooms[room.controller.level]) {
      continue;
    }

    data.reservation = {
      base: room.name,
    };
    data.state = 'Reserved';
    this.debugLog('reserver', 'unreserved Room reserved');
    return true;
  }

  return true;
};

Room.prototype.handleSourceKeeperRoom = function() {
  const data = this.getData();
  data.sourceKeeperRoom = true;
  data.state = 'SourceKeeper';
  if (config.keepers.enabled) {
    return false;
  }

  if (!this.memory.base) {
    this.updateClosestSpawn();
  }

  this.spawnKeepersEveryTicks(50);
  return false;
};
