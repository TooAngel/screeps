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
function move(creep) {
  let path = creep.memory.path;
  if (path) {
    // TODO is seems like the creep can't reuse the path, needs to be checked
    const moveResult = creep.moveByPath(path);
    if (moveResult === OK) {
      creep.memory.incompleteCount = 0;
      return;
    }
    if (moveResult !== ERR_NOT_FOUND && moveResult !== ERR_INVALID_ARGS) {
      return;
    }
    // creep.log(moveResult);
  }
  let incompleteCount = creep.memory.incompleteCount;
  if (!incompleteCount) {
    incompleteCount = 1;
  } else {
    ++incompleteCount;
  }
  if (incompleteCount > 25) {
    incompleteCount = 0;
    creep.data.nextRoom = getNextRoom(creep);
  }
  creep.memory.incompleteCount = incompleteCount;
  const targetPosObject = new RoomPosition(25, 25, creep.data.nextRoom);
  // creep.log('Searching for path');
  const search = PathFinder.search(
    creep.pos,
    {
      pos: targetPosObject,
      range: 20,
    },
    {
      roomCallback: creep.room.getCostMatrixCallback(targetPosObject, false, true, true),
    },
  );
  creep.memory.path = path = search.path;
  const moveResult = creep.moveByPath(path);
  if (moveResult === OK) {
    creep.memory.incompleteCount = 0;
  }
}

/**
 * getNextRoom
 *
 * @param {object} creep
 * @return {string}
 */
function getNextRoom(creep) {
  const exits = Game.map.describeExits(creep.room.name);

  const rooms = Object.keys(exits).map((direction) => {
    return {name: exits[direction], direction: parseInt(direction, 10)};
  });

  rooms.sort(() => Math.random() - 0.5);
  let nextRoom = rooms[0];
  let lastSeen = (global.data.rooms[nextRoom.name] || {}).lastSeen;
  for (const room of rooms) {
    const roomLastSeen = (global.data.rooms[room.name] || {}).lastSeen;

    const exitPositions = creep.room.find(room.direction);
    const indestructableWall = creep.room.lookForAt(LOOK_STRUCTURES, exitPositions[0]);
    if (indestructableWall.length && indestructableWall.find((object) => object.structureType === STRUCTURE_WALL && !object.hitsMax)) {
      creep.log(`Found indestructable walls`);
      continue;
    }
    const roomCallback = (roomName) => {
      const room = Game.rooms[roomName];
      const costMatrix = new PathFinder.CostMatrix();
      if (room) {
        const structures = room.findStructures();
        room.setCostMatrixStructures(costMatrix, structures, 255);
      }
      return costMatrix;
    };
    const search = PathFinder.search(creep.pos, exitPositions[0], {
      maxRooms: 0,
      roomCallback: roomCallback,
    });
    if (search.incomplete) {
      creep.log(`Skipping ${room.name} - no path`);
      continue;
    }
    if ((lastSeen && !roomLastSeen) || (lastSeen > roomLastSeen)) {
      nextRoom = room;
      lastSeen = roomLastSeen;
    }
  }
  return nextRoom.name;
}

/**
 * explore - follow the unseen or latest `lastSeen` rooms
 *
 * @param {object} creep
 */
function explore(creep) {
  if (!creep.data.nextRoom) {
    creep.data.nextRoom = getNextRoom(creep);
  }
  if (creep.room.name === creep.data.nextRoom) {
    creep.data.nextRoom = getNextRoom(creep);
  }
  move(creep);
}

roles.scout.action = function(creep) {
  creep.notifyWhenAttacked(false);
  explore(creep);
  return true;
};
