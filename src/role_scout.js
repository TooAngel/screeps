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

/**
 * checkForDefender - Checks if a defender needs to be send
 *
 * @param {object} creep - The creep
 * @return {boolean} - If a defender is send
 **/
function checkForDefender(creep) {
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

  const distance = Game.map.getRoomLinearDistance(creep.room.name, creep.memory.base);
  if (distance > config.external.defendDistance) {
    return false;
  }

  creep.log('Spawning defender for external room');
  Game.rooms[creep.memory.base].checkRoleToSpawn('defender', 1, undefined, creep.room.name);
  return true;
}

roles.scout.setup = function(creep) {
  // TODO need to solve this better, introduce while getting rid of `execute()`
  creep.memory.routing.reached = true;
};

roles.scout.preMove = function(creep) {
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
  if (creep.memory.scoutSkip || creep.room.name === creep.memory.search.target) {
    if (creep.memory.scoutSkip) {
      creep.memory.skip.push(creep.memory.search.target);
      delete creep.memory.scoutSkip;
    } else {
      checkForDefender(creep);
      creep.memory.search.seen.push(creep.room.name);
    }
    if (!setNewTarget(creep)) {
      creep.memory.search.levels.push([]);
      for (const room of creep.memory.search.levels[creep.memory.search.level]) {
        const rooms = Game.map.describeExits(room);
        for (const direction of Object.keys(rooms)) {
          const roomNext = rooms[direction];
          if (haveNotSeen(creep, roomNext)) {
            creep.memory.search.levels[creep.memory.search.level + 1].push(roomNext);
            creep.memory.search.target = roomNext;
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
    creep.log('Suiciding: ' + JSON.stringify(creep.memory.search));
    creep.memory.killed = true;
    creep.suicide();
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
        roomCallback: creep.room.getCostMatrixCallback(targetPosObject, true, false, true),
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

  if (creep.isStuck()) {
    creep.moveTo(25, 25);
    return true;
  }

  if (creep.isStuck()) {
    if (creep.memory.stuck > 20) {
      creep.log('Scout Stuck suicide (role.scount.action)');
      creep.memory.killed = true;
      creep.suicide();
      return true;
    }
    if (!creep.memory.stuck) {
      creep.memory.stuck = 0;
    }
    creep.memory.stuck++;

    creep.moveRandom();
    creep.say('ImStuck ' + creep.memory.stuck, true);
    return true;
  } else {
    creep.memory.stuck = 0;
  }

  if (search.path.length === 0 || search.incomplete) {
    creep.say('hello', true);
    if (creep.isStuck() && creep.pos.isBorder(-1)) {
      creep.say('imstuck at the border', true);
      if (config.room.scoutSkipWhenStuck) {
        creep.say('skipping', true);
        creep.memory.scoutSkip = true;
        delete creep.memory.last; // Delete to reset stuckness.
      }
    }
    creep.creepLog(`scout.action no search targetPosObject ${JSON.stringify(targetPosObject)}`);
    creep.moveTo(targetPosObject);
    return true;
  }
  creep.creepLog(`scout.action search ${JSON.stringify(search)}`);
  creep.say(creep.pos.getDirectionTo(search.path[0]));
  creep.move(creep.pos.getDirectionTo(search.path[0]));
};

roles.scout.action = function(creep) {
  roles.scout.preMove(creep);
  creep.notifyWhenAttacked(false);
  return breadthFirstSearch(creep);
};
