'use strict';

require('./require');
require('./prototype_creep_startup_tasks');
require('./prototype_creep_move');
require('./prototype_roomPosition');
require('./prototype_room_init');
require('./prototype_room_costmatrix');
require('./visualizer');
require('./screepsplus');

global.tickLimit = global.cpuLimit();
global.load = Math.round(Game.cpu.getUsed());

console.log(`${Game.time} Script reload - Load: ${global.load} tickLimit: ${Game.cpu.tickLimit} limit: ${Game.cpu.limit} Bucket: ${Game.cpu.bucket}`);

brain.stats.init();
brain.main.profilerInit();

module.exports.loop = function() {
  if (config.main.enabled) {
    if (config.profiler.enabled) {
      global.profiler.wrap(() => {
        brain.main.execute();
      });
    } else {
      brain.main.execute();
    }
  }
  if (global.config.pixel.enabled) {
    if (typeof PIXEL !== 'undefined') {
      if (Game.cpu.bucket >= PIXEL_CPU_COST + global.config.pixel.minBucketAfter) {
        Game.cpu.generatePixel();
      }
    }
  }
  brain.stats.updateCpuStats();
  try {
    const mainLocal = require('./main_local'); // eslint-disable-line global-require
    mainLocal();
  } catch (e) {
    // empty
  }
};
