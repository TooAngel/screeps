'use strict';

brain.handleNextroom = function() {
  if (Memory.myRooms && Memory.myRooms.length < Game.gcl.level && Memory.myRooms.length < config.nextRoom.maxRooms) {
    if (Game.time % config.nextRoom.ttlPerRoomForScout === 0) {
      for (let roomName of Memory.myRooms) {
        let room = Game.rooms[roomName];
        if (room.memory.queue && room.memory.queue.length > 3) {
          continue;
        }
        if (room.controller.level < config.nextRoom.scoutMinControllerLevel) {
          continue;
        }
        if (config.nextRoom.notify) {
          Game.notify('Searching for a new room from ' + room.name);
        }
        console.log('Searching for a new room from ' + room.name);
        room.memory.queue.push({
          role: 'scoutnextroom'
        });
      }
    }
  }
};
