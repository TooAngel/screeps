'use strict';

function in_layer(room, pos) {
  for (var i = 0; i < room.memory.walls.layer_i; i++) {
    for (var j in room.memory.walls.layer[i]) {
      var position = room.memory.walls.layer[i][j];
      if (pos.isEqualTo(position.x, position.y)) {
        return true;
      }
    }
  }
  return false;
}

function checkRamparts(room_name) {
  var room = Game.rooms[room_name];
  if (!room.memory.walls) {
    return false;
  }
  for (var rampart of room.memory.walls.ramparts) {
    var pos = new RoomPosition(rampart.x, rampart.y, rampart.roomName);
    pos.createConstructionSite(STRUCTURE_RAMPART);
  }
}

function closeExitsByPath(room_name) {
  var room = Game.rooms[room_name];
  if (room.memory.walls && room.memory.walls.finished) {
    return false;
  }


  if (!room.memory.walls || !room.memory.walls.layer) {
    room.log('closeExitsByPath: Reset walls');
    room.memory.walls = {
      exit_i: 0,
      ramparts: [],
      layer_i: 0,
      // TODO as array?
      layer: {
        0: []
      }
    };
  }
  if (!room.memory.walls.layer[room.memory.walls.layer_i]) {
    room.memory.walls.layer[room.memory.walls.layer_i] = [];
  }
  room.log('closeExitsByPath layer: ' + room.memory.walls.layer_i + ' exit: ' + room.memory.walls.exit_i + ' walls: ' + room.memory.walls.layer[room.memory.walls.layer_i].length);

  var ignores = [];
  for (var i = 0; i < room.memory.walls.layer_i; i++) {
    ignores = ignores.concat(room.memory.walls.layer[i]);
  }

  var exits = room.find(FIND_EXIT);
  if (room.memory.walls.exit_i >= exits.length) {
    room.memory.walls.exit_i = 0;
    room.memory.walls.layer_i++;
    room.log('Increase layer');
    if (room.memory.walls.layer_i >= 3) {
      // TODO don't reset when finished
      room.log('Wall setup finished');
      room.memory.walls.finished = true;
      if (true) return false;
      // Currently reset only one layer
      room.memory.walls.layer_ramparts = [];
      room.memory.walls.layer = {
        0: []
      };
      room.memory.walls.layer_i = 0;
      room.log('Back from start');
      // Done?
    }
    return true;
  }

  var callbackNew = function(roomName, costMatrix) {
    if (!costMatrix) {
      costMatrix = new PathFinder.CostMatrix();
    }
    for (let avoidIndex in room.memory.walls.ramparts) {
      let avoidPos = room.memory.walls.ramparts[avoidIndex];
      costMatrix.set(avoidPos.x, avoidPos.y, 0xFF);
    }
    for (let avoidIndex in room.memory.walls.layer[room.memory.walls.layer_i]) {
      let avoidPos = room.memory.walls.layer[room.memory.walls.layer_i][avoidIndex];
      costMatrix.set(avoidPos.x, avoidPos.y, 0xFF);
    }

    return costMatrix;
  };

  var exit = exits[room.memory.walls.exit_i];

  let targets = [{
    pos: room.controller.pos,
    range: 1
  }];
  let sources = room.find(FIND_SOURCES);
  for (let sourceId in sources) {
    targets.push({
      pos: sources[sourceId].pos,
      range: 1
    });
  }

  let search = PathFinder.search(
    exit,
    targets, {
      roomCallback: callbackNew,
      maxRooms: 1
    }
  );

  var path = search.path;
  var pos_last = path[path.length - 1];
  let posLastObject = new RoomPosition(pos_last.x, pos_last.y, room.name);

  let wayFound = false;
  for (let targetId in targets) {
    if (posLastObject.getRangeTo(targets[targetId]) == 1) {
      wayFound = true;
      break;
    }
  }
  if (!wayFound) {
    room.memory.walls.exit_i++;
    return true;
  }

  for (var path_i = 0; path_i < path.length; path_i++) {
    var pos_blocker_plain = path[path_i];

    if (pos_blocker_plain.x > 1 && pos_blocker_plain.x < 48 && pos_blocker_plain.y > 1 && pos_blocker_plain.y < 48) {
      var pos_blocker = new RoomPosition(pos_blocker_plain.x, pos_blocker_plain.y, room.name);

      if (in_layer(room, pos_blocker)) {
        continue;
      }

      room.log('pos_blocker: ' + pos_blocker);

      var structure = STRUCTURE_WALL;
      if (pos_blocker.inPath() || pos_blocker.inPositions()) {
        structure = STRUCTURE_RAMPART;
        room.memory.walls.ramparts.push(pos_blocker);
      } else {
        let costMatrixBase = PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
        costMatrixBase.set(pos_blocker.x, pos_blocker.y, 0xff);
        room.memory.costMatrix.base = costMatrixBase.serialize();
      }
      room.memory.walls.layer[room.memory.walls.layer_i].push(pos_blocker);
      var returnCode = pos_blocker.createConstructionSite(structure);
      if (returnCode == ERR_FULL) {
        return false;
      }
      if (returnCode == ERR_INVALID_TARGET) {
        return false;
      }
      room.log('Placing ' + structure + ' with ' + returnCode + ' at ' + JSON.stringify(pos_blocker));
      return true;
    }
  }
  // I guess when the position is near to the exit (e.g. source on x: 47
  // TODO I think this can break the setup, It will find the way to this source which is in the walls / ramparts and skip the others
  room.memory.walls.exit_i++;
}


module.exports = {
  closeExitsByPath: function(room_name) {
    return closeExitsByPath(room_name);
  },

  checkRamparts: function(room_name) {
    return checkRamparts(room_name);
  }
};
