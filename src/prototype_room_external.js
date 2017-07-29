/*
 * This modules contains method for handling external rooms, so all rooms
 * where the controller is not controller by us.
 *
 * There are different types and states:
 * Types:
 *  - Highway
 *  - Source Keeper
 *  - Standard
 *
 * State:
 *  - Blocked: The path is blocked by walls
 *  - Reserved: The room is used for external harvesting
 *  - Occupied: Controlled by another player
 */

/*
 * Checks if the middle position of all exit directions can be reached from each
 */
Room.prototype.checkBlocked = function() {
  let exits = Game.map.describeExits(this.name);
  let callerRoom = this;
  let roomCallback = (roomName) => {
    let room = Game.rooms[roomName] || callerRoom;
    let costMatrix = new PathFinder.CostMatrix();
    let structures = room.find(FIND_STRUCTURES);
    room.setCostMatrixStructures(costMatrix, structures, 255);
    return costMatrix;
  };
  for (let fromDirection of Object.keys(exits)) {
    let fromExitDirection = this.findExitTo(exits[fromDirection]);
    let fromExitPoss = this.find(fromExitDirection);
    let fromNextExit = fromExitPoss[Math.floor(fromExitPoss.length / 2)];
    for (let toDirection in exits) {
      if (fromDirection === toDirection) {
        continue;
      }

      let toExitDirection = this.findExitTo(exits[toDirection]);
      let toExitPoss = this.find(toExitDirection);
      let toNextExit = toExitPoss[Math.floor(toExitPoss.length / 2)];

      let search = PathFinder.search(fromNextExit, toNextExit, {
        maxRooms: 0,
        roomCallback: roomCallback
      });
      if (search.incomplete) {
        return true;
      }
    }
  }
  return false;
};

/*
 * Checks if a room is blocked in a certain interval
 */
Room.prototype.handleBlockedRooms = function() {
  if (!this.memory.blockedCheck || Game.time - this.memory.blockedCheck > 100000) {
    this.memory.blockedCheck = Game.time;
    let blocked = this.checkBlocked();
    if (blocked) {
      this.memory.lastSeen = Game.time;
      this.memory.state = 'Blocked';
    }
  }
};

/*
 * Handle the different kind of rooms with a  controller
 */
Room.prototype.externalHandleRoomWithController = function() {
  if (this.controller.owner) {
    return this.handleOccupiedRoom();
  }

  if (this.controller.reservation && this.controller.reservation.username === Memory.username) {
    return this.handleReservedRoom();
  }

  this.handleBlockedRooms();

  if (!this.controller.reservation) {
    if (this.handleUnreservedRoom()) {
      return true;
    }
  }
};

/*
 * Handle rooms without a controller
 */
Room.prototype.externalHandleRoomWithoutController = function() {
  var nameSplit = this.splitRoomName();
  if (nameSplit[2] % 10 === 0 || nameSplit[4] % 10 === 0) {
    return this.externalHandleHighwayRoom();
  }

  const sourceKeepers = this.findPropertyFilter(FIND_HOSTILE_STRUCTURES, 'owner.username', ['Source Keeper']);
  if (sourceKeepers.length > 0) {
    this.memory.lastSeen = Game.time;
    return this.handleSourceKeeperRoom();
  }
};

/*
 * Handle all kind of external rooms
 */
Room.prototype.externalHandleRoom = function() {
  if (this.controller) {
    if (this.externalHandleRoomWithController()) {
      return true;
    }
  } else {
    if (this.externalHandleRoomWithoutController()) {
      return true;
    }
  }

  delete Memory.rooms[this.roomName];
  return false;
};

/*
 * Handle an highway room with powerBank, where the power bank is known
 * and the process is already started
 */

Room.prototype.externalHandleKnownPowerBank = function() {
  if (Memory.powerBanks[this.name]) {
    if (Memory.powerBanks[this.name].transporter_called) {
      return true;
    }
    if (structures[0].hits < 300000) {
      for (var i = 0; i < Math.ceil(structures[0].power / 1000); i++) {
        this.log('Adding powertransporter at ' + Memory.powerBanks[this.name].target);
        Game.rooms[Memory.powerBanks[this.name].target].memory.queue.push({
          role: 'powertransporter',
          routing: {
            targetRoom: this.name
          }
        });
      }

      Memory.powerBanks[this.name].transporter_called = true;
    }
    return true;
  }
  return false;
};

/*
 * Set powerBank in memmory and spawn harvesting creeps
 */
let prepareTargetRoom = function(room, target, minRoute) {
  Memory.powerBanks[room.name] = {
    target: target.name,
    minRoute: minRoute
  };
  room.log('--------------> Start power harvesting in: ' + target.name + ' <----------------');
  for (let role of ['powerattacker', 'powerhealer', 'powerhealer']) {
    Game.rooms[target.name].memory.queue.push({
      role: role,
      routing: {
        targetRoom: room.name
      }
    });
  }
};

let checkBaseForPowerHarvesting = function(roomName, minRoute) {
  var room = Game.rooms[Memory.myRooms[roomName]];
  if (!room || !room.storage || room.storage.store.energy < config.power.energyForCreeps) {
    return false;
  }
  let routeToTest = Game.map.findRoute(this.name, room.name);
  return routeToTest.length < minRoute;
};

/*
 * Search for a room close by and queue harvesting creeps
 */
Room.prototype.externalHandleNewPowerBank = function() {
  let minRoute = 6;
  let target = null;
  for (var roomName in Memory.myRooms) {
    if (checkBaseForPowerHarvesting(roomName), minRoute) {
      minRoute = routeToTest.length;
      target = room;
    }
  }

  if (target === null) {
    Memory.powerBanks[this.name] = {
      target: null
    };
    return true;
  }
  prepareTargetRoom(this, target, minRoute);
};

/*
 * Checks for powerBanks, if these are active, if these can be handled or
 * decays.
 */
Room.prototype.checkHandledPowerBank = function() {
  const structures = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_POWER_BANK]);
  if (structures.length === 0) {
    delete Memory.powerBanks[this.name];
    return true;
  }

  if (Memory.powerBanks[this.name] && Memory.powerBanks[this.name].target === null) {
    return true;
  }

  if (this.externalHandleKnownPowerBank()) {
    return true;
  }

  if (structures[0].ticksToDecay < 3000) {
    return true;
  }
  return false;
};

/*
 * Handle highway rooms especially search for power harvesting
 */
Room.prototype.externalHandleHighwayRoom = function() {
  if (config.power.disabled) {
    return true;
  }
  Memory.powerBanks = Memory.powerBanks || {};
  if (this.checkHandledPowerBank()) {
    return true;
  }

  this.externalHandleNewPowerBank();
};

Room.prototype.handleOccupiedRoom = function() {
  this.memory.lastSeen = Game.time;
  const hostiles = this.find(FIND_HOSTILE_CREEPS);
  if (hostiles.length > 0) {
    // TODO replace with enum
    this.memory.state = 'Occupied';
    this.memory.player = this.controller.owner.username;

    // TODO trigger everytime?
    if (!this.controller.safeMode) {
      const myCreeps = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['scout'], true);
      if (myCreeps.length > 0) {
        return false;
      }
      const spawns = this.findPropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
      if (spawns.length > 0) {
        this.attackRoom();
      }
    }

    return false;
  }
};

/*
 * Check Position for structures except ROAD, RAMPART and CONTAINER
 */
Room.prototype.checkPositionForBlockingStructures = function(pos) {
  let roomPos = new RoomPosition(pos.x, pos.y, this.name);
  let structures = roomPos.lookFor('structure');

  for (let structure of structures) {
    if (structure.structureType === STRUCTURE_ROAD) {
      continue;
    }
    if (structure.structureType === STRUCTURE_RAMPART) {
      continue;
    }
    if (structure.structureType === STRUCTURE_CONTAINER) {
      continue;
    }
    this.log(`Path ${pathName} blocked on ${pos} due to ${structure.structureType}`);
    return true;
  }
  return false;
};

/*
 * Check if any of the precalculated paths is blocked by structures
 */
Room.prototype.checkBlockedPath = function() {
  let paths = this.getMemoryPaths();
  for (let pathName of Object.keys(paths)) {
    let path = paths[pathName] || {};
    for (let pos of path) {
      if (this.checkPositionForBlockingStructures(pos)) {
        return true;
      }
    }
  }
};

/*
 * Check if the room has a valid reservation in memory
 */
Room.prototype.checkExternalRoomMemoryForReservation = function(reservation) {
  if (reservation === undefined) {
    // TODO Check the closest room and set reservation
    this.log('No reservation');
    return true;
  }

  let baseRoom = Game.rooms[reservation.base];
  if (baseRoom === undefined) {
    delete this.memory.reservation;
    return true;
  }
  if (baseRoom.misplacedSpawn) {
    return true;
  }
  return false;
};

/*
 * Check rooms memory for reservation
 * Checks path to spawn structurer
 * Call reserver if needed
 */
Room.prototype.checkAndSpawnReserver = function() {
  let reservation = this.memory.reservation;
  if (this.checkExternalRoomMemoryForReservation()) {
    return false;
  }
  let baseRoom = Game.rooms[reservation.base];
  if (this.checkBlockedPath()) {
    if (this.exectueEveryTicks(config.creep.structurerInterval)) {
      this.log('Call structurer from ' + baseRoom.name);
      baseRoom.checkRoleToSpawn('structurer', 1, undefined, this.name);
      return;
    }
  }

  baseRoom.checkRoleToSpawn('reserver', 1, this.controller.id, this.name, 2);
};

Room.prototype.handleReservedRoom = function() {
  this.memory.state = 'Reserved';
  this.memory.lastSeen = Game.time;
  if (this.memory.lastChecked !== undefined &&
    Game.time - this.memory.lastChecked < 500) {
    return false;
  }
  this.memory.lastChecked = Game.time;

  let idiotCreeps = this.find(FIND_HOSTILE_CREEPS, {
    filter: this.findAttackCreeps
  });
  for (let idiotCreep of idiotCreeps) {
    brain.increaseIdiot(idiotCreep.owner.username);
  }

  let reservers = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['reserver']);
  if (reservers.length === 0) {
    this.checkAndSpawnReserver();
  }
  return false;
};

/*
 * Check if rooms on the route are owned or reserved by us
 */
let checkRouteForOwnedAndReservedRooms = function(route) {
  for (let routeEntry of route) {
    let routeRoomName = routeEntry.room;
    if (Game.rooms[routeRoomName] === undefined) {
      return true;
    }
    let routeRoom = Game.rooms[routeRoomName];
    if (routeRoom.controller === undefined) {
      return true;
    }
    if (!routeRoom.controller.my && routeRoom.memory.state !== 'Reserved') {
      return true;
    }
  }
  return false;
};

Room.prototype.handleUnreservedRoom = function() {
  this.memory.state = 'Unreserved';
  this.memory.lastSeen = Game.time;
  if (this.memory.lastChecked !== undefined &&
    Game.time - this.memory.lastChecked < 500) {
    return true;
  }

  // TODO: Don't check every tick.
  if (this.memory.reservation === undefined) {
    let isReservedBy = (roomName) => {
      return (roomMemory) => {
        return roomMemory.reservation !== undefined &&
          roomMemory.state === 'Reserved' &&
          roomMemory.reservation.base === roomName;
      };
    };
    for (let roomName of Memory.myRooms) {
      let room = Game.rooms[roomName];
      if (!room) {
        continue;
      }
      let distance = Game.map.getRoomLinearDistance(this.name, room.name);
      if (distance > config.external.distance) {
        continue;
      }
      let route = Game.map.findRoute(this.name, room.name);
      distance = route.length;
      if (distance > config.external.distance) {
        continue;
      }
      // Only allow pathing through owned rooms or already reserved rooms.
      if (checkRouteForOwnedAndReservedRooms(route)) {
        continue;
      }
      if (room.memory.queue && room.memory.queue.length === 0 &&
        room.energyAvailable >= room.getEnergyCapacityAvailable()) {
        let reservedRooms = _.filter(Memory.rooms, isReservedBy(room.name));
        // RCL: target reserved rooms
        let numRooms = config.room.reservedRCL;
        if (reservedRooms.length < numRooms[room.controller.level]) {
          this.memory.reservation = {
            base: room.name
          };
          this.memory.state = 'Reserved';
          break;
        }
      }
    }
  }

  if (this.memory.reservation !== undefined) {
    this.memory.lastChecked = Game.time;
    let reservation = this.memory.reservation;
    if (this.name === reservation.base) {
      this.log('Want to spawn reserver for the base room, why?');
      delete this.memory.reservation;
      return false;
    }
    this.memory.state = 'Reserved';
    this.checkAndSpawnReserver();
  }
  return true;
};

Room.prototype.handleSourceKeeperRoom = function() {
  if (!this.memory.base) {
    return false;
  }

  if (!this.exectueEveryTicks(893)) {
    return false;
  }
  this.log('handle source keeper room');
  this.log('DISABLED - Routing keep distance to Source keeper structure, sourcer/carry check for next spawn, move await ~10 ticksToSpawn');
  if (true) {
    return false;
  }

  let myCreeps = this.find(FIND_MY_CREEPS);
  let sourcer = 0;
  let melee = 0;
  for (let object of myCreeps) {
    let creep = Game.getObjectById(object.id);
    if (creep.memory.role === 'sourcer') {
      sourcer++;
      continue;
    }
    if (creep.memory.role === 'atkeepermelee') {
      melee++;
      continue;
    }
  }

  if (sourcer < 3) {
    for (let source of this.find(FIND_SOURCES)) {
      let sourcer = source.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['sourcer']);
      if (sourcer !== null) {
        let range = source.pos.getRangeTo(sourcer.pos);
        if (range < 7) {
          continue;
        }
      }
      let spawn = {
        role: 'sourcer',
        routing: {
          targetId: source.id,
          targetRoom: source.pos.roomName
        }
      };
      this.log(`!!!!!!!!!!!! ${JSON.stringify(spawn)}`);
      Game.rooms[this.memory.base].checkRoleToSpawn('sourcer', 1, source.id, source.pos.roomName);
    }
  }

  if (melee === 0) {
    var spawn = {
      role: 'atkeepermelee',
      routing: {
        targetRoom: this.name
      }
    };
    this.log(`!!!!!!!!!!!! ${JSON.stringify(spawn)}`);
    Game.rooms[this.memory.base].memory.queue.push(spawn);
  }
};
