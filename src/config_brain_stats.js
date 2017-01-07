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
  if (!config.stats.enabled) {
    return false;
  }
  if (!Memory.stats) { Memory.stats = {}; }
  var name = Memory.username || Game.rooms[roomName].controller.owner || 'default';
  Memory.username = name;
  if (newContent && roomName) {
    if (!Memory.stats[name].room) { Memory.stats[name].room = {}; }
    Memory.stats[name].room[roomName + path] = newContent;

    /**
    * let existContent = Memory.stats[name].room[roomName + path];
    * Memory.stats[name].room[roomName + path] = existContent ? _.concat(existContent,newContent) : newContent
    */

  } else if (newContent) {
    Memory.stats[name + path] = newContent;
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
  if (!config.stats.enabled) {
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
    },
    rooms: {
      available: Game.rooms.length
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
brain.stats.addRoom = function(roomName) {
  if (!config.stats.enabled) {return false;}

  let room = Game.rooms[roomName];
  if (!room) {return false;}

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
    cpu: Game.cpu.getUsed()
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
