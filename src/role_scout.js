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

roles.scout.died = function(name, memory) {
  const baseName = memory.base;
  Game.rooms[baseName].checkRoleToSpawn('scout', 0, undefined, undefined, 0, baseName);
  delete Memory.creeps[name];
};

roles.scout.execute = function(creep) {
  if (!creep.memory.notifyDisabled) {
    creep.notifyWhenAttacked(false);
    creep.memory.notifyDisabled = true;
  }
};
roles.scout.action = function(creep) {
  if (!creep.memory.search) {
    creep.say('init');
    roles.scout.initSearch(creep);
  }
  if (creep.room.name === creep.memory.search.target || !creep.memory.search.target) {
    creep.say('switch');
    creep.memory.search.target = creep.room.randomRoomAround(creep.memory.search.startRoom || creep.memory.base);

    if (creep.memory.search.target) {
      Memory.rooms[creep.memory.search.target].lastSeen = Game.time;
    } else {
      if (creep.pos.roomName === creep.memory.search.startRoom) {
        delete creep.memory.search.target;
      } else {
        creep.memory.search.target = creep.memory.search.startRoom || creep.memory.base;
      }
    }
  }
  if (creep.memory.last && creep.memory.last.pos1 && creep.room.name !== creep.memory.last.pos1.roomName) {
    roles.scout.enterNewRoom(creep);
  }
  let targetPos = new RoomPosition(25, 25, creep.memory.search.target);
  roles.scout.move(creep, targetPos);
};

const isSafe = function(roomMem) {
  if (roomMem && (roomMem.state === 'Occupied' ||
    (roomMem.tickBlockedFlag && (Game.time - roomMem.tickBlockedFlag) < config.scout.intervalBetweenBlockedVisits) ||
    (roomMem.tickHostilesSeen  && (Game.time - roomMem.tickHostilesSeen) < config.scout.intervalBetweenHostileVisits))) {
    return false;
  }
  return true;
};

const needVisit = function(roomMem) {
  if (!roomMem || ((!roomMem.scoutSeen || !Game.creeps[roomMem.scoutSeen]) &&
    ((Game.time - roomMem.lastSeen) > config.scout.intervalBetweenRoomVisits))) {
    return true;
  }
  return false;
};

roles.scout.initSearch = function(creep) {
  creep.memory.search = {};

  let roomsPatern = Memory.rooms[creep.memory.base].roomsPatern;
  let deep = 1;
  while (roomsPatern[deep]) {
    for (let roomName of roomsPatern[deep]) {
      const roomMem = Memory.rooms[roomName].lastSeen;
      if (isSafe(roomMem) && needVisit(roomMem)) {
        creep.memory.search.target = roomName;
        creep.memory.search.startRoom = roomName;
        return true;
      }
    }
    deep++;
  }
  return false;
};

roles.scout.move = function(creep) {
  let targetPos = new RoomPosition(25, 25, creep.memory.search.target);
  let costMatrix = function(roomName) {
    let roomMem = Memory.rooms[roomName];
    if (isSafe(roomMem)) {
      return creep.room.getCostMatrixCallback(targetPos, true, false, true);
    }
    return false;
  };

  let search = PathFinder.search(
    creep.pos, {
      pos: targetPos,
      range: 20
    }, {
      roomCallback: costMatrix,
    }
  );

  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }

  if (search.path.length === 0) {
    creep.say('?');
    if (creep.isStuck()) {
      let search = PathFinder.search(
          creep.pos, {
            pos: targetPos,
            range: 20
          }, {
            ignoreCreeps: true,
            roomCallback: costMatrix,
            maxOps: 10000,
          }
        );

      if (search.path.length === 0) {
        Memory.rooms[creep.memory.search.target] = Memory.rooms[creep.memory.search.target] || {};
        Memory.rooms[creep.memory.search.target].tickBlockedFlag = Game.time;
        creep.memory.search = {};
        return false;
      }
    }
  }
  creep.say(creep.memory.search.target);
  let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
  if (creep.isStuck()) {
    creep.memory.stuckAmount = creep.memory.stuckAmount ? creep.memory.stuckAmount + 1 : 1;
    delete creep.memory.search.target;
    if (creep.memory.stuckAmount >= 5) {
      delete creep.memory.search;
      creep.memory.stuckAmount = 0;
    }
    delete creep.memory.last;
    creep.moveTo(targetPos);
  }
};

roles.scout.enterNewRoom = function(creep) {
  let roomMem = creep.room.memory;
  let youngerCreepHere = creep.room.memory.scoutSeen;
  if (!youngerCreepHere || !Game.creeps[youngerCreepHere] || Game.creeps[youngerCreepHere].ticksToLive < creep.ticksToLive) {
    creep.room.memory.scoutSeen = creep.name;
  }

  if (creep.room.getEnemys().length) {
    creep.say('Afraid', true);
    creep.room.memory.tickHostilesSeen = Game.time;
    return false;
  }

  creep.moveTo(25, 25, {maxOps: 100});
  return true;
};
