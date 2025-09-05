'use strict';

require('./require');
require('./prototype_creep_startup_tasks');
require('./prototype_creep_move');
require('./prototype_roomPosition');
require('./prototype_room_init');
require('./prototype_room_costmatrix');
require('./visualizer');
require('./screepsplus');

const {initProfiler, execute} = require('./brain_main');
const {cpuLimit} = require('./brain_stats');
const {generatePixel} = require('./pixel');

global.tickLimit = cpuLimit();
global.load = Math.round(Game.cpu.getUsed());

// Init heap data
global.data = global.data || {};
global.data.creeps = global.data.creeps || {};
global.data.rooms = global.data.rooms || {};
global.data.stats = global.data.stats || {
  cpuIdle: 0,
  memoryFree: 0,
  heapFree: 0,
};

console.log(`${Game.time} Script reload - Load: ${global.load} tickLimit: ${Game.cpu.tickLimit} limit: ${Game.cpu.limit} Bucket: ${Game.cpu.bucket}`);

brain.stats.init();
initProfiler();

/**
 * Main game loop - executed every tick
 */
module.exports.loop = function() {
  try {
    runMainLogic();
  } catch (error) {
    console.log(`ERROR: Main loop crashed at tick ${Game.time}: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
    // Continue to run stats/pixel generation even if main logic fails
  }

  try {
    runPostTickOperations();
  } catch (error) {
    console.log(`ERROR: Post-tick operations failed at tick ${Game.time}: ${error.message}`);
  }
};

/**
 * Run the main bot logic
 */
function runMainLogic() {
  if (config.main.enabled) {
    if (config.profiler.enabled) {
      global.profiler.wrap(() => {
        execute();
      });
    } else {
      execute();
    }
  }
}

/**
 * Run post-tick operations (stats, pixels)
 */
function runPostTickOperations() {
  generatePixel();
  brain.stats.updateCpuStats();

  if (config.nextRoom.resourceStats) {
    updateResourceStats();
  }
}

/**
 * Update resource usage statistics with exponential smoothing
 */
function updateResourceStats() {
  const statsDivider = config.nextRoom.resourceStatsDivider;
  const cpuLimit = Game.cpu.limit;
  const currentCPUUsed = Game.cpu.getUsed();
  const currentIdleCPU = cpuLimit - currentCPUUsed;

  // CPU stats
  global.data.stats.cpuIdle = ((statsDivider - 1) * global.data.stats.cpuIdle + currentIdleCPU) / statsDivider;
  global.data.stats.cpuUsed = global.data.stats.cpuUsed || cpuLimit;
  global.data.stats.cpuUsed = ((statsDivider - 1) * global.data.stats.cpuUsed + currentCPUUsed) / statsDivider;

  // Heap stats
  const heapStatistics = Game.cpu.getHeapStatistics();
  const heapLimit = heapStatistics.heap_size_limit;
  const currentHeapUsed = heapStatistics.used_heap_size + heapStatistics.externally_allocated_size;
  const currentHeapFree = heapLimit - currentHeapUsed;
  global.data.stats.heapFree = ((statsDivider - 1) * global.data.stats.heapFree + currentHeapFree) / statsDivider;
  global.data.stats.heapUsed = global.data.stats.heapUsed || heapLimit;
  global.data.stats.heapUsed = ((statsDivider - 1) * global.data.stats.heapUsed + currentHeapUsed) / statsDivider;

  // Memory stats
  const MEMORY_LIMIT = 2000000; // 2MB Screeps memory limit
  const currentMemoryUsed = RawMemory.get().length;
  const currentMemoryFree = MEMORY_LIMIT - currentMemoryUsed;
  global.data.stats.memoryFree = ((statsDivider - 1) * global.data.stats.memoryFree + currentMemoryFree) / statsDivider;
  global.data.stats.memoryUsed = global.data.stats.memoryUsed || MEMORY_LIMIT;
  global.data.stats.memoryUsed = ((statsDivider - 1) * global.data.stats.memoryUsed + currentMemoryUsed) / statsDivider;
}
