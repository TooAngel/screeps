'use strict';

/**
 * Local cache of segment number, so we will save all new objects from same tick into same segment
 * @type {object}
 */
const currentSegment = {};

/**
 * List of types with different serialization/deserialization behavior
 *
 * @type {object}
 */
const types = {
  object: {
    stringify: (o) => JSON.stringify(o),
    parse: (s) => JSON.parse(s),
  },
  costmatrix: {
    stringify: (o) => JSON.stringify(o.serialize()),
    parse: (s) => PathFinder.CostMatrix.deserialize(JSON.parse(s)),
  },
  path: {
    stringify: (o) => Room.serializePath(o),
    parse: (s) => Room.deserializePath(s),
  },
};

/**
 * Get next memory segment id to use. This function guaranties to return the same segment id during tick.
 *
 * @return {number} Segment id
 */
brain.getNextSegmentId = function() {
  console.log('getNextSegmentId', new Error().stack);
  if (currentSegment.time !== Game.time || currentSegment.segment === undefined) {
    currentSegment.time = Game.time;
    currentSegment.segment = Math.floor(Math.random() * config.memory.segments);
  }
  return currentSegment.segment;
};

/**
 * Exception to indicate that we need unloaded segment, so we should skip this tick to wait until it will be avilable.
 *
 * @type {MemorySegmentError}
 **/
brain.MemorySegmentError = class MemorySegmentError extends Error {
  /**
   * MemorySegmentError constructor
   *
   * @param {object} message - The message
   **/
  constructor(message) {
    console.log('MemorySegmentError', new Error().stack);
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
};

/**
 * Prepare and initialize memory and cache object to work with provided memory segment.
 *
 * @param {number} id Segment id
 */
brain.prepareSegmentMemory = function(id) {
  console.log('prepareSegmentMemory', new Error().stack);
  if (!Memory.segments) {
    Memory.segments = {};
  }
  if (!Memory.segments[id]) {
    Memory.segments[id] = {};
  }
  if (!cache.segments[id]) {
    cache.segments[id] = {
      objects: {},
      value: {},
      lastParsedTick: 0,
    };
  }
};

/**
 * Prepare and initialize memory and cache object to work with provided object in provided memory segment.
 *
 * @param {number} id Segment id
 * @param {string} key Object id
 */
brain.prepareSegmentObjectMemory = function(id, key) {
  console.log('prepareSegmentObjectMemory', new Error().stack);
  const segment = brain.getSegment(id);
  if (!segment[key]) {
    segment[key] = {};
  }
  if (!cache.segments[id].objects[key]) {
    cache.segments[id].objects[key] = {
      lastParsedTick: 0,
    };
  }
};

/**
 * Checks if segment is active. If it isn't, unload least used segment, request checked one and throws MemorySegmentError to skip tick
 *
 * @param {number} id Segment id
 * @param {boolean} noThrow Do not throw, just return true
 * @return {boolean} Is active
 * @throws {MemorySegmentError}
 */
brain.checkSegmentActive = function(id, noThrow = false) {
  console.log('checkSegmentActive', new Error().stack);
  Memory.segments[id].lastAccessedTick = Game.time;
  if (RawMemory.segments[id] === undefined) {
    if (currentSegment.time !== Game.time || currentSegment.request === undefined) {
      currentSegment.time = Game.time;
      currentSegment.request = new Set(Object.keys(RawMemory.segments));
    }
    const ids = currentSegment.request;
    const oldestSegmentId = _.min(Array.from(ids), (id) => Memory.segments[id] ? Memory.segments[id].lastAccessedTick : 0);
    if (oldestSegmentId) {
      ids.delete(oldestSegmentId);
    }
    ids.add(id);
    for (let i = 0; i < config.memory.segments && ids.size < 10; ++i) {
      ids.add(i);
    }
    RawMemory.setActiveSegments(Array.from(ids));
    if (noThrow) {
      return false;
    }
    throw new brain.MemorySegmentError('#' + id);
  }
  return true;
};

/**
 * Mark segment as changed. All changed objects should already be saved in
 *
 * @param {number} id Segment id
 */
brain.setSegment = function(id) {
  console.log('setSegment', new Error().stack);
  cache.segments[id].lastParsedTick = Game.time;
  Memory.segments[id].lastModifiedTick = Game.time;
};

/**
 * Returns parsed memory segment object. Returns it from global cache when possible.
 * Throws MemorySegmentError if cache isn't valid and segment isn't active
 *
 * @param {number} id Segment id
 * @return {object} Parsed memory segment object
 * @throws {MemorySegmentError}
 */
brain.getSegment = function(id) {
  console.log('getSegment', new Error().stack);
  brain.prepareSegmentMemory(id);
  Memory.segments[id].lastAccessedTick = Game.time;
  if (Memory.segments[id].lastModifiedTick > cache.segments[id].lastParsedTick) {
    brain.checkSegmentActive(id);
    cache.segments[id].lastParsedTick = Game.time;
    cache.segments[id].value = RawMemory.segments[id] ? JSON.parse(RawMemory.segments[id]) : {};
  }
  return cache.segments[id].value;
};

/**
 * Get list of all keys stored in segment
 *
 * @param {number} id Segment id
 * @return {string[]} List of keys
 */
brain.getSegmentKeys = function(id) {
  console.log('getSegmentKeys', new Error().stack);
  const segment = brain.getSegment(id);
  return Object.keys(segment);
};

/**
 * Get object from memory segment. Type of object to choose deserialization function is taken from segment.
 * Object is returned from cache when possible
 *
 * @param {number} id Segment id
 * @param {string} key Key of object stored in memory segment
 * @return {object} Parsed object
 * @throws {MemorySegmentError}
 */
brain.getSegmentObject = function(id, key) {
  console.log('getSegmentObject', new Error().stack);
  brain.prepareSegmentObjectMemory(id, key);
  const segment = brain.getSegment(id);
  if (segment[key].lastModifiedTick > cache.segments[id].objects[key].lastParsedTick) {
    cache.segments[id].objects[key].lastParsedTick = Game.time;
    cache.segments[id].objects[key].value = types[segment[key].type].parse(segment[key].value);
  }
  return cache.segments[id].objects[key].value;
};

/**
 * Save object into cache and set memory segment as modified.
 * This function doesn't actually saves data into memory segment. you must call `saveMemorySegments` at end of tick.
 * Throws MemorySegmentError if segment isn't active
 *
 * @param {number} id Segment id
 * @param {string} key Key of object stored in memory segment
 * @param {object} object Object to save in memory segment
 * @param {string} type Type of object. Selects serialization/deserialization behavior
 * @throws {MemorySegmentError}
 */
brain.setSegmentObject = function(id, key, object, type = 'object') {
  console.log('setSegmentObject', new Error().stack);
  brain.prepareSegmentObjectMemory(id, key);
  const segment = brain.getSegment(id);
  brain.checkSegmentActive(id);
  cache.segments[id].objects[key].lastParsedTick = Game.time;
  cache.segments[id].objects[key].value = object;
  segment[key].lastModifiedTick = Game.time;
  segment[key].type = type;
  brain.setSegment(id);
};

/**
 * Removes object by key from memory segment and from its cache.
 *
 * @param {number} id Segment id
 * @param {string} key Key of object stored in memory segment
 */
brain.removeSegmentObject = function(id, key) {
  console.log('removeSegmentObject', new Error().stack);
  const segment = brain.getSegment(id);
  brain.checkSegmentActive(id);
  delete cache.segments[id].objects[key];
  delete segment[key];
  brain.setSegment(id);
};

/**
 * Deserialize all objects and save all memory segments modified in current tick.
 * This function should be called once on the end of each tick.
 */
brain.saveMemorySegments = function() {
  if (!config.memory.segmentsEnabled) {
    return;
  }
  console.log('saveMemorySegments', new Error().stack);
  for (const id of Object.keys(Memory.segments)) {
    if (Memory.segments[id].lastModifiedTick === Game.time) {
      const segment = brain.getSegment(id);
      for (const key of Object.keys(segment)) {
        if (segment[key].lastModifiedTick === Game.time) {
          const object = brain.getSegmentObject(id, key);
          segment[key].value = types[segment[key].type].stringify(object);
        }
      }
      RawMemory.segments[id] = JSON.stringify(segment);
      Memory.segments[id].length = RawMemory.segments[id].length;
    }
  }
};

brain.segmentsStats = function() {
  for (let i = 0; i < 100; i++) {
    if (RawMemory.segments[i] === undefined) {
      continue;
    }
    console.log(`${i} ${RawMemory.segments[i].length}`);
  }
};
