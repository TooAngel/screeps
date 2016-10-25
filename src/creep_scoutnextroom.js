'use strict';

var helper = require('helper');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CLAIM];
  return room.get_part_config(energy, parts);
};

module.exports.energyBuild = function(room, energy) {
  return 650;
};

function handle_target(creep, exits) {
  var offset = Math.floor(Math.random() * 4);

  if (!creep.memory.base) {
    return false;
  }

  for (var i = 0; i < 4; i++) {
    // Don't go back
    var direction = (((offset + i) % 4) * 2) + 1;
    if (direction == (creep.memory.dir + 4) % 8) {
      continue;
    }

    var roomName = exits[direction];
    if (typeof(roomName) == 'undefined') {
      continue;
    }

    var exit = creep.room.findExitTo(roomName);
    if (exit == -2) {
      continue;
    }

    var exit_pos = creep.pos.findClosestByPath(exit, {
      ignoreCreeps: true
    });

    if (!exit_pos) {
      continue;
    }

    var route = Game.map.findRoute(creep.memory.base, roomName);
    var max_route = 10;
    if (route.length > max_route) {
      continue;
    }

    // Way blocked
    var path = creep.pos.findPathTo(exit_pos);
    if (path.length === 0) {
      continue;
    }


    creep.memory.target = exit_pos;
    creep.memory.dir = direction;
    return true;
  }
  return false;
}

function in_queue(creep, spawn) {
  for (var queue_index in Game.rooms[creep.memory.base].memory.queue) {
    var queue_item = Game.rooms[creep.memory.base].memory.queue[queue_index];
    if (queue_item.role == spawn.role && queue_item.source.x == spawn.source.x && queue_item.source.y == spawn.source.y) {
      creep.log(JSON.stringify(spawn) + ' alread in queue');
      return true;
    }
  }
  return false;
}

function check_new_room(creep, opponent_room) {
  if (creep.room.name != creep.memory.base && !opponent_room) {
    var targets = [];
    var sources = creep.room.find(FIND_SOURCES);
    if (creep.room.controller && sources.length == 2) {


      for (let roomName of Memory.myRooms) {
        let distance = Game.map.getRoomLinearDistance(creep.room.name, roomName);
        if (distance < 3) {
          return false;
        }
      }

      creep.memory.claimRoom = true;
      creep.moveTo(creep.room.controller.pos);
      return true;
    }
  }
  return false;
}

module.exports.execute = function(creep) {
  if (creep.memory.claimRoom) {
    creep.moveTo(creep.room.controller);
    let returnCode = creep.claimController(creep.room.controller);
    if (returnCode == OK) {
      delete Memory.next_room;
      creep.suicide();
    }
    return true;
  }

  var last_pos;

  if (!creep.memory.target || creep.memory.target === null || creep.memory.target.roomName != creep.room.name) {
    var hostile_creeps = creep.room.find(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        if (object.owner.username == 'Source Keeper') {
          // Disable Source keeper harvesting
          return true;
        }
        return true;
      }
    });

    var opponent_room = hostile_creeps.length > 0;
    if (creep.room.name != creep.memory.base) {
      opponent_room = opponent_room || (creep.room.controller && creep.room.controller.my);

      if (creep.room.controller) {
        var path = creep.pos.findPathTo(creep.room.controller.pos);
        if (path.length === 0) {
          creep.log('Can not find way to controller');
          opponent_room = true;
        } else {

          last_pos = path[path.length - 1];
          if (!creep.room.controller.pos.isEqualTo(last_pos.x, last_pos.y)) {
            creep.log('Can not find way to controller');
            opponent_room = true;
          }
        }
      }

    }

    if (check_new_room(creep, opponent_room)) {
      return true;
    }

    var exits = Game.map.describeExits(creep.room.name);

    if (opponent_room || !handle_target(creep, exits)) {
      // Go back, no other way
      if (!creep.memory.dir) {
        creep.memory.dir = Math.floor(Math.random() * 8);
      }
      var roomName = exits[(creep.memory.dir + 4) % 8];
      if (!roomName) {
        // Room E12N3 has a full storage in there (so opponent), which breaks the scout otherwise
        creep.memory.dir = Math.floor(Math.random() * 8);
      }
      var exit_to = creep.room.findExitTo(roomName);
      var exit = creep.pos.findClosestByRange(exit_to);
      creep.memory.target = exit;
      creep.memory.dir = (creep.memory.dir + 4) % 8;
    }
  }

  let targetPosObject = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.room.name);
  let search = PathFinder.search(
    creep.pos, {
      pos: targetPosObject,
      range: 0
    }, {
      roomCallback: helper.getAvoids(creep.room, {
        pos: targetPosObject,
        scout: true
      }),
      maxRooms: 1
    }
  );

  creep.say(creep.pos.getDirectionTo(search.path[0]));
  let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
};
