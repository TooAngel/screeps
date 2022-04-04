'use strict';

/*
 * scout moves around to provide visibility
 */

roles.scout = {};
roles.scout.settings = {
  layoutString: 'M',
  amount: [1],
  maxLayoutAmount: 1,
};

/**
 * move - moves the creep to the nextRoom
 *
 * @param {object} creep
 */
function move (creep) {
  const targetPosObject = new RoomPosition(25, 25, creep.data.nextRoom);
  const search = PathFinder.search(
    creep.pos, {
      pos: targetPosObject,
      range: 20,
    }, {
      roomCallback: creep.room.getCostMatrixCallback(targetPosObject, false, true, true),
    },
  );

  creep.move(creep.pos.getDirectionTo(search.path[0]));
}

/**
 * getNextRoom
 *
 * @param {object} creep
 * @return {string}
 */
function getNextRoom (creep) {
  const exits = Game.map.describeExits(creep.room.name);
  const rooms = Object.keys(exits).map((direction) => exits[direction]);
  rooms.sort(() => Math.random() - 0.5);
  let nextRoom = rooms[0];
  let lastSeen = (global.data.rooms[nextRoom] || {}).lastSeen;
  for (const room of rooms) {
    const roomLastSeen = (global.data.rooms[room] || {}).lastSeen;
    if ((lastSeen && !roomLastSeen) || (lastSeen > roomLastSeen)) {
      nextRoom = room;
      lastSeen = roomLastSeen;
    }
  }
  return nextRoom;
}

/**
 * explore - follow the unseen or latest `lastSeen` rooms
 *
 * @param {object} creep
 */
function explore (creep) {
  if (!creep.data.nextRoom) {
    creep.data.nextRoom = getNextRoom(creep);
  }
  if (creep.room.name === creep.data.nextRoom) {
    creep.data.nextRoom = getNextRoom(creep);
  }
  creep.say(creep.data.nextRoom);
  move(creep);
}

roles.scout.action = function (creep) {
  creep.notifyWhenAttacked(false);
  explore(creep);
  return true;
};
