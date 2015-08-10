'use strict';
let config = require('config');

function handle() {
  if (Memory.my_rooms && Memory.my_rooms.length < Game.gcl.level && Memory.my_rooms.length < config.nextRoom.maxRooms) {
    if (Game.time % config.nextRoom.ttlPerRoomForScout === 0) {
      for (let roomName of Memory.my_rooms) {
        let room = Game.rooms[roomName];
        if (room.memory.queue && room.memory.queue.length > 0) {
          continue;
        }
        if (room.controller.level < config.nextRoom.scoutMinControllerLevel) {
          continue;
        }
        Game.notify('Searching for a new room from ' + room.name);
        console.log('Searching for a new room from ' + room.name);
        room.memory.queue.push({
          role: 'scoutnextroom'
        });
      }
    }
  }
}

module.exports = {
  handle: function() {
    handle();
  },

  minerals: function() {
    let mineralsAvailable = {
      H: 0,
      O: 0,
      U: 0,
      K: 0,
      L: 0,
      Z: 0,
      X: 0
    };

    for (let roomName in Game.rooms) {
      let room = Game.rooms[roomName];
      if (!room.controller) {
        continue;
      }
      if (!room.controller.my) {
        continue;
      }
      let minerals = room.find(FIND_MINERALS);
      let mineralType = minerals[0].mineralType;
      mineralsAvailable[mineralType]++;
      room.log(mineralType);
    }
    console.log('Mineral rooms:');
    console.log('--------------');
    for (let mineral in mineralsAvailable) {
      console.log(mineral, ':', mineralsAvailable[mineral]);
    }
  }
};
