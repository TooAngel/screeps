'use strict';
// room execution via sigmoid function
// all rooms execute every config.main.executeAll ticks
brain.main.roomExecution = function() {
  if (Game.time % config.main.executeAll === 0) {
    Memory.myRooms = _(Game.rooms).filter((r) => r.execute()).map((r) => r.name).value();
  } else {
    /** @see https://github.com/TooAngel/screeps/pull/498#discussion-diff-165847270R92 */
    if (config.main.randomExecution) {
      Memory.myRooms = _(_.shuffle(Game.rooms)).filter(brain.main.roomFilter).map((r) => r.name).value();
    } else {
      Memory.myRooms = _(Game.rooms).filter(brain.main.roomFilter).map((r) => r.name).value();
    }
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
    } catch (e) {
      console.log('Visualizer Render Exeception', e, e.stack);
    }
  }
};

brain.main.execute = function() {
  Memory.skippedRooms = [];
  brain.buyPower();

  if (Game.time % 200 === 0) {
    console.log(Game.time, 'TooAngel AI - All good');
    console.log(Game.time, 'cpu limit per tick', global.tickLimit);
  }
  if (Game.cpu.bucket < 2 * Game.cpu.tickLimit && Game.cpu.bucket < Game.cpu.limit * 10) {
    console.log(Game.time, 'Skipping tick CPU Bucket too low.',
      'Load: ' + global.load, 'Bucket: ' + Game.cpu.bucket);
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
  brain.main.roomExecution();
  if (config.profiler.enabled && config.visualizer.enabled) {
    global.profiler.registerObject(visualizer, 'Visualizer');
  }

  brain.saveMemorySegments();
  brain.main.visualizeRooms();
  if (Memory.skippedRooms.length > 0) {
    console.log(Game.time, 'Load:', _.round(Game.cpu.getUsed()), '/', global.tickLimit, 'Bucket:', Game.cpu.bucket, 'skippedRooms', Memory.skippedRooms);
  }

  brain.stats.add(['cpu'], {
    used: Game.cpu.getUsed(),
  });
};
