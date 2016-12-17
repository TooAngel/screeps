'use strict';

require('require');

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
  brain.prepareMemory();
  brain.handleNextroom();
  brain.handleSquadmanager();

  var myRooms = [];
  for (var roomName in Game.rooms) {
    let room = Game.rooms[roomName];
    try {
      if (room.execute()) {
        myRooms.push(roomName);
      }
    } catch (err) {
      room.log('Executing room failed: ' + room.name + ' ' + err + ' ' + err.stack);
      Game.notify('Executing room failed: ' + room.name + ' ' + err + ' ' + err.stack, 30);
    }
  }

  Memory.myRooms = myRooms;
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
