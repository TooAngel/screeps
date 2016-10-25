'use strict';

var helper = require('helper');
var players = require('enemyplayers');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE];
  return room.get_part_config(energy, parts);
};

module.exports.died = function(name, memory) {
  if (!Memory.enemy_rooms) {
    Memory.enemy_rooms = {};
  }

  if (Memory.enemy_rooms[memory.last_room]) {
    Memory.enemy_rooms[memory.last_room].last_visit = Game.time;
  } else {
    Memory.enemy_rooms[memory.last_room] = {
      last_visit: Game.time
    };
  }

  delete Memory.creeps[name];
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(energy, 50);
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
    var max_route = config.external.distance;
    if (route.length > max_route) {
      continue;
    }

    // Way blocked
    creep.log('way blocked');
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

function checkRoom(creep) {
  if (!creep.room.controller) {
    return false;
  }

  if (creep.room.controller.my) {
    return false;
  }

  var pathToController = creep.pos.findPathTo(creep.room.controller, {
    ignoreCreeps: true,

  });
  let last_pos = pathToController[pathToController.length - 1];
  //  creep.log('path to controller: ' + JSON.stringify(pathToController));
  if (pathToController.length === 0 || (last_pos && !creep.room.controller.pos.isEqualTo(last_pos.x, last_pos.y))) {

    if (config.creep.structurer) {
      // TODO Currently disable cause path finding is somehow broken
      creep.log('Queuing structurer from scout for controller <------ ' + creep.memory.base);
      Game.rooms[creep.memory.base].memory.queue.push({
        role: 'structurer',
        target: creep.room.name
      });
      creep.suicide();
      delete Memory.creeps[creep.name];
      return true;
    }
  }

  var reserver = creep.room.find(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.memory.role == 'reserver';
    }
  });

  if (reserver.length > 0) {
    return false;
  }

  var sources = creep.room.find(FIND_SOURCES);

  var source_keeper_creeps = creep.room.find(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      return object.owner.username == 'Source Keeper';
    }
  });

  var source_keeper = false;
  if (source_keeper_creeps.length > 0) {
    source_keeper = true;
    var atkeeper = creep.room.find(FIND_MY_CREEPS, {
      filter: function(object) {
        return object.memory.role == 'atkeeper';
      }
    });

    var spawn = {
      role: 'atkeeper',
      target: creep.room.name
    };
    for (var i = atkeeper.length; i < 2; i++) {
      Game.rooms[creep.memory.base].memory.queue.push(spawn);
    }
  }

  for (var sources_id in sources) {
    let search = PathFinder.search(
      creep.pos, {
        pos: sources[sources_id].pos,
        range: 1
      }, {
        maxRooms: 1
      }
    );

    var path_to_source = search.path;
    //    creep.log(JSON.stringify(search.path));
    last_pos = path_to_source[path_to_source.length - 1];
    if (sources[sources_id].pos.getRangeTo(last_pos.x, last_pos.y) > 1) {
      // TODO Currently disable cause path finding is somehow broken
      creep.log('DISABLED = Queuing cleaner from scout for source <------ ' + creep.memory.base);
      //Game.rooms[creep.memory.base].memory.queue.push({
      //  role: 'cleaner',
      //  target: creep.room.name,
      //  level: 2
      //});
      continue;
    }

  }

  let level = 2;

  if (creep.room.reservation && creep.room.reservation.username == 'TooAngel') {
    return true;
  }

  if (creep.room.controller.owner) {
    let base = Game.rooms[creep.memory.base];
    if (base.controller.level < 7) {
      return false;
    }
    level = 5;
  }

  var reserverSpawn = {
    role: 'reserver',
    target: creep.room.name,
    target_id: creep.room.controller.id,
    level: level

  };

  creep.log('Queuing reserver from scout <------ ' + creep.memory.base + ' ' + JSON.stringify(reserverSpawn));
  Game.rooms[creep.memory.base].memory.queue.push(reserverSpawn);
  creep.suicide();
  delete Memory.creeps[creep.name];
  return true;
}

function getRoomNext(creep) {
  let exits = Game.map.describeExits(creep.room.name);
  let keys = Object.keys(exits);
  keys.sort(function() {
    return Math.random() - 0.5;
  });
  for (let exitDir in keys) {
    let roomNext = exits[keys[exitDir]];
    if (-1 < creep.memory.seen.indexOf(roomNext)) {
      continue;
    }
    return roomNext;
  }
}

//function newway(creep) {
//  creep.log(creep.memory.routePos + ' ' + JSON.stringify(creep.memory.route) + ' ' + JSON.stringify(creep.memory.seen));
//  if (!creep.memory.seen) {
//    creep.memory.seen = [creep.room.name];
//  }
//
//  if (!creep.memory.route) {
//    creep.memory.route = [{
//      room: getRoomNext(creep)
//    }];
//
//  }
//  creep.memory.routePos = 0;
//  let routeIndex = _.findIndex(creep.memory.route, i => i.room == creep.room.name);
//  if (routeIndex > -1) {
//    creep.memory.routePos = routeIndex + 1;
//  }
//
//  if (creep.memory.reverse && (creep.memory.routePos === 0 || creep.room.name == creep.memory.route[creep.memory.routePos - 1].room)) {
//    creep.log('Find other exit');
//
//    let roomNext = getRoomNext(creep);
//    if (roomNext) {
//      creep.memory.reverse = false;
//      creep.memory.route.pop();
//      creep.memory.route.push({
//        room: roomNext
//      });
//      creep.moveByPathMy(creep.memory.reverse);
//      return true;
//    }
//    creep.memory.route.pop();
//  }
//
//  if (creep.room.name == creep.memory.route[creep.memory.routePos].room) {
//    creep.log('new room');
//    creep.memory.seen.push(creep.room.name);
//
//    if (checkRoom(creep)) {
//      return true;
//    }
//
//    if (creep.memory.route.length < config.external.distance) {
//      let roomNext = getRoomNext(creep);
//      if (roomNext) {
//        creep.memory.route.push({
//          room: roomNext
//        });
//        creep.memory.routePos++;
//        creep.moveByPathMy(creep.memory.reverse);
//        return true;
//      }
//
//    } else {
//      creep.memory.reverse = true;
//      creep.log('Reverse');
//      return true;
//    }
//
//  }
//
//  creep.moveByPathMy(creep.memory.reverse);
//
//}

function doStuff(creep) {
  var hostile_creeps = creep.room.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      if (object.owner.username == 'Source Keeper') {
        // Disable Source keeper harvesting
        return false; // enabled
      }
      if (object.owner.username == 'Suppen') {
        // Disable Source keeper harvesting
        return false; // enabled
      }
      return true;
    }
  });

  var opponent_room = hostile_creeps.length > 0;

  if (creep.room.name != creep.memory.base && !opponent_room) {
    if (checkRoom(creep)) {
      return true;
    }
  } else {
    var spawns = creep.room.find(FIND_HOSTILE_STRUCTURES, {
      filter: function(object) {
        return object.structureType == 'spawn';
      }
    });
    if (spawns.length > 0) {
      players.attackRoom(creep);
      creep.log('Killing myself');
      creep.suicide();
      delete Memory.creeps[creep.name];
      return true;
    }
  }

}

module.exports.execute = function(creep) {
  //  newway(creep);
  //  if (true) {
  //    return true;
  //  }
  creep.notifyWhenAttacked(false);
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

    if (creep.room.name != creep.memory.base && !opponent_room) {
      //creep.log('checkRoom');
      if (checkRoom(creep)) {
        return true;
      }
    } else {
      var spawns = creep.room.find(FIND_HOSTILE_STRUCTURES, {
        filter: function(object) {
          return object.structureType == 'spawn';
        }
      });
      if (spawns.length > 0) {
        players.attackRoom(creep);
        creep.log('Killing myself');
        creep.suicide();
        delete Memory.creeps[creep.name];
        return true;
      }

      if (creep.room.controller && !creep.room.controller.my && !creep.room.controller.owner && !creep.room.controller.reservation) {
        // Exception for Mototroller
        if (hostile_creeps[0].owner.username == 'Mototroller') {
          return true;
        }
        var defenderSpawn = {
          role: 'defender',
          target: creep.room.name,
        };

        creep.log('Queuing defender from scout <------ ' + creep.memory.base + ' ' + JSON.stringify(defenderSpawn));
        Game.rooms[creep.memory.base].memory.queue.push(defenderSpawn);
        creep.suicide();
        delete Memory.creeps[creep.name];
        return true;
      }

    }

    var exits = Game.map.describeExits(creep.room.name);

    if (opponent_room || !handle_target(creep, exits)) {
      // Go back, no other way
      if (!creep.memory.dir) {
        creep.memory.dir = Math.floor(Math.random() * 8);
      }
      var roomName = exits[(creep.memory.dir + 4) % 8];

      for (let dir = 1; dir < 8; dir = dir + 2) {
        creep.memory.dir = dir;
        roomName = exits[dir];
        if (roomName) {
          break;
        }
      }

      if (!roomName) {
        creep.log('No exit found, suiciding');
        creep.suicide();
        return false;
      }

      let exit = creep.room.getMyExitTo(roomName);
      creep.memory.target = exit;
      creep.memory.dir = (creep.memory.dir + 4) % 8;
    }
  }

  if (typeof(creep.room.controller) != 'undefined' && typeof(creep.room.controller.owner) != 'undefined' && creep.room.controller.owner.username == 'foobar') {
    Game.notify('In foobars room');
    return true;
  }
  if (!creep.memory.move_wait) {
    creep.memory.move_wait = 0;
  }

  var ignoreCreepsSwitch = true;
  last_pos = creep.memory.lastPosition;
  if (creep.memory.lastPosition && creep.pos.isEqualTo(new RoomPosition(last_pos.x, last_pos.y, creep.room.name))) {
    creep.memory.move_wait++;
    if (creep.memory.move_wait > 25) {
      ignoreCreepsSwitch = false;
    }
  } else {
    creep.memory.move_wait = 0;
  }

  if (!creep.memory.target || creep.memory.target === null) {
    creep.log('creep.memory.target is null');
    // TODO still do not know
    creep.suicide();
    return true;
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

  if (search.incomplete) {
    creep.moveTo(targetPosObject);
    return true;
  }

  creep.say(creep.pos.getDirectionTo(search.path[0]));
  let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));

  creep.memory.lastPosition = creep.pos;
};
