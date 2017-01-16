'use strict';

/**
 * stats.add use for push anything into Memory.stats at a given place.
 *
 * @param {String} roomName Room name or '' if out of  Stats[Player].rooms .
 * @param {String} path Sub Stats[Player]/Stats[Player].room[Room] ids.
 * @param {Any} newContent The value to push into stats.
 *
 */

brain.stats.add = function(roomName, path, newContent) {
  if (!config.stats.enabled || Game.time % 3) {
    return false;
  }

  var name = Memory.username || Game.rooms[roomName].controller.owner;
  Memory.username = name;
  if (!Memory.stats[name].room[roomName]) {
    Memory.stats[name].room[roomName] = {};
  }
  if (!Memory.stats[name].room[roomName + path]) {
    Memory.stats[name].room[roomName + path] = {};
  }
  if (newContent && roomName) {
    if (!Memory.stats[name].room[roomName]) {
      Memory.stats[name].room[roomName] = {};
    }
    Memory.stats[name].room[roomName + path] = _.merge(Memory.stats[name].room[roomName + path], newContent);

    /**
     * let existContent = Memory.stats[name].room[roomName + path];
     * Memory.stats[name].room[roomName + path] = existContent ? _.concat(existContent,newContent) : newContent
     */
  } else if (newContent) {
    Memory.stats[name + path] = _.merge(Memory.stats[name + path], newContent);
    /**
     * let existContent = Memory.stats[name + path];
     * Memory.stats[name + path] = existContent ? _.concat(existContent,newContent) : newContent;
     */
  }
  return true;
};
/**
 * stats.addPlayer call stats.add with given values at given sub player path.
 *
 */
brain.stats.addRoot = function() {
  if (!config.stats.enabled || Game.time % 3) {
    return false;
  }
  brain.stats.add('', '', {
    cpu: {
      limit: Game.cpu.limit,
      tickLimit: Game.cpu.tickLimit,
      bucket: Game.cpu.bucket
    },
    exec: {
      halt: Game.cpu.bucket < Game.cpu.tickLimit * 2
    },
    gcl: {
      level: Game.gcl.level,
      progress: Game.gcl.progress,
      progressTotal: Game.gcl.progressTotal
    }
  });
  return true;
};

/**
 * stats.addRoom call stats.add with given values and given sub room path.
 *
 * @param {String} roomName The room which from we will save stats.
 *
 */
brain.stats.addRoom = function(roomName, previousCpu) {
  if (!config.stats.enabled || Game.time % 3) {
    return false;
  }

  let room = Game.rooms[roomName];
  if (!room) {
    return false;
  }

  if (room.memory.upgraderUpgrade === undefined) {
    room.memory.upgraderUpgrade = 0;
  }
  brain.stats.add(roomName, '', {
    energy: {
      available: room.energyAvailable,
      capacity: room.energyCapacityAvailable,
      sources: _.sum(_.map(room.find(FIND_SOURCES), 'energy'))
    },
    constroller: {
      progress: room.controller.progress,
      preCalcSpeed: room.memory.upgraderUpgrade / (Game.time % 100),
      progressTotal: room.controller.progressTotal
    },
    creeps: {
      into: room.find(FIND_CREEPS).length,
      queue: room.memory.queue.length
    },
    cpu: Game.cpu.getUsed() - previousCpu
  });

  if (room.storage) {
    let storage = room.storage;
    brain.stats.add(roomName, '.storage', {
      energy: storage.store.energy,
      power: storage.store.power
    });
  }
  if (room.terminal) {
    let terminal = room.terminal;
    brain.stats.add(roomName, '.terminal', {
      energy: terminal.store.energy,
      minerals: _.sum(terminal.store) - terminal.store.energy
    });
  }
  return true;
};
brain.stats.init = function() {
  var name = Memory.username || _.find(Game.spawns, 'my').owner;
  Memory.stats = {
    [name]: {
      roles: {},
      room: {}
    }
  };
  let rolesNames = _(Game.creeps).map(c => c.memory.role).countBy(function(r) { return r; }).value();
  _.forEach(rolesNames, function(element, index) {
    Memory.stats[name].roles[index] = element;
  });
};
