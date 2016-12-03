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

roles.scout.execute = function(creep) {
  let breadthFirstSearch = function(creep) {
    let setNewTarget = function(creep) {
      for (let room of creep.memory.search.levels[creep.memory.search.level]) {
        if (creep.memory.search.seen.indexOf(room) == -1) {
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

    if (creep.room.name == creep.memory.search.target) {
      creep.memory.search.seen.push(creep.room.name);
      if (!setNewTarget(creep)) {
        creep.memory.search.levels.push([]);
        for (let room of creep.memory.search.levels[creep.memory.search.level]) {
          let rooms = Game.map.describeExits(room);
          for (let direction in rooms) {
            let roomNext = rooms[direction];
            if (creep.memory.search.seen.indexOf(roomNext) == -1) {
              creep.memory.search.levels[creep.memory.search.level + 1].push(roomNext);
              creep.memory.search.target = roomNext;
            }
          }
        }
        creep.memory.search.level++;
      }
    }

    let targetPosObject = new RoomPosition(25, 25, creep.memory.search.target);

    let search;

    try {
      search = PathFinder.search(
        creep.pos, {
          pos: targetPosObject,
          range: 20
        }, {
          roomCallback: creep.room.getAvoids(creep.room, {
            pos: targetPosObject,
            scout: true
          })
        }
      );
    } catch (e) {
      //      creep.log(`search: ${targetPosObject} %{e}`);
      return false;

    }

    if (search.incomplete) {
      creep.say('incompl');
      creep.moveTo(targetPosObject);
      return true;
    }

    creep.say(creep.pos.getDirectionTo(search.path[0]));
    let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
  };

  creep.notifyWhenAttacked(false);
  return breadthFirstSearch(creep);
};
