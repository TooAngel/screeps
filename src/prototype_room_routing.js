'use strict';

Room.isRoomUnderAttack = function(roomName) {
  if (!Memory.rooms[roomName]) {
    return false;
  }

  if (!Memory.rooms[roomName].hostile) {
    return false;
  }

  if (Game.time - Memory.rooms[roomName].hostile.lastUpdate > config.hostile.remeberInRoom) {
    delete Memory.rooms[roomName].hostile;
    const room = Game.rooms[roomName];
    room.log('newmove: isRoomUnderAttack: lastUpdate too old');
    return false;
  }

  // Maybe also add? Rethink wayBlocked
  // if (this.memory.role === 'nextroomer' && Game.rooms[this.memory.target]) {
  //   Game.rooms[this.memory.target].memory.wayBlocked = true;
  // }

  return true;
};

Room.prototype.getCreepPositionForId = function(to) {
  if (this.memory.position && this.memory.position.creep && this.memory.position.creep[to]) {
    const pos = this.memory.position.creep[to][0];
    if (pos) {
      return new RoomPosition(pos.x, pos.y, this.name);
    }
  }
  const defaultPosition = {
    creep: {},
  };
  const target = Game.getObjectById(to);
  if (target === null) {
    // this.log('getCreepPositionForId: No object: ' + to);
    return;
  }
  this.memory.position = this.memory.position || defaultPosition;
  // TODO not all positions needs to be stored in room memory
  try {
    this.memory.position.creep[to] = [target.pos.findNearPosition().next().value];
  } catch (e) {
    console.log(`getCreepPositionForId to: ${to} target: ${target}`);
    throw e;
  }

  let pos = this.memory.position.creep[to][0];
  if (!pos) {
    // this.log('getCreepPositionForId no pos in memory take pos of target: ' + to);
    pos = Game.getObjectById(to).pos;
  }
  return new RoomPosition(pos.x, pos.y, this.name);
};

// find a route using highway rooms
Room.prototype.findRoute = function(from, to, useHighWay) {
  useHighWay = useHighWay || false;
  return Game.map.findRoute(from, to, {
    routeCallback: global.utils.routeCallback(to, useHighWay),
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
Room.prototype.getPath = function(route, routePos, startId, targetId, fixed) {
  if (!this.memory.position) {
    this.debugLog('routing', 'getPath no position');
    this.updatePosition();
  }

  let from = startId;
  if (routePos > 0) {
    from = route[routePos - 1].room;
  }
  let to = targetId;
  if (routePos < route.length - 1) {
    to = route[routePos + 1].room;
  }

  const pathName = from + '-' + to;
  if (!this.getMemoryPath(pathName)) {
    const path = this.buildPath(route, routePos, from, to);
    if (!path) {
      this.debugLog('routing', `getPath: No path, from: ${from} to: ${to}`);
      return;
    }
    this.setMemoryPath(pathName, path, fixed, true);
  }
  return this.getMemoryPath(pathName);
};

Room.prototype.getMyExitTo = function(room) {
  // Handle rooms with newbie zone walls
  const exitDirection = this.findExitTo(room);
  const nextExits = this.find(exitDirection);
  const nextExit = nextExits[Math.floor(nextExits.length / 2)];
  return new RoomPosition(nextExit.x, nextExit.y, this.name);
};

Room.prototype.getMatrixCallback = function(end) {
  // TODO cache?!
  const callback = function(roomName) {
    // console.log('getMatrixCallback', this);
    const room = Game.rooms[roomName];
    const costMatrix = new PathFinder.CostMatrix();
    // Previous Source Keeper where also excluded?

    const sources = room.find(FIND_SOURCES, {
      filter: function(object) {
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
