'use strict';
// room execution via sigmoid function
// all rooms execute every config.main.executeAll ticks
brain.main.roomExecution = function() {
  if (Game.time % config.main.executeAll === 0) {
    Memory.myRooms = _(Game.rooms).filter((r) => r.execute()).map((r) => r.name).value();
  } else {
    /** @see https://github.com/TooAngel/screeps/pull/498#discussion-diff-165847270R92 */
    const roomList = config.main.randomExecution ? _.shuffle(Game.rooms) : Game.rooms;
    Memory.myRooms = _(roomList).filter(brain.main.roomFilter).map((r) => r.name).value();
  }
};

brain.main.roomFilter = (r) => {
  global.tickLimit = global.cpuLimit();
  if (Game.cpu.getUsed() < global.tickLimit) {
    r.execute();
  } else {
    Memory.skippedRooms.push(r.name);
  }
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

brain.main.execute = function() {
  if (Game.time % 200 === 0) {
    console.log(Game.time, 'TooAngel AI - All good');
    console.log(Game.time, 'cpu limit per tick', global.tickLimit);
  }
  if (Game.time > 1000 && Game.cpu.bucket < 2 * Game.cpu.tickLimit && Game.cpu.bucket < Game.cpu.limit * 10) {
    console.log(Game.time, 'Skipping tick CPU Bucket too low.',
      'Load: ' + global.load, 'Bucket: ' + Game.cpu.bucket);
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
    console.log('Brain Exeception', e, e.stack);
  }

  brain.stats.addRoot();
  brain.main.roomExecution();
  brain.saveMemorySegments();
  brain.main.visualizeRooms();
  Memory.skippedRoomsLog = Memory.skippedRoomsLog || {};
  if (_.size(Memory.skippedRooms)) {
    console.log(Game.time, 'Load:', _.round(Game.cpu.getUsed()), '/', global.tickLimit, 'Bucket:', Game.cpu.bucket, 'skippedRooms', Memory.skippedRooms);
    Memory.skippedRoomsLog[Game.time] = Memory.skippedRooms;
  }
  if (Game.time % 100 === 0) {
    const roomsSkipped = _.sum(_.map(Memory.skippedRoomsLog, _.size));
    console.log(Game.time, `skipped rooms ${roomsSkipped} in ${_.size(Memory.skippedRoomsLog)} ticks of 100 ticks`);
    Memory.skippedRoomsLog = {};
  }

  brain.stats.add(['cpu'], {
    used: Game.cpu.getUsed(),
  });
};
