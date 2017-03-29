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
    let room = Game.rooms[roomName];
    room.log('newmove: isRoomUnderAttack: lastUpdate too old');
    return false;
  }

  // Maybe also add? Rethink wayBlocked
  //	    if (this.memory.role === 'nextroomer' && Game.rooms[this.memory.target]) {
  //	      Game.rooms[this.memory.target].memory.wayBlocked = true;
  //	    }

  return true;
};

Room.prototype.getCreepPositionForId = function(to) {
  if (this.memory.position && this.memory.position.creep && this.memory.position.creep[to]) {
    let pos = this.memory.position.creep[to];
    return new RoomPosition(pos.x, pos.y, this.name);
  }

  let target = Game.getObjectById(to);
  if (target === null) {
    // this.log('getCreepPositionForId: No object: ' + to);
    return;
  }
  this.memory.position = this.memory.position || {
    creep: {}
  };
  this.memory.position.creep[to] = target.pos.findNearPosition().next().value;

  let pos = this.memory.position.creep[to];
  if (!pos) {
    //this.log('getCreepPositionForId no pos in memory take pos of target: ' + to);
    pos = Game.getObjectById(to).pos;
  }
  return new RoomPosition(pos.x, pos.y, this.name);
};

Room.prototype.findRoute = function(from, to) {
  let routeCallback = function(roomName, fromRoomName) {
    if (roomName === to) {
      return 1;
    }

    if (Memory.rooms[roomName] && Memory.rooms[roomName].state === 'Occupied') {
      //         console.log(`Creep.prototype.getRoute: Do not route through occupied rooms ${roomName}`);
      if (config.path.allowRoutingThroughFriendRooms && friends.indexOf(Memory.rooms[roomName].player) > -1) {
        console.log('routing through friendly room' + roomName);
        return 1;
      }
      //         console.log('Not routing through enemy room' + roomName);
      return Infinity;
    }

    if (Memory.rooms[roomName] && Memory.rooms[roomName].state === 'Blocked') {
      //         console.log(`Creep.prototype.getRoute: Do not route through blocked rooms ${roomName}`);
      return Infinity;
    }

    return 1;
  };
  return Game.map.findRoute(from, to, {
    routeCallback: routeCallback
  });
};

Room.prototype.buildPath = function(route, routePos, from, to) {
  if (!to) {
    this.log('newmove: buildPath: no to from: ' + from + ' to: ' + to + ' routePos: ' + routePos + ' route: ' + JSON.stringify(route));
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
      return;
    }
  }
  let search = PathFinder.search(
    start, {
      pos: end,
      range: 1
    }, {
      roomCallback: this.getCostMatrixCallback(end),
      maxRooms: 1,
      swampCost: config.layout.swampCost,
      plainCost: config.layout.plainCost
    }
  );

  search.path.splice(0, 0, start);
  search.path.push(end);
  return search.path;
};

// Providing the targetId is a bit odd
Room.prototype.getPath = function(route, routePos, startId, targetId, fixed) {
  if (!this.memory.position) {
    this.log('getPath no position');
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

  let pathName = from + '-' + to;
  if (!this.getMemoryPath(pathName)) {
    let path = this.buildPath(route, routePos, from, to);
    if (!path) {
      // this.log('getPath: No path');
      return;
    }
    this.setMemoryPath(pathName, path, fixed);
  }
  return this.getMemoryPath(pathName);
};

Room.prototype.getMyExitTo = function(room) {
  // Handle rooms with newbie zone walls
  let exitDirection = this.findExitTo(room);
  let nextExits = this.find(exitDirection);
  let nextExit = nextExits[Math.floor(nextExits.length / 2)];
  return new RoomPosition(nextExit.x, nextExit.y, this.name);
};

Room.prototype.getMatrixCallback = function(end) {
  // TODO cache?!
  let callback = function(roomName) {
    // console.log('getMatrixCallback', this);
    let room = Game.rooms[roomName];
    let costMatrix = new PathFinder.CostMatrix();
    // Previous Source Keeper where also excluded?

    let sources = room.find(FIND_SOURCES, {
      filter: function(object) {
        return !end || object.pos.x !== end.x || object.pos.y !== end.y;
      }
    });

    for (let source of sources) {
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
