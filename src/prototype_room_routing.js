'use strict';

const {splitRoomName} = require('./prototype_room_utils');

/**
 * routeCallbackRoomHandle
 *
 * @param {string} roomName
 * @return {number}
 */
function routeCallbackRoomHandle(roomName) {
  let returnValue;
  if (Memory.rooms[roomName].state === 'Occupied') {
    // console.log(Game.time, `Creep.prototype.getRoute: Do not route through occupied rooms ${roomName}`);
    if (config.path.allowRoutingThroughFriendRooms && friends.indexOf(Memory.rooms[roomName].player) > -1) {
      console.log('routing through friendly room' + roomName);
      returnValue = 1;
    } else {
      // console.log(Game.time, 'Not routing through enemy room' + roomName);
      returnValue = Infinity;
    }
  }
  if (Memory.rooms[roomName].state === 'Blocked') {
    // console.log(Game.time, `Creep.prototype.getRoute: Do not route through blocked rooms ${roomName}`);
    returnValue = Infinity;
  }
  return returnValue;
}

/**
 * routeCallback
 *
 * @param {string} to
 * @param {boolean} useHighWay
 * @return {number}
 */
function routeCallback(to, useHighWay) {
  return function(roomName) {
    let returnValue = Infinity;
    if (roomName === to) {
      returnValue = 1;
    } else {
      if (Memory.rooms[roomName]) {
        returnValue = routeCallbackRoomHandle(roomName);
      }
      if (useHighWay) {
        const nameSplit = splitRoomName(roomName);
        if (nameSplit[2] % 10 === 0 || nameSplit[4] % 10 === 0) {
          returnValue = 0.5;
        } else {
          returnValue = 2;
        }
      } else {
        returnValue = 1;
      }
    }
    return returnValue;
  };
}


Room.isRoomUnderAttack = function(roomName) {
  if (!Memory.rooms[roomName]) {
    return false;
  }

  if (!Memory.rooms[roomName].hostile) {
    return false;
  }

  if (Game.time - Memory.rooms[roomName].hostile.lastUpdate > config.hostile.rememberInRoom) {
    delete Memory.rooms[roomName].hostile;
    const room = Game.rooms[roomName];
    room.log('new move: isRoomUnderAttack: lastUpdate too old');
    return false;
  }

  // Maybe also add? Rethink wayBlocked
  // if (this.memory.role === 'nextroomer' && Game.rooms[this.memory.target]) {
  //   Game.rooms[this.memory.target].memory.wayBlocked = true;
  // }

  return true;
};

Room.prototype.getCreepPositionForId = function(to) {
  if (this.data.positions.creep[to]) {
    const pos = this.data.positions.creep[to][0];
    if (pos) {
      return new RoomPosition(pos.x, pos.y, this.name);
    }
  }
  const target = Game.getObjectById(to);
  if (target === null) {
    this.log('getCreepPositionForId: No object: ' + to);
    return;
  }

  try {
    let pos = target.pos.findNearPosition().next().value;
    if (!pos) {
      // this.log('getCreepPositionForId no pos in memory take pos of target: ' + to);
      pos = Game.getObjectById(to).pos;
    }
    this.data.positions.creep[to] = [pos];

    return new RoomPosition(pos.x, pos.y, this.name);
  } catch (e) {
    this.log(`getCreepPositionForId to: ${to} target: ${target}`);
    throw e;
  }
};

// find a route using highway rooms
Room.prototype.findRoute = function(from, to, useHighWay) {
  useHighWay = useHighWay || false;
  return Game.map.findRoute(from, to, {
    routeCallback: routeCallback(to, useHighWay),
  });
};

Room.prototype.buildPath = function(route, routePos, from, to) {
  if (!to) {
    throw new Error();
  }
  let start;
  if (routePos === 0 || from === 'pathStart') {
    start = this.getCreepPositionForId(from);
  } else {
    start = this.getMyExitTo(from);
  }
  let end;
  if (routePos < route.length - 1) {
    end = this.getMyExitTo(to);
  } else {
    end = this.getCreepPositionForId(to);
    if (!end) {
      const item = Game.getObjectById(to);
      this.debugLog('routing', `buildPath no end ${to} ${item}`);
      return;
    }
  }
  if (!start) {
    this.log('No start');
  }
  if (!end) {
    this.log('No end');
  }
  this.debugLog('routing', `buildPath start: ${JSON.stringify(start)} ${JSON.stringify(end)}`);
  const search = PathFinder.search(
    start, {
      pos: end,
      range: 1,
    }, {
      roomCallback: this.getCostMatrixCallback(end),
      maxRooms: 1,
      swampCost: config.layout.swampCost,
      plainCost: config.layout.plainCost,
    },
  );
  search.path.splice(0, 0, start);
  search.path.push(end);
  return search.path;
};

// Providing the targetId is a bit odd
Room.prototype.getPath = function(route, routePos, startId, targetId) {
  let from = startId;
  if (routePos > 0) {
    from = route[routePos - 1].room;
  }
  let to = targetId;
  if (routePos < route.length - 1) {
    to = route[routePos + 1].room;
  }

  // TODO instead of from-to, order these by name to not have duplicate rooms W1N1-E1S1 and E1S1-W1N1
  const pathName = from + '-' + to;
  let path = this.getMemoryPath(pathName);
  if (!path) {
    this.debugLog('routing', `buildPath ${JSON.stringify(route)} ${routePos} ${from} ${to}`);
    path = this.buildPath(route, routePos, from, to);
    if (!path) {
      this.debugLog('routing', `getPath: No path, from: ${from} to: ${to}`);
      return;
    }
    this.setMemoryPath(pathName, path, true);
  }
  return path;
};

Room.prototype.getMyExitTo = function(room) {
  // Handle rooms with newbie zone walls
  const exitDirection = this.findExitTo(room);
  const nextExits = this.find(exitDirection);
  const nextExit = nextExits[Math.floor(nextExits.length / 2)];
  return new RoomPosition(nextExit.x, nextExit.y, this.name);
};


/**
 * setSources
 *
 * @param {object} costMatrix
 * @param {object} room
 * @param {object} end
 */
function setSources(costMatrix, room, end) {
  const sources = room.find(FIND_SOURCES, {
    filter: (object) => {
      return !end || object.pos.x !== end.x || object.pos.y !== end.y;
    },
  });
  for (const source of sources) {
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        if (end && source.pos.x + x === end.x && source.pos.y + y !== end.y) {
          continue;
        }
        costMatrix.set(source.pos.x + x, source.pos.y + y, 0xff);
      }
    }
  }
}

Room.prototype.getMatrixCallback = function(end) {
  // TODO cache?!
  const callback = (roomName) => {
    const room = Game.rooms[roomName];
    const costMatrix = new PathFinder.CostMatrix();

    setSources(costMatrix, room, end);

    if (room.controller) {
      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (end && room.controller.pos.x + x === end.x && room.controller.pos.y + y !== end.y) {
            continue;
          }
          costMatrix.set(room.controller.pos.x + x, room.controller.pos.y + y, 0xff);
        }
      }
    }
    return costMatrix;
  };

  return callback;
};
