'use strict';

brain.stats.init = function() {
  const userName = Memory.username;
  if (!config.stats.enabled || !userName) {
    return false;
  }
  Memory.stats = {[userName]: {roles: {}, room: {}}};
  const rolesNames = _(Game.creeps).map((c) => c.memory.role).countBy((r) => {
    return r;
  }).value();
  _.each(rolesNames, (element, index) => {
    Memory.stats[userName].roles[index] = element;
  });

  if (config.cpuStats.enabled) {
    const startCpuWith = {load: global.load, time: Game.time, bucket: Game.cpu.bucket, tickLimit: global.tickLimit};
    Memory.cpuStats = {
      start: startCpuWith,
      last: startCpuWith,
      summary: {maxBucket: Game.cpu.bucket, maxLoad: global.load, minBucket: Game.cpu.bucket, runTime: 0},
    };
  }
};

brain.stats.modifyRoleAmount = function(role, diff) {
  const userName = Memory.username;
  if (!config.stats.enabled || !userName) {
    return false;
  }
  if (Memory.stats && Memory.stats[userName] && Memory.stats[userName].roles) {
    const roleStat = Memory.stats[userName].roles[role];
    const previousAmount = roleStat ? roleStat : 0;
    const amount = (diff < 0 && previousAmount < -diff) ? 0 : previousAmount + diff;
    brain.stats.add(['roles', role], amount);
  } else {
    brain.stats.init();
  }
};

/**
 * stats.add use for push anything into Memory.stats at a given place.
 *
 * @param {Array} path Sub stats path.
 * @param {Any} newContent The value to push into stats.
 * @return {boolean}
 */
brain.stats.add = function(path, newContent) {
  if (!config.stats.enabled || Game.time % 3) {
    return false;
  }

  const userName = Memory.username;
  Memory.stats = Memory.stats || {};
  Memory.stats[userName] = Memory.stats[userName] || {};

  let current = Memory.stats[userName];
  for (const item of path) {
    if (!current[item]) {
      current[item] = {};
    }
    current = current[item];
  }

  _.merge(current, newContent);
  return true;
};

/**
 * stats.addRoot sets the root values, cpu, exec, gcl
 *
 * @return {boolean}
 */
brain.stats.addRoot = function() {
  if (!config.stats.enabled || Game.time % 3) {
    return false;
  }
  brain.stats.add([], {
    cpu: {
      limit: Game.cpu.limit,
      tickLimit: Game.cpu.tickLimit,
      bucket: Game.cpu.bucket,
    },
    exec: {
      halt: Game.cpu.bucket < Game.cpu.tickLimit * 2,
    },
    gcl: {
      level: Game.gcl.level,
      progress: Game.gcl.progress,
      progressTotal: Game.gcl.progressTotal,
    },
  });
  return true;
};

/**
 * stats.addRoom call stats.add with given values and given sub room path.
 *
 * @param {String} roomName The room which from we will save stats.
 * @param {Number} previousCpu
 * @return {boolean}
 */
brain.stats.addRoom = function(roomName, previousCpu) {
  if (!config.stats.enabled || Game.time % 3) {
    return false;
  }

  const room = Game.rooms[roomName];
  if (!room) {
    return false;
  }
  room.memory.upgraderUpgrade = room.memory.upgraderUpgrade || 0;
  brain.stats.add(['room', roomName], {
    energy: {
      available: room.energyAvailable,
      capacity: room.energyCapacityAvailable,
      sources: _.sum(_.map(room.findSources(), 'energy')),
    },
    controller: {
      progress: room.controller.progress,
      preCalcSpeed: room.memory.upgraderUpgrade / (Game.time % 100),
      progressTotal: room.controller.progressTotal,
    },
    creeps: {
      into: room.find(FIND_CREEPS).length,
      queue: room.memory.queue.length,
    },
    cpu: Game.cpu.getUsed() - previousCpu,
  });

  if (room.storage) {
    const storage = room.storage;
    brain.stats.add(['room', roomName, 'storage'], {
      energy: storage.store.energy,
      power: storage.store.power,
    });
  }
  if (room.terminal) {
    const terminal = room.terminal;
    brain.stats.add(['room', roomName, 'terminal'], {
      energy: terminal.store.energy,
      minerals: _.sum(terminal.store) - terminal.store.energy,
    });
  }
  return true;
};

brain.stats.updateCpuStats = function() {
  if (config.cpuStats.enabled) {
    Memory.cpuStats.last = {
      load: _.round(Game.cpu.getUsed()),
      time: Game.time,
      bucket: Game.cpu.bucket,
      tickLimit: global.cpuLimit(),
    };
    Memory.cpuStats.summary = {
      maxBucket: Math.max(Memory.cpuStats.summary.maxBucket, Memory.cpuStats.last.bucket),
      maxLoad: Math.max(Memory.cpuStats.summary.maxLoad, Memory.cpuStats.last.load),
      minBucket: Math.min(Memory.cpuStats.summary.minBucket, Memory.cpuStats.last.bucket),
      runTime: Memory.cpuStats.last.time - Memory.cpuStats.start.time,
    };
  }
};
