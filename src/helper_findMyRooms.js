/**
 * findRoomsWithinReach - finds rooms within reach for nextRooms
 *
 * @param {object} room - The room to search for
 * @return {list} - A list of room names
 **/
function findRoomsWithinReach(room) {
  const rooms = [];
  for (const myRoom of Memory.myRooms) {
    const distance = Game.map.getRoomLinearDistance(room, myRoom);
    console.log(`roomWithinReach room: ${room} myRoom: ${myRoom} distance: ${distance}`);
    if (config.nextRoom.minNewRoomDistance <= distance && distance < config.nextRoom.maxDistance) {
      rooms.push(myRoom);
    }
  }
  return rooms;
}
module.exports.findRoomsWithinReach = findRoomsWithinReach;

/**
 * findMyRoomsSortByDistance - Returns myRooms sorted by distance
 *
 * @param {string} roomName - The roomName to calculate the distance to
 * @return {list} - MyRoom names sorted by distance
 **/
function findMyRoomsSortByDistance(roomName) {
  const sortByDistance = (object) => {
    return Game.map.getRoomLinearDistance(roomName, object);
  };

  return _.sortBy(Memory.myRooms, sortByDistance);
}
module.exports.findMyRoomsSortByDistance = findMyRoomsSortByDistance;

/**
 * getMyRoomWithinRange
 *
 * @param {string} roomName - The room the distance to check
 * @param {number} range - The max range
 * @param {number} minRCL - The min RCL a room needs to have
 * @return {string} - A room name in range or `false` otherwise
 **/
function getMyRoomWithinRange(roomName, range, minRCL) {
  // TODO Instead of just finding one room, it should be the closest (or highest RCL)
  for (const myRoomName of Memory.myRooms) {
    const room = Game.rooms[myRoomName];
    if (!room) {
      console.log(`helper_findMyRooms.getMyRoomWithinRange room not available: ${myRoomName} ${room}`);
      continue;
    }
    if (minRCL && room.controller.level < minRCL) {
      continue;
    }
    if (!room.isHealthy()) {
      continue;
    }
    const distance = Game.map.getRoomLinearDistance(roomName, myRoomName);
    if (range && distance > range) {
      continue;
    }
    return myRoomName;
  }
  return false;
}
module.exports.getMyRoomWithinRange = getMyRoomWithinRange;
