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
  maxLayoutAmount: 1
};

roles.scout.execute = function(creep) {
  if (creep.memory.skip === undefined) {
    creep.memory.skip = [];
  }

  if (!creep.memory.notifDisabled) {
    creep.notifyWhenAttacked(false);
    creep.memory.notifDisabled = true;
  }

  return roles.scout.breadthFirstSearch(creep);
};

roles.scout.haveNotSeen = function(creep, room) {
  return creep.memory.search.seen.indexOf(room) === -1 &&
    creep.memory.skip.indexOf(room) === -1;
};

roles.scout.unStuckIt = function(creep, targetPos) {
  if (creep.isStuck()) {
    let returnCode = creep.moveTo(targetPos, {
      ignoreCreeps: false,
      costCallback: creep.room.getCostMatrixCallback()
    });

    if (returnCode != OK) {
      creep.moveRandom();
    }
    creep.log('Scout Stuck at :' + JSON.stringify(creep.memory.last)); // + ' ' + JSON.stringify(creep.isStuck()));
    return true;
  }
};

roles.scout.lookAround = function(creep, levelUpdate = 0, random = false, ignoreSeen = false) {
  let oldestRoom;
  let target;
  let oldestAge = Game.time;
  let rooms = Game.map.describeExits(creep.room.name);
  for (let direction in rooms) {
    let roomNext = rooms[direction];

    if (levelUpdate) {
      creep.memory.search.levels[levelUpdate].push(roomNext);}

    if (roles.scout.haveNotSeen(creep, roomNext)) {
      if (!Memory.rooms[roomNext]) {
        oldestRoom = roomNext;
        oldestAge = 0;
      } else if (Memory.rooms[roomNext].lastSeen &&
        Memory.rooms[roomNext].lastSeen < oldestAge &&
        (!ignoreSeen || !Memory.rooms[roomNext].scoutSeen)) {
        oldestRoom = roomNext;
        oldestAge = Memory.rooms[roomNext].lastSeen;
      }
    }
    //console.log(creep.name, 'looking around ---> direction :', direction, ' / room : ', roomNext,' / age :', Memory.rooms[roomNext].lastSeen, '/ oldestRoom :', oldestRoom, ' / oldestAge :', oldestAge)

  }
  if (oldestRoom) {
    creep.memory.search.target = oldestRoom;
    return oldestRoom;
  } else if (random) {
    while (!target) {
      let random = Math.floor(Math.random() * 4 - 0.01) * 2 + 1;
      target = rooms[random];
    }
    creep.memory.search.target = target;
    return target;
  }
};

roles.scout.initSearch = function(creep) {

  if (!creep.memory.search) {
    creep.memory.search = {};
    creep.memory.search.seen = [creep.room.name];
    creep.memory.search.level = 1;
    creep.memory.search.levels = [
      [creep.room.name],
      []
    ];

    roles.scout.lookAround(creep, 1, true);
  }
};

roles.scout.setNewTarget = function(creep) {
  let oldestRoom;
  let oldestAge = Game.time - config.scout.intervalBetweenRoomVisit;
  for (let room of creep.memory.search.levels[creep.memory.search.level]) {
    if (!Memory.rooms[room]) {
      oldestRoom = room;
      break;
    }
    let scoutSeen = Memory.rooms[room].scoutSeen;
    if (scoutSeen) {
      if (Game.creeps[scoutSeen]) {
        continue;
      }
      delete Memory.rooms[room].scoutSeen;
    }
    if (Memory.rooms[room].lastSeen < oldestAge) {
      oldestRoom = room;
      oldestAge = Memory.rooms[room].lastSeen;
    }
  }
  if (oldestRoom) {
    creep.memory.search.target = oldestRoom;
    return true;
  }
  return false;
};

roles.scout.goFurther = function(creep) {
  creep.memory.search.levels[creep.memory.search.level + 1] = [];
  let target = roles.scout.lookAround(creep, creep.memory.search.level + 1, true);
  if (target) {
    if (!Memory.rooms[target]) {
      Memory.rooms[target] = {};
    }
    Memory.rooms[target].scoutSeen = creep.name;
  }

  if (creep.memory.search.levels[creep.memory.search.level + 1].length === 0) {
    return false;
  } // debug line
  creep.memory.search.level++;
};

roles.scout.switchTarget = function(creep) {
  if (creep.memory.scoutSkip) {
    creep.memory.skip.push(creep.memory.search.target);
    delete creep.memory.scoutSkip;
  } else if (creep.room.name === creep.memory.search.target) {
    creep.memory.search.seen.push(creep.room.name);
  }
  if (!roles.scout.lookAround(creep, 0, false, true) &&
  !roles.scout.setNewTarget(creep)) {
    roles.scout.goFurther(creep);
  }
};

roles.scout.move = function(creep, targetPos) {
  let costMatrix = function(roomName) {
    if (!Memory.rooms[roomName] || (Memory.rooms[roomName].lastSeen < (Game.time - 5))) {
      return creep.room.getCostMatrixCallback(targetPos, true, false, true);
    }
    return false;
  };

  let search = PathFinder.search(
    creep.pos, {
      pos: targetPos,
      range: 20
    }, {
      roomCallback: costMatrix
    }
  );

  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }

  if (search.path.length === 0 || (creep.inBase() && creep.room.memory.misplacedSpawn)) {
    if (creep.isStuck() && creep.pos.isBorder()) {
      creep.say('imstuck at the border', true);
      if (config.scout.scoutSkipWhenStuck) {
        creep.say('skipping', true);
        creep.memory.scoutSkip = true;
        delete creep.memory.last; // Delete to reset stuckness.
      }
    }

    let returnCode = creep.moveTo(targetPos, {
      ignoreCreeps: true,
      costCallback: creep.room.getCostMatrixCallback()
    });

    return true;
  }
  creep.say('Hi -> ' + creep.memory.search.target, true);
  let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
};

roles.scout.breadthFirstSearch = function(creep) {
  roles.scout.initSearch(creep);

  if (creep.memory.scoutSkip || creep.room.name === creep.memory.search.target) {
    roles.scout.switchTarget(creep);
  }

  if (!creep.memory.search.target) {
    creep.log('Suiciding: ' + JSON.stringify(creep.memory.search));
    creep.suicide();
    return true;
  }

  let targetPos = new RoomPosition(25, 25, creep.memory.search.target);

  if (creep.room.getEnemys().length) {
    creep.say('Afraid', true);
    creep.memory.scoutSkip = true;
    return false;
  }
  if (creep.memory.last && creep.memory.last.pos3 && creep.room.name !== creep.memory.last.pos3.roomName) {
    let roomMem = creep.room.memory;
    let youngerCreepHere = creep.room.memory.scoutSeen;
    if (!youngerCreepHere || !Game.creeps[youngerCreepHere] || Game.creeps[youngerCreepHere].ticksToLive < creep.ticksToLive) {
      creep.room.memory.scoutSeen = creep.name;
    }
    creep.moveTo(25, 25, {maxOps: 20});
    return true;
  }
  roles.scout.unStuckIt(creep, targetPos);
  roles.scout.move(creep, targetPos);
};
