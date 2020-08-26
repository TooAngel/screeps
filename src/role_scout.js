'use strict';

/*
 * scout moves around to provide visibility
 *
 * Pre observer the scout moves through surrounding rooms
 */

roles.scout = {};
roles.scout.settings = {
  layoutString: 'M',
  amount: [1],
  maxLayoutAmount: 1,
};

/**
 * haveNotSeen - Checks if a room was seen already
 *
 * @param {object} creep - The creep
 * @param {object} room - The room
 * @return {boolean} - If it is not seen
 **/
function haveNotSeen(creep, room) {
  return creep.memory.search.seen.indexOf(room) === -1 &&
    creep.memory.skip.indexOf(room) === -1;
}

roles.scout.setup = function(creep) {
  // TODO need to solve this better, introduce while getting rid of `execute()`
  creep.memory.routing.reached = true;
};

roles.scout.preMove = function(creep) {
  creep.log(`scout preMove`);
  if (creep.memory.skip === undefined) {
    creep.memory.skip = [];
  }
  if (creep.memory.search && creep.memory.search.seen && (creep.memory.search.seen.length > 0) && (creep.memory.search.seen.indexOf(creep.room.name) === -1)) {
    creep.memory.search.seen.push(creep.room.name);
    // creep.log('added', creep.room.name, 'to seen', creep.memory.search.seen);
    return true;
  }
  return false;
};

/**
 * preMove - Replacement for `roles.scout.preMove`, I think the roles `preMove`
 * is not used, so get rid of it. If this is the case, this method can be
 * renamed
 *
 * @param {object} creep - The creep to preMove
 * @return {bool} - If the room was not seen
 **/
function preMove(creep) {
  if (creep.memory.skip === undefined) {
    creep.memory.skip = [];
  }
  if (creep.memory.search && creep.memory.search.seen && (creep.memory.search.seen.length > 0) && (creep.memory.search.seen.indexOf(creep.room.name) === -1)) {
    creep.memory.search.seen.push(creep.room.name);
    // creep.log('added', creep.room.name, 'to seen', creep.memory.search.seen);
    return true;
  }
  return false;
}

const setNewTarget = function(creep) {
  for (const room of creep.memory.search.levels[creep.memory.search.level]) {
    if (haveNotSeen(creep, room)) {
      creep.memory.search.target = room;
      return true;
    }
  }
  return false;
};

const initSearch = function(creep) {
  if (!creep.memory.search) {
    creep.memory.search = {};
    creep.memory.search.seen = [creep.room.name];
    creep.memory.search.level = 1;
    creep.memory.search.levels = [
      [creep.room.name],
      [],
    ];
    const rooms = Game.map.describeExits(creep.room.name);
    for (const direction of Object.keys(rooms)) {
      creep.memory.search.levels[1].push(rooms[direction]);
      creep.memory.search.target = rooms[direction];
    }
  }
};

const handleReachedTargetRoom = function(creep) {
  if (creep.room.name === creep.memory.search.target) {
    creep.memory.search.seen.push(creep.room.name);
    if (!setNewTarget(creep)) {
      creep.memory.search.levels.push([]);
      for (const room of creep.memory.search.levels[creep.memory.search.level]) {
        const rooms = Game.map.describeExits(room);
        for (const direction of Object.keys(rooms)) {
          const roomNext = rooms[direction];
          if (haveNotSeen(creep, roomNext)) {
            creep.memory.search.levels[creep.memory.search.level + 1].push(roomNext);
            creep.memory.search.target = roomNext;
            if (Math.random() < 0.1) {
              creep.creepLog(`Randomly skipping room ${roomNext}`);
              creep.memory.search.seen.push(roomNext);
            }
          }
        }
      }
      creep.memory.search.level++;
    }
  }
};

const breadthFirstSearch = function(creep) {
  initSearch(creep);
  handleReachedTargetRoom(creep);

  if (!creep.memory.search.target) {
    creep.log('Suiciding: no search target');
    creep.memory.killed = true;
    creep.suicide();
    return true;
  }

  if (creep.isStuck()) {
    creep.moveTo(25, 25);
    return true;
  }

  const targetPosObject = new RoomPosition(25, 25, creep.memory.search.target);

  let search;

  try {
    search = PathFinder.search(
      creep.pos, {
        pos: targetPosObject,
        range: 20,
      }, {
        // roomCallback: creep.room.getCostMatrixCallback(targetPosObject, true, false, true),
        roomCallback: creep.room.getBasicCostMatrixCallback(),
      },
    );

    if (config.visualizer.enabled && config.visualizer.showPathSearches) {
      visualizer.showSearch(search);
    }
  } catch (e) {
    if (e !== null) {
      creep.log(`search: ${targetPosObject} ${e} ${e.stack}`);
    } else {
      creep.log(`search: ${targetPosObject} ${e}`);
    }
    return false;
  }


  if (search.path.length === 0 || search.incomplete) {
    creep.say('hello', true);
    creep.moveTo(targetPosObject);
    return true;
  }
  creep.say(creep.pos.getDirectionTo(search.path[0]));
  creep.move(creep.pos.getDirectionTo(search.path[0]));
};

roles.scout.action = function(creep) {
  preMove(creep);
  creep.notifyWhenAttacked(false);
  return breadthFirstSearch(creep);
};
