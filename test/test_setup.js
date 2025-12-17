/**
 * Shared test setup for all test files.
 * This file sets up global mocks and loads the main module once.
 * All test files should require this instead of setting up globals themselves.
 */

// Only run setup once (check if already initialized)
if (!global._testSetupComplete) {
  const variables = require('@screeps/common/lib/constants'); // eslint-disable-line global-require

  for (const variableName of Object.keys(variables)) {
    global[variableName] = variables[variableName];
  }

  global.Room = function(name, energyAvailable) {
    this.name = name;
    this.energyAvailable = energyAvailable;
    this.energyCapacityAvailable = energyAvailable;
    this.memory = {
      energyStats: {},
      active: true,
    };
    this.controller = {
      level: 1,
    };
    this.debugLog = () => {};
    this.find = () => [];
  };
  global.RoomObject = function() {};
  global.RoomPosition = function(x, y, roomName) {
    this.x = x;
    this.y = y;
    this.roomName = roomName;
  };
  global.Creep = function(role) {
    this.role = role;
  };
  global.Structure = function() {};
  global.StructureController = function() {};
  global.StructureStorage = function() {};
  global._ = require('lodash'); // eslint-disable-line global-require
  global.Game = new function() {
    this.time = 1;
    this.cpu = {
      getUsed: () => {},
    };
    this.gcl = {
      level: 10,
    };
  };
  global.Memory = new function() {};

  require('../src/main'); // eslint-disable-line global-require

  global._testSetupComplete = true;
}

/**
 * Creates a mock storage using StructureStorage prototype
 * @param {object} options - Configuration options
 * @return {object} Storage object with proper prototype
 */
function createStorage(options = {}) {
  const storage = Object.create(StructureStorage.prototype);
  storage.my = options.my !== undefined ? options.my : true;
  storage.pos = {x: 25, y: 26, roomName: options.roomName || 'W1N1'};
  storage.store = {
    energy: options.energy !== undefined ? options.energy : 100000,
  };
  return storage;
}

/**
 * Creates a mock room with proper prototype chain
 * @param {object} options - Configuration options
 * @return {object} Room object
 */
function createRoom(options = {}) {
  const energyCapacity = options.energyCapacityAvailable || 5000;
  const room = new Room(options.name || 'W1N1', energyCapacity);
  room.energyCapacityAvailable = energyCapacity;
  room.memory.misplacedSpawn = options.misplacedSpawn || false;
  room.memory.active = options.active !== undefined ? options.active : true;

  if (options.hasStorage !== false) {
    room.storage = createStorage({
      my: options.storageMy,
      energy: options.storageEnergy,
      roomName: room.name,
    });
  }

  return room;
}

/**
 * Creates a mock creep for testing
 * @param {object} options - Configuration options
 * @return {object} Mock creep object
 */
function createCreep(options = {}) {
  const room = options.room || createRoom();
  return {
    name: options.name || 'test-creep',
    room: room,
    pos: {
      x: options.x || 25,
      y: options.y || 25,
      roomName: room.name,
      getRangeTo: options.getRangeTo || (() => 5),
    },
    store: {
      energy: options.energy || 0,
    },
    withdraw: options.withdraw || (() => OK),
    moveToMy: options.moveToMy || (() => OK),
  };
}

module.exports = {
  createStorage,
  createRoom,
  createCreep,
};
