'use strict';

/*
 * Memory abstraction layer
 *
 * The methods build the interface to the memory.
 * Path:
 * The idea is to cache paths as roomPosition in a global object.
 * Store paths from my rooms in a compressed form in memory.
 *
 * CostMatrix:
 * Store costMatrix for myRooms in cache and memory.
 * Other rooms are only stored in cache.
 */

/**
 * Initialize `this.memory.segment` if it not exists yet
 */
Room.prototype.checkSegment = function() {
  if (this.memory.segment === undefined) {
    this.memory.segment = brain.getNextSegmentId();
  }
};

/**
 * Combine key for storing room cache objects in memory segments
 *
 * @param {string} object Room object name
 * @return {string}
 */
Room.prototype.getRoomMemorySegmentKey = function(object) {
  return `room-${this.name}-${object}`;
};

/**
 * Deletes room memory, all room cache objects from memory segments and invalidates global cache
 */
Room.prototype.clearMemory = function() {
  if (config.memory.segmentsEnabled) {
    this.checkSegment();
    const roomKeyPrefix = this.getRoomMemorySegmentKey('');
    for (const key of brain.getSegmentKeys(this.memory.segment)) {
      if (key.startsWith(roomKeyPrefix)) {
        brain.removeSegmentObject(this.memory.segment, roomKeyPrefix);
      }
    }
  }
  this.memory = {
    invalidated: Game.time,
  };
};

/**
 * Returns the costMatrix for the room. The cache will be populated
 * from memory segment.
 *
 * @return {CostMatrix|undefined}
 */
Room.prototype.getMemoryCostMatrix = function() {
  return PathFinder.CostMatrix.deserialize(this.memory.costMatrix);
};

/**
 * Stores the costMatrix in cache and in memory segment.
 *
 * @param {Object} costMatrix - the costMatrix to save
 */
Room.prototype.setMemoryCostMatrix = function(costMatrix) {
  if (config.memory.segmentsEnabled) {
    this.checkSegment();
    brain.setSegmentObject(this.memory.segment, this.getRoomMemorySegmentKey('costmatrix'), costMatrix, 'costmatrix');
  } else {
    this.memory.costMatrix = costMatrix.serialize();
  }
};

Room.prototype.checkCache = function() {
  this.memory.routing = this.memory.routing || {};
  if (!cache.rooms[this.name] || !cache.rooms[this.name].created ||
    this.memory.invalidated && cache.rooms[this.name].created < this.memory.invalidated) {
    cache.rooms[this.name] = {
      find: {},
      routing: {},
      costMatrix: {},
      created: Game.time,
    };
  }
};

const pathMissingInCache = function(room, item) {
  let path;
  try {
    path = Room.stringToPath(room.memory.routing[item].path);
  } catch (e) {
    path = room.memory.routing[item].path;
    room.memory.routing[item].path = Room.pathToString(path);
  }

  cache.rooms[room.name].routing[item] = {
    path: path,
    created: room.memory.routing[item].created,
    fixed: room.memory.routing[item].fixed,
    name: room.memory.routing[item].name,
  };
};

/**
 * Returns all paths for this room from cache. Checks if cache and memory
 * paths fit, otherwise populate cache.
 *
 * @return {object}
 */
Room.prototype.getMemoryPaths = function() {
  this.checkCache();
  const memoryKeys = Object.keys(this.memory.routing).sort();
  const cacheKeys = Object.keys(cache.rooms[this.name].routing).sort();
  const diff = _.difference(memoryKeys, cacheKeys);
  for (const item of diff) {
    pathMissingInCache(this, item);
  }
  return cache.rooms[this.name].routing;
};

Room.prototype.getMemoryPathsSet = function() {
  this.checkCache();
  const mem = cache.rooms[this.name].pathSet = cache.rooms[this.name].pathSet || {};
  for (const pathName of Object.keys(this.getMemoryPaths())) {
    const path = this.getMemoryPath(pathName);
    for (const pos of path) {
      mem[`${pos.x} ${pos.y}`] = true;
    }
  }
  return mem;
};

/**
 * Returns the path for the given name. Checks for validity and populated
 * cache if missing.
 *
 * @param {String} name - the name of the path
 * @return {array|boolean} path
 */
Room.prototype.getMemoryPath = function(name) {
  this.checkCache();

  const isValid = function(path) {
    return path.fixed || path.created > Game.time - config.path.refresh;
  };

  if (cache.rooms[this.name].routing[name] && isValid(cache.rooms[this.name].routing[name])) {
    return cache.rooms[this.name].routing[name].path;
  }

  if (this.memory.routing[name] && isValid(this.memory.routing[name])) {
    pathMissingInCache(this, name);
    return cache.rooms[this.name].routing[name].path;
  }
  return false;
};

/**
 * Cleans the cache and memory from all paths
 */
Room.prototype.deleteMemoryPaths = function() {
  this.checkCache();
  cache.rooms[this.name].routing = {};
  delete this.memory.routing;
  cache.rooms[this.name].pathSet = {};
};

/**
 * Removes the named path from cache and memory
 *
 * @param {String} name - the name of the path
 */
Room.prototype.deleteMemoryPath = function(name) {
  this.checkCache();
  delete cache.rooms[this.name].routing[name];
  delete this.memory.routing[name];
  cache.rooms[this.name].pathSet = {};
};

/**
 * Stores the given path under the name in cache. If `fixed` is true
 * the path is stored in memory serialized.
 *
 * @param {String} name - the name of the path
 * @param {Array} path - the path itself
 * @param {boolean} fixed - Flag to define if the path should be stored in memory
 * @param {boolean} perturb - Flag to define if the path should be perturbed
 */
Room.prototype.setMemoryPath = function(name, path, fixed, perturb = false) {
  this.checkCache();
  if (perturb) {
    path = Room.perturbPath(path);
  }
  const data = {
    path: path,
    created: Game.time,
    fixed: fixed,
    name: name,
  };
  cache.rooms[this.name].routing[name] = data;
  if (fixed) {
    const memoryData = {
      path: Room.pathToString(path),
      created: Game.time,
      fixed: fixed,
      name: name,
    };
    this.memory.routing[name] = memoryData;
  }
  cache.rooms[this.name].pathSet = {};
};

/**
 * Returns a list of some/all reserved routing positions in the room
 *
 * @param {Function} filter - optional function used to filter positions
 * @return {Array} all reserved positions
 */
Room.prototype.getPositions = function(filter) {
  if (!this.memory.position) {
    return [];
  }

  const positions = [];
  for (const creepId of Object.keys(this.memory.position.creep)) {
    const pos = this.memory.position.creep[creepId];
    if (!pos) {
      continue;
    }
    if (!filter || filter(pos)) {
      positions.push(pos);
    }
  }
  for (const structureId of Object.keys(this.memory.position.structure)) {
    const poss = this.memory.position.structure[structureId];
    for (const pos of poss) {
      if (!pos) {
        continue;
      }
      if (!filter || filter(pos)) {
        positions.push(pos);
      }
    }
  }

  return positions;
};

/**
 * Bends orthogonal path segments into diagonal zigzags
 *
 * @param {Array} path - the path to perturb
 * @return {Array} changed - the perturbed path
 */
Room.perturbPath = function(path) {
  if (!path) {
    return path;
  }
  let skip = false;
  let prevDir = null;
  let prevDirOffset = 2;
  for (let pathIndex = 0; pathIndex < path.length - 1; pathIndex++) {
    const posPathObject = path[pathIndex];
    const posPathNext = path[pathIndex + 1];
    const dirNext = posPathObject.getDirectionTo(posPathNext);
    if (skip) {
      // don't perturb if we did on the last step
      skip = false;
      prevDir = dirNext;
      continue;
    }
    if (prevDir !== dirNext || dirNext % 2 === 0) {
      // don't perturb corners or diagonals
      prevDir = dirNext;
      continue;
    }
    for (let dirOffset = -prevDirOffset; dirOffset !== prevDirOffset * 3; dirOffset += prevDirOffset * 2) {
      const offsetPosition = posPathObject.getAdjacentPosition((dirNext + dirOffset + 7) % 8 + 1);
      if (offsetPosition.lookFor(LOOK_TERRAIN)[0] === 'plain' && !offsetPosition.inPositions() && !offsetPosition.isBorder(1)) {
        path[pathIndex] = offsetPosition;
        prevDirOffset = dirOffset;
        skip = true;
        break;
      }
    }
    prevDir = dirNext;
  }
  return path;
};
