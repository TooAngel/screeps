'use strict';

/*
 * Memory abstraction layer
 *
 * The methods build the interface to the memory.
 * Path:
 * The idea is to store paths as roomPosition in the global data object.
 * Store paths from my rooms in a compressed form in memory.
 *
 * CostMatrix:
 * Store costMatrix for myRooms in data and memory.
 * Other rooms are only stored in data.
 */

/**
 * Deletes room memory
 */
Room.prototype.clearMemory = function() {
  this.memory = {
    invalidated: Game.time,
  };
};

/**
 * Returns the costMatrix for the room.
 *
 * @return {CostMatrix|undefined}
 */
Room.prototype.getMemoryCostMatrix = function() {
  return this.data.costMatrix;
};

/**
 * Stores the costMatrix
 *
 * @param {Object} costMatrix - the costMatrix to save
 */
Room.prototype.setMemoryCostMatrix = function(costMatrix) {
  this.data.costMatrix = costMatrix;
  this.memory.costMatrix = costMatrix.serialize();
};

Room.prototype.populatePathToDataFromMemory = function(pathName) {
  const path = Room.stringToPath(this.memory.routing[pathName].path);
  console.log('-------------');
  console.log(this.data.routing);
  console.log(this.memory.routing[pathName].path);
  console.log(path);
  this.data.routing[pathName] = {
    path: path,
    created: this.memory.routing[pathName].created,
    fixed: this.memory.routing[pathName].fixed,
    name: this.memory.routing[pathName].name,
  };
};

/**
 * Returns all paths for this room from data. If no path in data, populate it
 *
 * @return {object}
 */
Room.prototype.getMemoryPaths = function() {
  // if (!this.data.routing) {
  //   const pathNames = Object.keys(this.memory.routing).sort();
  //   for (const pathName of pathNames) {
  //     this.populatePathToDataFromMemory(pathName);
  //   }
  // }
  return this.data.routing;
};

/**
 * Returns the path for the given name. Checks for validity and populated
 * data if missing.
 *
 * @param {String} name - the name of the path
 * @return {array|boolean} path
 */
Room.prototype.getMemoryPath = function(name) {
  const isValid = function(path) {
    return path.fixed || path.created > Game.time - config.path.refresh;
  };

  if (this.data.routing[name] && isValid(this.data.routing[name])) {
    return this.data.routing[name].path;
  }

  if (this.isMy()) {
    if (!this.memory.routing) {
      this.memory.routing = {};
    }
    if (this.memory.routing[name] && isValid(this.memory.routing[name])) {
      this.populatePathToDataFromMemory(name);
      return this.data.routing[name].path;
    }
  }
  return false;
};

/**
 * Cleans memory from all paths
 */
Room.prototype.deleteMemoryPaths = function() {
  delete this.memory.routing;
};

/**
 * Removes the named path from memory
 *
 * @param {String} name - the name of the path
 */
Room.prototype.deleteMemoryPath = function(name) {
  delete this.memory.routing[name];
};

/**
 * Stores the given path under the name in data. If `fixed` is true
 * the path is stored in memory serialized.
 *
 * @param {String} name - the name of the path
 * @param {Array} path - the path itself
 * @param {boolean} perturb - Flag to define if the path should be perturbed
 */
Room.prototype.setMemoryPath = function(name, path, perturb = false) {
  if (perturb) {
    path = Room.perturbPath(path);
  }
  const item = {
    path: path,
    created: Game.time,
    name: name,
  };
  this.data.routing[name] = item;
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
