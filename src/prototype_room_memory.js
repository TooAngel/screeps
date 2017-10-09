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
  this.checkSegment();
  const roomKeyPrefix = this.getRoomMemorySegmentKey('');
  for (const key of brain.getSegmentKeys(this.memory.segment)) {
    if (key.startsWith(roomKeyPrefix)) {
      brain.removeSegmentObject(this.memory.segment, roomKeyPrefix);
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
  this.checkSegment();
  return brain.getSegmentObject(this.memory.segment, this.getRoomMemorySegmentKey('costmatrix'));
};

/**
 * Stores the costMatrix in cache and in memory segment.
 *
 * @param {Object} costMatrix - the costMatrix to save
 */
Room.prototype.setMemoryCostMatrix = function(costMatrix) {
  this.checkSegment();
  brain.setSegmentObject(this.memory.segment, this.getRoomMemorySegmentKey('costmatrix'), costMatrix, 'costmatrix');
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
    //    this.log(`getPaths ${item} missing in cache`);
    let path;
    try {
      path = Room.stringToPath(this.memory.routing[item].path);
    } catch (e) {
      path = this.memory.routing[item].path;
      this.memory.routing[item].path = Room.pathToString(path);
    }

    cache.rooms[this.name].routing[item] = {
      path: path,
      created: this.memory.routing[item].created,
      fixed: this.memory.routing[item].fixed,
      name: this.memory.routing[item].name,
    };
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
    //    this.log(`getPath ${name} missing in cache`);
    let path;
    try {
      path = Room.stringToPath(this.memory.routing[name].path);
    } catch (e) {
      path = this.memory.routing[name].path;
      this.memory.routing[name].path = Room.pathToString(path);
    }
    cache.rooms[this.name].routing[name] = {
      path: path,
      created: this.memory.routing[name].created,
      fixed: this.memory.routing[name].fixed,
      name: this.memory.routing[name].name,
    };
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
 */
Room.prototype.setMemoryPath = function(name, path, fixed) {
  this.checkCache();
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
