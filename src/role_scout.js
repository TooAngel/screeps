'use strict';

/*
 * Scout moves around to provide visibility
 *
 * Pre observer the scout moves through surrounding rooms
 */

roles.scout = {};
roles.scout.settings = {
  layoutString: 'M',
  amount: [1],
  maxLayoutAmount: 1
};

let haveNotSeen = function(creep, room) {
  return creep.memory.search.seen.indexOf(room) === -1 &&
    creep.memory.skip.indexOf(room) === -1;
};

let setNewTarget = function(creep) {
  for (let room of creep.memory.search.levels[creep.memory.search.level]) {
    if (haveNotSeen(creep, room)) {
      creep.memory.search.target = room;
      return true;
    }
  }
  return false;
};

let increaseSearchLevel = function(creep) {
  creep.memory.search.levels.push([]);
  for (let room of creep.memory.search.levels[creep.memory.search.level]) {
    let rooms = Game.map.describeExits(room);
    for (let direction of Object.keys(rooms)) {
      let roomNext = rooms[direction];
      if (haveNotSeen(creep, roomNext)) {
        creep.memory.search.levels[creep.memory.search.level + 1].push(roomNext);
        creep.memory.search.target = roomNext;
      }
    }
  }
  creep.memory.search.level++;
};

let initSearch = function(creep) {
  creep.memory.search = {};
  creep.memory.search.seen = [creep.room.name];
  creep.memory.search.level = 1;
  creep.memory.search.levels = [
    [creep.room.name],
    []
  ];
  let rooms = Game.map.describeExits(creep.room.name);
  for (let direction of Object.keys(rooms)) {
    creep.memory.search.levels[1].push(rooms[direction]);
    creep.memory.search.target = rooms[direction];
  }
};

let checkForDefender = function(creep) {
  if (!creep.room.controller) {
    return false;
  }
  if (!creep.room.controller.reservation) {
    return false;
  }
  if (creep.room.controller.reservation.username === Memory.username) {
    return false;
  }
  if (!config.external.defendDistance) {
    return false;
  }

  let distance = Game.map.getRoomLinearDistance(creep.room.name, creep.memory.base);
  if (distance > config.external.defendDistance) {
    return false;
  }

  creep.log('Spawning defender for external room');
  Game.rooms[creep.memory.base].checkRoleToSpawn('defender', 1, undefined, creep.room.name);
};

let checkRoom = function(creep) {
  if (creep.memory.scoutSkip) {
    creep.memory.skip.push(creep.memory.search.target);
    delete creep.memory.scoutSkip;
  } else {
    checkForDefender(creep);
    creep.memory.search.seen.push(creep.room.name);
  }

  if (!setNewTarget(creep)) {
    increaseSearchLevel(creep);
  }
};

let breadthFirstSearch = function(creep) {
  if (!creep.memory.search) {
    initSearch(creep);
  }

  if (creep.memory.scoutSkip || creep.room.name === creep.memory.search.target) {
    checkRoom(creep);
  }

  if (!creep.memory.search.target) {
    creep.log('Suiciding: ' + JSON.stringify(creep.memory.search));
    creep.suicide();
    return true;
  }
  let targetPosObject = new RoomPosition(25, 25, creep.memory.search.target);
  // creep.log(targetPosObject);
  let returnCode = creep.moveToMy(targetPosObject, 24, true, true);
};

roles.scout.execute = function(creep) {
  if (creep.memory.skip === undefined) {
    creep.memory.skip = [];
  }
  creep.notifyWhenAttacked(false);
  return breadthFirstSearch(creep);
};
