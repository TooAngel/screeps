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

module.exports.loop = function() {
  if (config.main.enabled) {
    if (config.profiler.enabled) {
      global.profiler.wrap(() => {
        execute();
      });
    } else {
      execute();
    }
  }

  generatePixel();
  brain.stats.updateCpuStats();

  if (config.nextRoom.resourceStats) {
    const statsDivider = config.nextRoom.resourceStatsDivider;
    const cpuLimit = Game.cpu.limit;
    const currentCPUUsed = Game.cpu.getUsed();
    const currentIdleCPU = cpuLimit - currentCPUUsed;
    global.data.stats.cpuIdle = ((statsDivider - 1) * global.data.stats.cpuIdle + currentIdleCPU) / statsDivider;
    global.data.stats.cpuUsed = global.data.stats.cpuUsed || cpuLimit;
    global.data.stats.cpuUsed = ((statsDivider - 1) * global.data.stats.cpuUsed + currentCPUUsed) / statsDivider;

    const heapStatistics = Game.cpu.getHeapStatistics();
    const heapLimit = heapStatistics.heap_size_limit;
    const currentHeapUsed = heapStatistics.used_heap_size + heapStatistics.externally_allocated_size;
    const currentHeapFree = heapLimit - currentHeapUsed;
    global.data.stats.heapFree = ((statsDivider - 1) * global.data.stats.heapFree + currentHeapFree) / statsDivider;
    global.data.stats.heapUsed = global.data.stats.heapUsed || heapLimit;
    global.data.stats.heapUsed = ((statsDivider - 1) * global.data.stats.heapUsed + currentHeapUsed) / statsDivider;

    const memoryLimit = 2000000;
    const currentMemoryUsed = RawMemory.get().length;
    const currentMemoryFree = memoryLimit - currentMemoryUsed;
    global.data.stats.memoryFree = ((statsDivider - 1) * global.data.stats.memoryFree + currentMemoryFree) / statsDivider;
    global.data.stats.memoryUsed = global.data.stats.memoryUsed || memoryLimit;
    global.data.stats.memoryUsed = ((statsDivider - 1) * global.data.stats.memoryUsed + currentMemoryUsed) / statsDivider;
  }
};
