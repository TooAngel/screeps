'use strict';

require('require');
require('prototype_creep_startup_tasks');
require('prototype_creep_move');
require('prototype_roomPosition');
require('prototype_room_init');
require('prototype_room_costmatrix');
require('visualizer');
require('screepsplus');
require('visualizer');

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

<<<<<<< HEAD
  //Memory.myRooms = _.create(Room.prototype, Memory.myRooms);
=======
  //Memory.myRooms = _.create(Room.prototype, Memory.myRooms);  //thinking about save all rooms datas : -CPU => +Memory
>>>>>>> 9191a56... change visualizer render place

  brain.stats.addRoot();
  Memory.myRooms = _.map(_.filter(Game.rooms, r => r.execute()), r => r.name);
  Memory.myRooms.forEach(function(roomName) {
    brain.stats.addRoom(roomName);
  });
};
  if (config.visualizer.enabled && config.visualizer.refresh) {
    visualizer.render();
  }
  brain.stats.add('', '.cpu.used', Game.cpu.getUsed());
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
