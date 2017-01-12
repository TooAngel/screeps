'use strict';

/*
 * scout moves around to provide visibility
 *
 * Pre observer the scout moves through surrounding rooms
 */

roles.scout = {};
roles.scout.getPartConfig = function(room, energy, heal) {
  let parts = [MOVE];
  return room.getPartConfig(energy, parts);
};

roles.scout.energyBuild = function(room, energy) {
  return 50;
};

function onBorder(creep) {
  return creep.pos.x === 49 || creep.pos.x === 0 ||
    creep.pos.y === 49 || creep.pos.y === 0;
}

function haveNotSeen(creep, room) {
  return creep.memory.search.seen.indexOf(room) == -1 &&
    creep.memory.skip.indexOf(room) == -1;
}

roles.scout.execute = function(creep) {
  if (creep.memory.skip === undefined) {
    creep.memory.skip = [];
  }
  let breadthFirstSearch = function(creep) {
    let setNewTarget = function(creep) {
      for (let room of creep.memory.search.levels[creep.memory.search.level]) {
        if (haveNotSeen(creep, room)) {
          creep.memory.search.target = room;
          return true;
        }
      }
      return false;
    };
    if (!creep.memory.search) {
      creep.memory.search = {};
      creep.memory.search.seen = [creep.room.name];
      creep.memory.search.level = 1;
      creep.memory.search.levels = [
        [creep.room.name],
        []
      ];
      let rooms = Game.map.describeExits(creep.room.name);
      for (let direction in rooms) {
        creep.memory.search.levels[1].push(rooms[direction]);
        creep.memory.search.target = rooms[direction];
      }
    }

    if (creep.memory.scoutSkip || creep.room.name == creep.memory.search.target) {
      if (creep.memory.scoutSkip) {
        creep.memory.skip.push(creep.memory.search.target);
        delete creep.memory.scoutSkip;
      } else {
        creep.memory.search.seen.push(creep.room.name);
      }
      if (!setNewTarget(creep)) {
        creep.memory.search.levels.push([]);
        for (let room of creep.memory.search.levels[creep.memory.search.level]) {
          let rooms = Game.map.describeExits(room);
          for (let direction in rooms) {
            let roomNext = rooms[direction];
            if (haveNotSeen(creep, roomNext)) {
              creep.memory.search.levels[creep.memory.search.level + 1].push(roomNext);
              creep.memory.search.target = roomNext;
            }
          }
        }
        creep.memory.search.level++;
      }
    }

    if (!creep.memory.search.target) {
      creep.log('Suiciding: ' + JSON.stringify(creep.memory.search));
      creep.suicide();
      return true;
    }
    let targetPosObject = new RoomPosition(25, 25, creep.memory.search.target);

    let search;

    try {
      search = PathFinder.search(
        creep.pos, {
          pos: targetPosObject,
          range: 20
        }, {
          roomCallback: creep.room.getCostMatrixCallback(targetPosObject)
        }
      );
    } catch (e) {
      //      creep.log(`search: ${targetPosObject} %{e}`);
      return false;
    }

    if (search.incomplete || search.path.length === 0 || (creep.inBase() && creep.room.memory.misplacedSpawn)) {
      creep.say('hello', true);
      //       creep.log(creep.pos + ' ' + targetPosObject + ' ' + JSON.stringify(search));
      if (creep.isStuck() && onBorder(creep)) {
        creep.say('imstuck at the border', true);
        if (config.room.scoutSkipWhenStuck) {
          creep.say('skipping', true);
          creep.memory.scoutSkip = true;
          delete creep.memory.last; // Delete to reset stuckness.
        }
      }
      if (search.path.length > 0) {
        creep.move(creep.pos.getDirectionTo(search.path[0]));
      } else {
        creep.moveTo(targetPosObject);
      }
      return true;
    }
    creep.say(creep.pos.getDirectionTo(search.path[0]));
    let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
  };

  creep.notifyWhenAttacked(false);
  return breadthFirstSearch(creep);
};
