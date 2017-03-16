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

Room.prototype.setFillerArea = function(storagePos, costMatrixBase, route) {
  let fillerPosIterator = storagePos.findNearPosition();
  for (let fillerPos of fillerPosIterator) {
    this.memory.position.creep.filler = fillerPos;

    // TODO Bug in E37N35 path was different compared to the fillerPos. costMatrix should be resetted, too
    this.deleteMemoryPath('pathStart-filler');

    let pathFiller = this.getPath(route, 0, 'pathStart', 'filler', true);
    for (let pos of pathFiller) {
      costMatrixBase.set(pos.x, pos.y, config.layout.pathAvoid);
    }
    this.setMemoryCostMatrix(costMatrixBase);

    let linkStoragePosIterator = fillerPos.findNearPosition();
    for (let linkStoragePos of linkStoragePosIterator) {
      this.memory.position.structure.link.unshift(linkStoragePos);

      let powerSpawnPosIterator = fillerPos.findNearPosition();
      for (let powerSpawnPos of powerSpawnPosIterator) {
        this.memory.position.structure.powerSpawn.push(powerSpawnPos);

        let towerPosIterator = fillerPos.findNearPosition();
        for (let towerPos of towerPosIterator) {
          this.memory.position.structure.tower.push(towerPos);

          costMatrixBase.set(fillerPos.x, fillerPos.x, config.layout.creepAvoid);
          this.setMemoryCostMatrix(costMatrixBase);

          return;
        }
      }
    }
  }
};

Room.prototype.updatePosition = function() {
  // Instead of doing the complete setup, this could also be done on request
  this.log('Update position');
  cache.rooms[this.name] = {};
  delete this.memory.routing;

  let costMatrixBase = this.getCostMatrix();

  this.memory.position = {
    creep: {}
  };
  this.memory.position.structure = {
    storage: [],
    spawn: [],
    extension: [],
    tower: [],
    link: [],
    observer: [],
    lab: [],
    terminal: [],
    nuker: [],
    powerSpawn: [],
    extractor: []
  };

  let sources = this.find(FIND_SOURCES);
  for (let source of sources) {
    let sourcer = source.pos.findNearPosition().next().value;
    this.memory.position.creep[source.id] = sourcer;
    // TODO E.g. E11S8 it happens that sourcer has no position
    if (sourcer) {
      let link = sourcer.findNearPosition().next().value;
      this.memory.position.structure.link.push(link);
      costMatrixBase.set(link.x, link.y, config.layout.structureAvoid);
      this.setMemoryCostMatrix(costMatrixBase);
    }
  }

  let minerals = this.find(FIND_MINERALS);
  for (let mineral of minerals) {
    let extractor = mineral.pos.findNearPosition().next().value;
    this.memory.position.creep[mineral.id] = extractor;
    costMatrixBase.set(extractor.x, extractor.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrixBase);
  }

  if (this.controller) {
    for (let mineral of minerals) {
      this.memory.position.structure.extractor.push(mineral.pos);
    }

    let upgraderPos = this.controller.pos.findNearPosition().next().value;
    this.memory.position.creep[this.controller.id] = upgraderPos;
    costMatrixBase.set(upgraderPos.x, upgraderPos.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrixBase);

    let storagePos = this.memory.position.creep[this.controller.id].findNearPosition().next().value;
    this.memory.position.structure.storage.push(storagePos);
    // TODO should also be done for the other structures
    costMatrixBase.set(storagePos.x, storagePos.y, config.layout.structureAvoid);
    this.setMemoryCostMatrix(costMatrixBase);

    this.memory.position.creep.pathStart = storagePos.findNearPosition().next().value;

    let route = [{
      room: this.name
    }];
    let pathUpgrader = this.getPath(route, 0, 'pathStart', this.controller.id, true);
    // TODO exclude the last position (creepAvoid) in all paths
    for (let pos of pathUpgrader) {
      if (upgraderPos.isEqualTo(pos.x, pos.y)) {
        continue;
      }
      costMatrixBase.set(pos.x, pos.y, config.layout.pathAvoid);
    }
    this.setMemoryCostMatrix(costMatrixBase);

    for (let source of sources) {
      let route = [{
        room: this.name
      }];
      let path = this.getPath(route, 0, 'pathStart', source.id, true);
      for (let pos of path) {
        let posObject = new RoomPosition(pos.x, pos.y, this.name);
        let sourcer = this.memory.position.creep[source.id];
        if (posObject.isEqualTo(sourcer.x, sourcer.y)) {
          continue;
        }

        costMatrixBase.set(pos.x, pos.y, config.layout.pathAvoid);
      }
      let sourcer = this.memory.position.creep[source.id];
      costMatrixBase.set(sourcer.x, sourcer.y, config.layout.creepAvoid);
      this.setMemoryCostMatrix(costMatrixBase);
    }

    this.setFillerArea(storagePos, costMatrixBase, route);
  }

  this.setMemoryCostMatrix(costMatrixBase);
  return costMatrixBase;
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

  // TODO avoid swamps in external rooms
  let callback = this.getMatrixCallback;

  if (this.memory.costMatrix && this.memory.costMatrix.base) {
    let room = this;
    callback = function(end) {
      let callbackInner = function(roomName) {
        let costMatrix = PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
        return costMatrix;
      };
      return callbackInner;
    };
  }

  let search = PathFinder.search(
    start, {
      pos: end,
      range: 1
    }, {
      roomCallback: callback(end),
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

  // TODO When switch to global cache is done, this can be removed
  if (!this.cache) {
    this.cache = {};
  }

  let cacheName = this.name + ':' + pathName;
  if (!this.cache[cacheName]) {
    try {
      this.cache[cacheName] = this.getMemoryPath(pathName);
    } catch (e) {
      this.log('Can not parse path in cache will delete Memory');
      delete Memory.rooms[this.name];
    }
  }

  return this.cache[cacheName];
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
  //  console.log('getMatrixCallback', this);
  let callback = function(roomName) {
    let room = Game.rooms[roomName];
    let costMatrix = new PathFinder.CostMatrix();
    // Previous Source Keeper where also excluded?

    let sources = room.find(FIND_SOURCES, {
      filter: function(object) {
        return !end || object.pos.x != end.x || object.pos.y != end.y;
      }
    });

    for (let source of sources) {
      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (end && source.pos.x + x === end.x && source.pos.y + y != end.y) {
            continue;
          }
          costMatrix.set(source.pos.x + x, source.pos.y + y, 0xff);
        }
      }
    }

    if (room.controller) {
      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (end && room.controller.pos.x + x === end.x && room.controller.pos.y + y != end.y) {
            continue;
          }
          costMatrix.set(room.controller.pos.x + x, room.controller.pos.y + y, 0xff);
        }
      }
    }

    // Ignore walls?
    //    let structures = room.find(FIND_STRUCTURES, {
    //      filter: function(object) {
    //        if (object.structureType === STRUCTURE_ROAD) {
    //          return false;
    //        }
    //        if (object.structureType === STRUCTURE_RAMPART) {
    //          return !object.my;
    //        }
    //        return true;
    //      }
    //    });
    //    for (let structure of structures) {
    //      costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
    //    }
    //    let constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
    //      filter: function(object) {
    //        if (object.structureType === STRUCTURE_ROAD) {
    //          return false;
    //        }
    //        if (object.structureType === STRUCTURE_RAMPART) {
    //          return object.my;
    //        }
    //        return true;
    //      }
    //    });
    //    for (let constructionSite of constructionSites) {
    //      costMatrix.set(constructionSite.pos.x, constructionSite.pos.y, 0xFF);
    //    }
    return costMatrix;
  };

  return callback;
};
