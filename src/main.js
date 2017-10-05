'use strict';

require('require');
require('prototype_creep_startup_tasks');
require('prototype_creep_move');
require('prototype_roomPosition');
require('prototype_room_init');
require('prototype_room_costmatrix');
require('visualizer');
require('screepsplus');

console.log('Starting TooAngel AI - Have fun');

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

const main = function() {
  if (Game.cpu.bucket < 2 * Game.cpu.tickLimit && Game.cpu.bucket < Game.cpu.limit * 10) {
    console.log('Skipping tick ' + Game.time + ' due to lack of CPU.');
    return;
  }

  try {
    brain.prepareMemory();
    brain.handleNextroom();
    brain.handleSquadmanager();
    brain.handleIncomingTransactions();
    brain.handleQuests();
  } catch (e) {
    console.log('Exeception', e);
  }

  brain.stats.addRoot();
  Memory.myRooms = _(Game.rooms).filter((r) => r.execute()).map((r) => r.name).value();
  Memory.myRooms.forEach(visualizer.myRoomDatasDraw);

  brain.saveMemorySegments();

  if (config.visualizer.enabled) {
    visualizer.render();
  }
  brain.stats.add(['cpu'], {
    used: Game.cpu.getUsed(),
  });
};

module.exports.loop = function() {
  if (config.profiler.enabled) {
    profiler.wrap(() => {
      main();
    });
  } else {
    main();
  }
};
