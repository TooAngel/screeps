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

console.log(Game.time, 'Script reload', 'Load: ' + global.load, 'Bucket: ' + Game.cpu.bucket);

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
  brain.stats.updateCpuStats();
};
