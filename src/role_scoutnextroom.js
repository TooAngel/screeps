'use strict';

/*
 * scoutnextroom is called when the number of rooms is < possible rooms
 *
 * Random walk to find a room with 'threshold' distance and two sources.
 * Claims the controller and room revive will drop in.
 */

roles.scoutnextroom = {};

roles.scoutnextroom.settings = {
  layoutString: 'MK',
  maxLayoutAmount: 1,
};

roles.scoutnextroom.execute = function(creep) {
  creep.notifyWhenAttacked(false);
  if (creep.memory.claimRoom) {
    creep.moveTo(creep.room.controller);
    const returnCode = creep.claimController(creep.room.controller);
    if (returnCode === OK) {
      delete Memory.next_room;
      creep.suicide();
    }
    return true;
  }

  if (!creep.memory.target || creep.memory.target === null || creep.memory.target.roomName !== creep.room.name) {
    const hostileCreeps = creep.room.getEnemys();

    let opponentRoom = hostileCreeps.length > 0;
    if (!creep.inBase()) {
      opponentRoom = opponentRoom || (creep.room.controller && creep.room.controller.my);

      // TODO No way to controller doesn't mean it is an opponentRoom
      //      if (creep.room.controller) {
      //        var path = creep.pos.findPathTo(creep.room.controller.pos);
      //        if (path.length === 0) {
      //          creep.log('Can not find way to controller');
      //          opponentRoom = true;
      //        } else {
      //
      //          let lastPos = path[path.length - 1];
      //          if (!creep.room.controller.pos.isEqualTo(lastPos.x, lastPos.y)) {
      //            creep.log('Can not find way to controller');
      //            opponentRoom = true;
      //          }
      //        }
      //      }
    }

    const checkNewRoom = function(creep, opponentRoom) {
      if (creep.inBase()) {
        return false;
      }

      if (opponentRoom) {
        return false;
      }

      if (!creep.room.controller) {
        creep.log('No controller');
        return false;
      }
      const sources = creep.room.find(FIND_SOURCES);
      if (sources.length < 2) {
        creep.log('Not enough sources');
        return false;
      }

      for (const roomName of Memory.myRooms) {
        const distance = Game.map.getRoomLinearDistance(creep.room.name, roomName);
        if (distance < config.nextRoom.minNewRoomDistance) {
          creep.log('To close to: ' + roomName + ' ' + distance);
          return false;
        }
      }

      creep.memory.claimRoom = true;
      creep.moveTo(creep.room.controller.pos);
      creep.log('claim');
      return true;
    };

    if (checkNewRoom(creep, opponentRoom)) {
      return true;
    }
    const exits = Game.map.describeExits(creep.room.name);

    const handleTarget = function(creep, exits) {
      const startDirection = _.random(1, 4) * 2;
      const backwardsDirection = RoomPosition.oppositeDirection(creep.memory.dir);

      if (!creep.memory.base) {
        return false;
      }

      for (let i = 1; i < 8; i += 2) {
        // Don't go back
        const direction = RoomPosition.changeDirection(startDirection, i);
        if (direction === backwardsDirection) {
          continue;
        }

        const roomName = exits[direction];
        if (typeof(roomName) === 'undefined') {
          continue;
        }

        const exit = creep.room.findExitTo(roomName);
        if (exit === -2) {
          continue;
        }

        const exitPos = creep.pos.findClosestByPath(exit, {
          ignoreCreeps: true,
        });

        if (!exitPos) {
          continue;
        }

        const route = Game.map.findRoute(creep.memory.base, roomName);
        const maxRoute = 10;
        if (route.length > maxRoute) {
          continue;
        }

        // Way blocked
        const search = PathFinder.search(
          creep.pos,
          exitPos, {
            maxRooms: 1,
          });
        if (search.incomplete) {
          continue;
        }

        creep.memory.target = exitPos;
        creep.memory.goalRoom = roomName;
        creep.memory.dir = direction;
        return true;
      }
      return false;
    };

    if (opponentRoom || !handleTarget(creep, exits)) {
      // Go back, no other way
      if (!creep.memory.dir) {
        creep.memory.dir = _.random(1, 8);
      }
      const roomName = exits[RoomPosition.oppositeDirection(creep.memory.dir)];
      if (!roomName) {
        creep.memory.dir = _.random(1, 8);
      }
      const exitTo = creep.room.findExitTo(roomName);
      const exit = creep.pos.findClosestByRange(exitTo);
      creep.memory.target = exit;
      creep.memory.dir = RoomPosition.oppositeDirection(creep.memory.dir);
    }
  }

  if (!creep.memory.target) {
    // Still haven't found target, no point in continuing.
    creep.log('Cannot find a target');
    return;
  }

  let targetPosObject;
  try {
    targetPosObject = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.room.name);
  } catch (e) {
    creep.log(JSON.stringify(creep.memory));
    throw e;
  }
  const search = PathFinder.search(
    creep.pos, {
      pos: targetPosObject,
      range: 1,
    }, {
      // TODO Can prevent the creep move through the room (base: W1N7, room: W2N7, private server)
      roomCallback: creep.room.getCostMatrixCallback(targetPosObject, true),
      maxRooms: 1,
    }
  );

  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }

  if (search.incomplete || search.path.length === 0) {
    creep.say('incomplete');
    if (creep.isStuck()) {
      delete creep.memory.target;
      delete creep.memory.last;
    } else {
      creep.moveTo(targetPosObject);
    }
    return true;
  }
  creep.say(creep.memory.goalRoom);
  creep.move(creep.pos.getDirectionTo(search.path[0]));
};
