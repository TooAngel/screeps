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

  if (!creep.memory.notifyDisabled) {
    creep.notifyWhenAttacked(false);
    creep.memory.notifyDisabled = true;
  }

  return roles.scout.search(creep);
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



roles.scout.goFurther = function(creep) {
  creep.memory.search.levels[creep.memory.search.level + 1] = [];
  let target = creep.room.lookAround(creep.memory.search.level + 1, true);
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

roles.scout.move = function(creep, targetPos) {
  let costMatrix = function(roomName) {
    if (!Memory.rooms[roomName] || (Memory.rooms[roomName].lastSeen < (Game.time - 15))) {
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
roles.scout.shouldSwitch = function(creep) {
  if (creep.memory.scoutSkip) {
    creep.memory.skip.push(creep.memory.search.target);
    delete creep.memory.scoutSkip;
    return true;
  } else if (creep.room.name === creep.memory.search.target) {
    creep.memory.search.seen.push(creep.room.name);
    return true;
  }
};
/**
roles.scout.switchTarget = function(creep) {
  let target = creep.room.randomRoomAround(true);
  if (!target) {
    target = Game.rooms[creep.memory.base].setNewTarget();
    if (!target) {
      target = creep.room.oldestRoomAround(true);
    }
  }
};
**/
roles.scout.initSearch = function(creep) {
  if (!creep.memory.search || !creep.memory.search.target) {
    creep.memory.search = {seen: []};
    let roomsPatern = Memory.rooms[creep.memory.base].roomsPatern;
    let deep = 1;
    while(roomsPatern[deep]){

    for (let roomName of roomsPatern[deep]) {

        let roomMem = Memory.rooms[roomName];
        if (!roomMem ||
           ((!roomMem.scoutSeen || !Game.creeps[roomMem.scoutSeen]) &&
           (!roomMem.unSafe || (Game.time - roomMem.lastSeen) > 5000))) {
          creep.memory.search.target = roomName;
          return true;
        }

    }
    deep++
    }
    return false;
  }
  return true;
};

roles.scout.search = function(creep) {

  if (!roles.scout.initSearch(creep) || roles.scout.shouldSwitch(creep)) {
    creep.memory.search.target = creep.room.randomRoomAround();
  }
  let emojis = ['🌴', '💪', '🍺', '🎵', '👀', '🍖'];
  creep.say(emojis[Game.time % 6]);

  if (!creep.memory.search.target) {
    creep.log('Suiciding: ' + JSON.stringify(creep.memory.search));
    //creep.suicide();
    return true;
  }

  let targetPos = new RoomPosition(25, 25, creep.memory.search.target);

  if (creep.room.getEnemys().length) {
    creep.say('Afraid', true);
    creep.room.memory.unSafe = true;
    delete creep.memory.search.target;
    return false;
  }
  if (creep.memory.last && creep.memory.last.pos3 && creep.room.name !== creep.memory.last.pos3.roomName) {
    creep.memory.search.target = creep.room.randomRoomAround();
    let roomMem = creep.room.memory;
    let youngerCreepHere = creep.room.memory.scoutSeen;
    if (!youngerCreepHere || !Game.creeps[youngerCreepHere] || Game.creeps[youngerCreepHere].ticksToLive < creep.ticksToLive) {
      creep.room.memory.scoutSeen = creep.name;
    }
    creep.moveTo(25, 25, {maxOps: 100});
    return true;
  }
  roles.scout.unStuckIt(creep, targetPos);
  roles.scout.move(creep, targetPos);
};
