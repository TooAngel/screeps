'use strict';

const {checkPlayers} = require('./diplomacy');
const {handleQuests} = require('./quests_host');
const {prepareMemory} = require('./brain_memory');
const {handleSquadManager} = require('./brain_squadmanager');

global.cpuUsed = 0;

/**
 * leftPadRound
 *
 * String with fixed width for rounded number
 * @param {number} nr
 * @param {number} lpad
 * @param {number} digest
 * @return {string}
 */
function leftPadRound(nr, lpad, digest) {
  return nr.toFixed(digest).padStart(lpad + digest + 1);
}

/**
 * executeRooms
 *
 * Executes all rooms and stores controlled rooms in `Memory.myRooms'
 */
function executeRooms() {
  Memory.myRooms = _(Game.rooms).filter((r) => r.execute()).map((r) => r.name).value();
}

module.exports.cleanUpDyingCreep = function(name) {
  delete Memory.creeps[name];
};

module.exports.initProfiler = function() {
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

/**
 * visualizeRooms
 *
 * Renders the visualizer
 */
function visualizeRooms() {
  if (config.visualizer.enabled) {
    try {
      Memory.myRooms.forEach(visualizer.myRoomDataDraw);
    } catch (e) {
      console.log(`Visualizer Draw Exception exception: ${e} stack ${e.stack}`);
    }
    try {
      visualizer.render();
    } catch (e) {
      console.log('Visualizer Render Exception', e, e.stack);
    }
  }
}

/**
 * updateSkippedRoomsLog
 *
 * Logs and stores skipped rooms
 */
function updateSkippedRoomsLog() {
  Memory.skippedRoomsLog = Memory.skippedRoomsLog || {};
  if (_.size(Memory.skippedRooms) > 0) {
    console.log(`${Game.time} cpu.getUsed: ${_.round(Game.cpu.getUsed())} tickLimit: ${Game.cpu.tickLimit} Bucket: ${Game.cpu.bucket} skippedRooms ${Memory.skippedRooms}`);
    Memory.skippedRoomsLog[Game.time] = Memory.skippedRooms;
  }
  if (Game.time % 100 === 0) {
    const roomsSkipped = _.sum(_.map(Memory.skippedRoomsLog, _.size));
    const lowExecution = _.size(Memory.skippedRoomsLog) / 100 < config.main.lowExecution;
    if (config.debug.cpu && lowExecution) {
      Game.notify(`${Game.time} skipped rooms ${roomsSkipped} in ${_.size(Memory.skippedRoomsLog)} ticks of 100 ticks`, 120);
    }
    Memory.skippedRoomsLog = {};
  }
}

module.exports.execute = function() {
  if (Game.time > 1000 && Game.cpu.bucket < 1.5 * Game.cpu.tickLimit && Game.cpu.bucket < Game.cpu.limit * 10) {
    console.log(`${Game.time} Skipping tick CPU Bucket too low. bucket: ${Game.cpu.bucket} tickLimit: ${Game.cpu.tickLimit} limit: ${Game.cpu.limit}`);
    return;
  }
  Memory.time = Game.time;
  try {
    prepareMemory();
    brain.buyPower();
    brain.handleNextroomer();
    handleSquadManager();
    brain.handleIncomingTransactions();
    handleQuests();
    checkPlayers();
  } catch (e) {
    console.log('Brain Exception', e.stack);
  }

  brain.stats.addRoot();
  executeRooms();
  visualizeRooms();
  updateSkippedRoomsLog();
  brain.stats.add(['cpu'], {
    used: Game.cpu.getUsed(),
  });

  if (global.config.tickSummary.gcl) {
    console.log(`${Game.time} GCL ${Game.gcl.level}: ${leftPadRound(Game.gcl.progress / Game.gcl.progressTotal * 100, 3, 5)} %  ${Math.round(Game.gcl.progress)}/${Math.round(Game.gcl.progressTotal)}`);
  }
  if (global.config.tickSummary.bucket) {
    console.log(`${Game.time} Bucket: ${Game.cpu.bucket}`);
  }
  if (global.config.tickSummary.separator) {
    console.log(Game.time, '-----------');
  }
};
