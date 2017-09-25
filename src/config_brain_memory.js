'use strict';

brain.setMarketOrders = function() {
  Memory.orders = {};
  Memory.orders[ORDER_BUY] = {};
  Memory.orders[ORDER_SELL] = {};
  for (const order of Game.market.getAllOrders()) {
    if (order.resourceType === SUBSCRIPTION_TOKEN || Memory.myRooms.includes(order.roomName)) {
      continue;
    }
    let category = Memory.orders[order.type][order.resourceType];
    if (!category) {
      Memory.orders[order.type][order.resourceType] = category = {
        min: order.price,
        max: order.price,
        totalPrice: 0,
        totalAmount: 0,
        orders: [],
      };
    }
    category.min = Math.min(category.min, order.price);
    category.max = Math.max(category.max, order.price);
    category.totalPrice += order.price * order.remainingAmount;
    category.totalAmount += order.remainingAmount;
    category.orders.push(order);
  }
};

brain.getMarketOrderAverage = (type, resource) => Memory.orders[type][resource] && Memory.orders[type][resource].totalPrice ? Memory.orders[type][resource].totalPrice / Memory.orders[type][resource].totalAmount : null;

brain.getMarketOrder = (type, resource, property) => Memory.orders[type][resource] && Memory.orders[type][resource][property] ? Memory.orders[type][resource][property] : null;

brain.setConstructionSites = function() {
  if (!Memory.constructionSites) {
    Memory.constructionSites = {};
  }

  if (Game.time % config.constructionSite.maxIdleTime === 0) {
    const constructionSites = {};
    for (const csId of Object.keys(Game.constructionSites)) {
      const cs = Game.constructionSites[csId];
      const csMem = Memory.constructionSites[csId];
      if (csMem) {
        if (csMem === cs.progress) {
          console.log(csId + ' constructionSite too old');
          const csObject = Game.getObjectById(csId);
          const returnCode = csObject.remove();
          console.log('Delete constructionSite: ' + returnCode);
          continue;
        }
      }
      constructionSites[csId] = cs.progress;
    }
    Memory.constructionSites = constructionSites;
    console.log('Known constructionSites: ' + Object.keys(constructionSites).length);
  }
};

brain.addToStats = function(name) {
  const role = Memory.creeps[name].role;
  brain.stats.modifyRoleAmount(role, -1);
};

brain.handleUnexpectedDeadCreeps = function(name, creepMemory) {
  console.log(name, 'Not in Game.creeps', Game.time - creepMemory.born, Memory.creeps[name].base);
  if (Game.time - creepMemory.born < 20) {
    return;
  }

  if (!creepMemory.role) {
    delete Memory.creeps[name];
    return;
  }

  const unit = roles[creepMemory.role];
  if (!unit) {
    delete Memory.creeps[name];
    return;
  }
  if (unit.died) {
    if (unit.died(name, creepMemory)) {
      delete Memory.creeps[name];
    }
  } else {
    delete Memory.creeps[name];
  }
};

brain.cleanCreeps = function() {
  // Cleanup memory
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      brain.addToStats(name);
      if ((name.startsWith('reserver') && Memory.creeps[name].born < (Game.time - CREEP_CLAIM_LIFE_TIME)) || Memory.creeps[name].born < (Game.time - CREEP_LIFE_TIME)) {
        delete Memory.creeps[name];
        continue;
      }

      const creepMemory = Memory.creeps[name];
      if (creepMemory.killed) {
        delete Memory.creeps[name];
        continue;
      }

      brain.handleUnexpectedDeadCreeps(name, creepMemory);
    }
  }
};

brain.cleanSquads = function() {
  if (Game.time % 1500 === 0) {
    for (const squadId of Object.keys(Memory.squads)) {
      const squad = Memory.squads[squadId];
      if (Game.time - squad.born > 3000) {
        console.log(`Delete squad ${squadId}`);
        delete Memory.squads[squadId];
      }
    }
  }
};

brain.cleanRooms = function() {
  if (Game.time % 300 === 0) {
    for (const name of Object.keys(Memory.rooms)) {
      // Check for reserved rooms
      if (!Memory.rooms[name].lastSeen) {
        console.log('Deleting ' + name + ' from memory no `last_seen` value');
        delete Memory.rooms[name];
        continue;
      }
      if (Memory.rooms[name].lastSeen < Game.time - config.room.lastSeenThreshold) {
        console.log(`Deleting ${name} from memory older than ${config.room.lastSeenThreshold}`);
        delete Memory.rooms[name];
      }
    }
  }
};

brain.getStorageStringForRoom = function(strings, room, interval) {
  const addToString = function(variable, name, value) {
    strings[variable] += name + ':' + value + ' ';
  };

  if (room.storage.store[RESOURCE_ENERGY] < 200000) {
    addToString('storageLowString', room.name, room.storage.store[RESOURCE_ENERGY]);
  } else if (room.storage.store[RESOURCE_ENERGY] > 800000) {
    addToString('storageHighString', room.name, room.storage.store[RESOURCE_ENERGY]);
  } else {
    addToString('storageMiddleString', room.name, room.storage.store[RESOURCE_ENERGY]);
  }
  if (room.storage.store[RESOURCE_POWER] && room.storage.store[RESOURCE_POWER] > 0) {
    addToString('storagePower', room.name, room.storage.store[RESOURCE_POWER]);
  }
  // TODO 15 it should be
  if (Math.ceil(room.memory.upgraderUpgrade / interval) < 15) {
    addToString('upgradeLess', room.name, room.memory.upgraderUpgrade / interval);
  }
  room.memory.upgraderUpgrade = 0;
};

brain.printSummary = function() {
  const interval = 100;
  if (Game.time % interval !== 0) {
    return;
  }
  const diff = Game.gcl.progress - Memory.progress;
  Memory.progress = Game.gcl.progress;

  const strings = {
    storageNoString: '',
    storageLowString: '',
    storageMiddleString: '',
    storageHighString: '',
    storagePower: '',
    upgradeLess: '',
  };
  for (const name of Memory.myRooms) {
    const room = Game.rooms[name];
    if (!room || !room.storage) {
      strings.storageNoString += name + ' ';
      if (room) {
        room.memory.upgraderUpgrade = 0;
      }
      continue;
    }
    brain.getStorageStringForRoom(strings, room, interval);
  }
  Memory.summary = strings;

  console.log(`=========================
Progress: ${diff / interval}/${Memory.myRooms.length * 15}
ConstructionSites: ${Object.keys(Memory.constructionSites).length}
-------------------------
No storage: ${strings.storageNoString}
Low storage: ${strings.storageLowString}
Middle storage: ${strings.storageMiddleString}
High storage: ${strings.storageHighString}
-------------------------
Power storage: ${strings.storagePower}
-------------------------
Upgrade less: ${strings.upgradeLess}
=========================`);
};

brain.prepareMemory = function() {
  Memory.username = Memory.username || _.chain(Game.rooms).map('controller').flatten().filter('my').map('owner.username').first().value();
  Memory.myRooms = Memory.myRooms || [];
  Memory.squads = Memory.squads || {};
  brain.setMarketOrders();
  brain.setConstructionSites();
  brain.cleanCreeps();
  brain.cleanSquads();
  brain.cleanRooms();
  if (config.stats.summary) {
    brain.printSummary();
  }
};

/**
 * Local cache of segment number, so we will save all new objects from same tick into same segment
 * @type {object}
 */
const currentSegment = {};

/**
 * Get next memory segment id to use. This function guaranties to return the same segment id during tick.
 *
 * @return {number} Segment id
 */
brain.getNextSegmentId = function() {
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
 */
brain.MemorySegmentError = class MemorySegmentError extends Error {
  constructor(message) {
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
    throw new brain.MemorySegmentError();
  }
  return true;
};

/**
 * Mark segment as changed. All changed objects should already be saved in
 *
 * @param {number} id Segment id
 */
brain.setSegment = function(id) {
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
  const segment = brain.getSegment(id);
  return Object.keys(segment);
};

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
 * Get object from memory segment. Type of object to choose deserialization function is taken from segment.
 * Object is returned from cache when possible
 *
 * @param {number} id Segment id
 * @param {string} key Key of object stored in memory segment
 * @return {object} Parsed object
 * @throws {MemorySegmentError}
 */
brain.getSegmentObject = function(id, key) {
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
