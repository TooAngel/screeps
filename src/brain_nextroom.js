'use strict';

const {findRoomsWithinReach} = require('./helper_findMyRooms');

/**
 * isClaimableRoom - Checks if a room is claimable
 * - not already claimed
 * - has a controller
 * - has at least two sources
 * - is not `Occupied`
 * - is not `Reserved`
 *
 * @param {string} roomName - The room to check
 * @return {boolean} - If the room is claimable
 **/
function isClaimableRoom(roomName) {
  if (Memory.myRooms.indexOf(roomName) >= 0) {
    return false;
  }
  if (!Memory.rooms[roomName].controllerId) {
    return false;
  }
  if (Memory.rooms[roomName].sources < 2) {
    return false;
  }
  if (Memory.rooms[roomName].state === 'Occupied') {
    return false;
  }
  if (Memory.rooms[roomName].state === 'Controlled') {
    return false;
  }
  if (Memory.rooms[roomName].state === 'HostileReserved') {
    return false;
  }
  // Yes / No ???
  if (Memory.rooms[roomName].state === 'Reserved') {
    return false;
  }
  return true;
}

brain.handleNextroom = function() {
  if (!Memory.myRooms) {
    return;
  }

  if (Memory.myRooms.length >= Game.gcl.level) {
    return;
  }

  if (Memory.myRooms.length >= config.nextRoom.maxRooms) {
    return;
  }

  if ((Memory.myRooms.length + 1) * config.nextRoom.cpuPerRoom >= Game.cpu.limit) {
    return;
  }
  if (Game.time % config.nextRoom.intervalToCheck !== 0) {
    return;
  }
  brain.debugLog('brain', 'handleNextroom');

  const possibleRooms = Object.keys(Memory.rooms).filter(isClaimableRoom);
  if (possibleRooms.length > 0) {
    const roomsWithinReach = possibleRooms.filter((room) => findRoomsWithinReach(room).length > 0);
    const selectedRoom = roomsWithinReach[Math.floor(Math.random() * roomsWithinReach.length)];
    const possibleMyRooms = findRoomsWithinReach(selectedRoom);
    const selectedMyRoom = possibleMyRooms[Math.floor(Math.random() * possibleMyRooms.length)];
    brain.debugLog('brain', `handleNextroom - Will reserve: ${selectedRoom}`);
    // TODO selected the closest room to spawn the claimer
    Game.rooms[selectedMyRoom].checkRoleToSpawn('claimer', 1, Memory.rooms[selectedRoom].controllerId, selectedRoom);
    for (const myRoomName of possibleMyRooms) {
      const myRoom = Game.rooms[myRoomName];
      if (!myRoom.isStruggeling()) {
        continue;
      }
      myRoom.checkRoleToSpawn('nextroomer', 1, Memory.rooms[selectedRoom].controllerId, selectedRoom);
    }
    return;
  }

  for (const roomName of Memory.myRooms) {
    const room = Game.rooms[roomName];
    room.log(`brain.handleNextroom spawn scout to find claimable rooms`);
    room.checkRoleToSpawn('scout');
  }
};
