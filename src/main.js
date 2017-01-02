'use strict';

require('autoload');
require('prototype_creep_startup_tasks');
require('prototype_creep_move');
require('prototype_roomPosition');
require('prototype_room_init');
require('prototype_room_costmatrix');

if (config.profiler.enabled) {
  try {
    var profiler = require('screeps-profiler');
    profiler.enable();
  } catch (e) {
    console.log('screeps-profiler not found');
    config.profiler.enabled = false;
  }
}

var main = function() {
  if (Game.cpu.bucket < Game.cpu.tickLimit * 2) {
    console.log('Skipping tick ' + Game.time + ' due to lack of CPU.');
    return;
  }
  brain.prepareMemory();
  brain.handleNextroom();
  brain.handleSquadmanager();
  brain.handleIncomingTransactions();

  Memory.myRooms = _.map(_.filter(Game.rooms, (r) => r.execute()), r => r.name);

};

module.exports.loop = function() {
  if (config.profiler.enabled) {
    profiler.wrap(function() {
      main();
    });
  } else {
    main();
  }
};
