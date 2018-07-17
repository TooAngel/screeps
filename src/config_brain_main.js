'use strict';

global.cpuUsed = 0;

// room execution via sigmoid function
// all rooms execute every config.main.executeAll ticks
brain.main.roomExecution = function() {
  if (Game.time % config.main.executeAll === 0) {
    Memory.myRooms = _(Game.rooms).filter((r) => r.execute()).map((r) => r.name).value();
  } else {
    /** @see https://github.com/TooAngel/screeps/pull/498#discussion-diff-165847270R92 */
    const roomList = config.main.randomExecution ? _.shuffle(Game.rooms) : Game.rooms;
    global.cpuUsed = Game.cpu.getUsed();
    Memory.myRooms = _(roomList).filter(brain.main.roomFilter).map((r) => r.name).value();
  }
};

brain.main.roomFilter = (r) => {
  global.tickLimit = global.cpuLimit();
  if (Game.cpu.getUsed() < Game.cpu.limit) {
    r.execute();
    if (config.debug.cpu) {
      r.log(`Before: ${global.cpuUsed} After: ${Game.cpu.getUsed()} Diff: ${Game.cpu.getUsed() - global.cpuUsed} limit: ${Game.cpu.limit} tickLimit: ${Game.cpu.tickLimit}`);
    }
  } else {
    Memory.skippedRooms.push(r.name);
  }
  global.cpuUsed = Game.cpu.getUsed();
  return Memory.myRooms.indexOf(r.name) !== -1;
};

brain.main.profilerInit = function() {
  if (config.profiler.enabled) {
    try {
      global.profiler = require('screeps-profiler'); // eslint-disable-line global-require
      for (const role of _.keys(roles)) {
        global.profiler.registerObject(roles[role], 'Role_' + role);
      }
      global.profiler.registerObject(brain, 'Brain');
      global.profiler.enable();
    } catch (e) {
      console.log('screeps-profiler not found');
      config.profiler.enabled = false;
    }
  }
};

brain.main.visualizeRooms = function() {
  if (config.visualizer.enabled) {
    try {
      Memory.myRooms.forEach(visualizer.myRoomDatasDraw);
    } catch (e) {
      console.log('Visualizer Draw Exeception', e);
    }
    try {
      visualizer.render();
      if (config.profiler.enabled) {
        global.profiler.registerObject(visualizer, 'Visualizer');
      }
    } catch (e) {
      console.log('Visualizer Render Exeception', e, e.stack);
    }
  }
};

brain.main.updateSkippedRoomsLog = function() {
  Memory.skippedRoomsLog = Memory.skippedRoomsLog || {};
  if (_.size(Memory.skippedRooms) > 0) {
    console.log(`${Game.time} cpu.getUsed: ${_.round(Game.cpu.getUsed())} ticklimit: ${Game.cpu.tickLimit} Bucket: ${Game.cpu.bucket} skippedRooms ${Memory.skippedRooms}`);
    Memory.skippedRoomsLog[Game.time] = Memory.skippedRooms;
  }
  if (Game.time % 100 === 0) {
    const roomsSkipped = _.sum(_.map(Memory.skippedRoomsLog, _.size));
    console.log(`${Game.time} skipped rooms ${roomsSkipped} in ${_.size(Memory.skippedRoomsLog)} ticks of 100 ticks`);
    const lowExecution = _.size(Memory.skippedRoomsLog) / 100 < config.main.lowExecution;
    if (config.debug.cpu && lowExecution) {
      Game.notify(`${Game.time} skipped rooms ${roomsSkipped} in ${_.size(Memory.skippedRoomsLog)} ticks of 100 ticks`, 120);
    }
    Memory.skippedRoomsLog = {};
  }
};

brain.main.execute = function() {
  if (Game.time > 1000 && Game.cpu.bucket < 2 * Game.cpu.tickLimit && Game.cpu.bucket < Game.cpu.limit * 10) {
    console.log(`${Game.time} Skipping tick CPU Bucket too low. bucket: ${Game.cpu.bucket} tickLimit: ${Game.cpu.tickLimit} limit: ${Game.cpu.limit}`);
    return;
  }

  Memory.time = Game.time;
  try {
    brain.prepareMemory();
    brain.buyPower();
    brain.handleNextroom();
    brain.handleSquadmanager();
    brain.handleIncomingTransactions();
    brain.handleQuests();
  } catch (e) {
    console.log('Brain Exception', e.stack);
  }

  brain.stats.addRoot();
  brain.main.roomExecution();
  if (config.memory.segmentsEnabled) {
    brain.saveMemorySegments();
  }
  brain.main.visualizeRooms();
  brain.main.updateSkippedRoomsLog();
  brain.stats.add(['cpu'], {
    used: Game.cpu.getUsed(),
  });
};
