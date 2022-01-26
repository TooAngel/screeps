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
  const data = global.data.rooms[roomName];
  if (Memory.myRooms.indexOf(roomName) >= 0) {
    return false;
  }
  if (!data.controllerId) {
    return false;
  }
  if (data.sources < 2) {
    return false;
  }
  if (data.state === 'Occupied') {
    return false;
  }
  if (data.state === 'Controlled') {
    return false;
  }
  if (data.state === 'HostileReserved') {
    return false;
  }
  // Yes / No ???
  if (data.state === 'Reserved') {
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
  brain.debugLog('nextroomer', 'handleNextroom');

  const possibleRooms = Object.keys(global.data.rooms).filter(isClaimableRoom);
  if (possibleRooms.length > 0) {
    const roomsWithinReach = possibleRooms.filter((room) => findRoomsWithinReach(room).length > 0);

    // TODO handle config.nextRoom.minNewRoomDistance and maybe also check good mineral, ....
    const selectedRoomName = roomsWithinReach[Math.floor(Math.random() * roomsWithinReach.length)];

    const possibleMyRooms = findRoomsWithinReach(selectedRoomName);
    const selectedMyRoom = possibleMyRooms[Math.floor(Math.random() * possibleMyRooms.length)];
    brain.debugLog('nextroomer', `handleNextroom - Will reserve: ${selectedRoomName} from ${selectedMyRoom}`);
    // TODO selected the closest, highest energy, highest spawn idle room to spawn the claimer
    const room = Game.rooms[selectedMyRoom];
    const selectedRoomData = global.data.rooms[selectedRoomName];
    room.checkRoleToSpawn('claimer', 1, selectedRoomData.controllerId, selectedRoomName);
    for (const myRoomName of possibleMyRooms) {
      const myRoom = Game.rooms[myRoomName];
      if (!myRoom.isStruggeling()) {
        continue;
      }
      myRoom.checkRoleToSpawn('nextroomer', 1, selectedRoomData.controllerId, selectedRoomName);
    }
    return;
  }

  for (const roomName of Memory.myRooms) {
    const room = Game.rooms[roomName];
    room.debugLog('nextroomer', `brain.handleNextroom spawn scout to find claimable rooms`);
    room.checkRoleToSpawn('scout');
  }
};
