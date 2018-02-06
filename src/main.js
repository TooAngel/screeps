'use strict';

require('require');
require('prototype_creep_startup_tasks');
require('prototype_creep_move');
require('prototype_roomPosition');
require('prototype_room_init');
require('prototype_room_costmatrix');
require('visualizer');
require('screepsplus');

global.tickLimit = global.cpuLimit();
global.load = _.round(Game.cpu.getUsed());

if (config.cpuStats.enable) {
  Memory.cpuStats = {
    start: {
      load: global.load,
      time: Game.time,
      bucket: Game.cpu.bucket,
      tickLimit: global.tickLimit,
    },
    last: {
      load: global.load,
      time: Game.time,
      bucket: Game.cpu.bucket,
      tickLimit: global.tickLimit,
    },
    summary: {
      maxBucket: Game.cpu.bucket,
      maxLoad: global.load,
      minBucket: Game.cpu.bucket,
      runTime: 0,
    },
  };
}

console.log(Game.time, 'no cache', 'L: ' + global.load, 'B: ' + Game.cpu.bucket);

brain.stats.init();

let profiler;
if (config.profiler.enabled) {
  try {
    profiler = require('screeps-profiler'); // eslint-disable-line global-require
    for (const role of _.keys(roles)) {
      profiler.registerObject(roles[role], 'Role_' + role);
    }
    profiler.registerObject(brain, 'Brain');
    profiler.enable();
  } catch (e) {
    console.log('screeps-profiler not found');
    config.profiler.enabled = false;
  }
}

const roomFilter = (r) => {
  global.tickLimit = global.cpuLimit();
  if (Game.cpu.getUsed() < global.tickLimit) {
    r.execute();
  } else {
    Memory.skippedRooms.push(r.name);
  }
  return Memory.myRooms.indexOf(r.name) !== -1;
};

const main = function() {
  Memory.skippedRooms = [];
  brain.buyPower();

  if (Game.time % 200 === 0) {
    console.log(Game.time, 'TooAngel AI - All good');
    console.log(Game.time, 'cpu limit per tick', global.tickLimit);
  }
  if (Game.cpu.bucket < 2 * Game.cpu.tickLimit && Game.cpu.bucket < Game.cpu.limit * 10) {
    console.log(Game.time, 'Skipping tick CPU Bucket too low.',
      'L:', _.round(Game.cpu.getUsed()), 'B:', Game.cpu.bucket);
    return;
  }
  Memory.time = Game.time;
  try {
    brain.prepareMemory();
    brain.handleNextroom();
    brain.handleSquadmanager();
    brain.handleIncomingTransactions();
    brain.handleQuests();
  } catch (e) {
    console.log('Brain Exeception', e);
  }

  brain.stats.addRoot();
  // room execution via sigmoid function + every 10 ticks execute all rooms
  if (Game.time % 10 === 0) {
    Memory.myRooms = _(Game.rooms).filter((r) => r.execute()).map((r) => r.name).value();
  } else {
    /** @see https://github.com/TooAngel/screeps/pull/498#discussion-diff-165847270R92 */
    if (config.main.randomExecution) {
      Memory.myRooms = _(_.shuffle(Game.rooms)).filter(roomFilter).map((r) => r.name).value();
    } else {
      Memory.myRooms = _(Game.rooms).filter(roomFilter).map((r) => r.name).value();
    }
  }

  if (config.profiler.enabled && config.visualizer.enabled) {
    profiler.registerObject(visualizer, 'Visualizer');
  }

  brain.saveMemorySegments();
  if (config.visualizer.enabled) {
    try {
      Memory.myRooms.forEach(visualizer.myRoomDatasDraw);
    } catch (e) {
      console.log('Visualizer Draw Exeception', e);
    }
    try {
      visualizer.render();
    } catch (e) {
      console.log('Visualizer Render Exeception', e, e.stack);
    }
  }
  if (Memory.skippedRooms.length > 0) {
    console.log(Game.time, 'skippedRooms', Memory.skippedRooms);
  }

  brain.stats.add(['cpu'], {
    used: Game.cpu.getUsed(),
  });
};

module.exports.loop = function() {
  if (config.main.enabled) {
    if (config.profiler.enabled) {
      profiler.wrap(() => {
        main();
      });
    } else {
      main();
    }
  }

  if (config.cpuStats.enable) {
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
