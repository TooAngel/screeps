'use strict';

/*
 * Memory abstraction layer
 *
 * The methods build the interface to the memory.
 * Currently only for path
 * The idea is to cache paths as roomPosition in a global object.
 * Store paths from my rooms in a compressed form in memory.
 */

Room.prototype.getMemoryPaths = function() {
  this.memory.routing = this.memory.routing || {};
  cache.rooms[this.name] = cache.rooms[this.name] || {};
  cache.rooms[this.name].routing = cache.rooms[this.name].routing || {};
  let memoryKeys = Object.keys(this.memory.routing).sort();
  let cacheKeys = Object.keys(cache.rooms[this.name].routing).sort();
  let diff = _.difference(memoryKeys, cacheKeys);
  for (let item of diff) {
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
      name: this.memory.routing[item].name
    };
  }
  return cache.rooms[this.name].routing;
};

Room.prototype.getMemoryPath = function(name) {
  this.memory.routing = this.memory.routing || {};
  cache.rooms[this.name] = cache.rooms[this.name] || {};
  cache.rooms[this.name].routing = cache.rooms[this.name].routing || {};

  let isValid = function(path) {
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
      name: this.memory.routing[name].name
    };
    return cache.rooms[this.name].routing[name].path;
  }
  return false;
};

Room.prototype.deleteMemoryPaths = function() {
  this.memory.routing = this.memory.routing || {};
  cache.rooms[this.name] = cache.rooms[this.name] || {};
  cache.rooms[this.name].routing = cache.rooms[this.name].routing || {};
  delete cache.rooms[this.name].routing;
  delete this.memory.routing;
};

Room.prototype.deleteMemoryPath = function(name) {
  this.memory.routing = this.memory.routing || {};
  cache.rooms[this.name] = cache.rooms[this.name] || {};
  delete cache.rooms[this.name].routing[name];
  delete this.memory.routing[name];
};

Room.prototype.setMemoryPath = function(name, path, fixed) {
  this.memory.routing = this.memory.routing || {};
  cache.rooms[this.name] = cache.rooms[this.name] || {};
  cache.rooms[this.name].routing = cache.rooms[this.name].routing || {};
  let data = {
    path: path,
    created: Game.time,
    fixed: fixed,
    name: name
  };
  cache.rooms[this.name].routing[name] = data;
  if (fixed) {
    let memoryData = {
      path: Room.pathToString(path),
      created: Game.time,
      fixed: fixed,
      name: name
    };
    this.memory.routing[name] = memoryData;
  }
};
