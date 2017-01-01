'use strict';
//TODO move to prototype_room_utils or prototype_room_routing ?
Room.prototype.sortMyRoomsByLinearDistance = function (target) {
  let sortByLinearDistance = function (object) {
    return Game.map.getRoomLinearDistance(target, object);
  };

  return _.sortBy(Memory.myRooms, sortByLinearDistance);
};

//TODO move to prototype_room_utils or prototype_room_routing ?
//TODO find shortest way from closest Spawn to target
Room.prototype.closestSpawn = function (target) {
  let pathLength = {};
  let roomsMy = this.sortMyRoomsByLinearDistance(target);

  for (let room of roomsMy) {
    let route = Game.map.findRoute(room, target);
    let routeLength = global.utils.returnLength(route);

    if (route && routeLength) {
      //TODO @TooAngel please review: save found route from target to myRoom Spawn by shortest route!
      //Memory.rooms[room].routing = Memory.rooms[room].routing || {};
      //Memory.rooms[room].routing[room + '-' + target] = Memory.rooms[room].routing[room + '-' + target] || {
      //    path: room + '-' + route,
      //    created: Game.time,
      //    fixed: false,
      //    name: room + '-' + target,
      //    category: 'moveToByClosestSpawn'
      //  };

      pathLength[room] = {
        room: room,
        route: route,
        length: routeLength
      };
    }
  }

  let shortest = _.sortBy(pathLength, global.utils.returnLength);
  return _.first(shortest).room;
};

Room.prototype.attackRoom = function () {
  function attack0(room) {
    room.log('Queuing level 0 attack');
    if (config.autoattack.notify) {
      Game.notify(Game.time + ' ' + room.name + ' Queuing autoattacker');
    }

    let sortByDistance = function (object) {
      return Game.map.getRoomLinearDistance(room.name, object);
    };

    let roomsMy = _.sortBy(Memory.myRooms, sortByDistance);

    Game.rooms[roomsMy[0]].memory.queue.push({
      role: 'autoattackmelee',
      routing: {
        targetRoom: room.name
      }
    });

    return true;
  }

  function attack1(room) {

  }

  if (config.autoattack.disabled) {
    return true;
  }
  var name;
  if (this.controller.owner) {
    name = this.controller.owner.username;
  } else {
    if (this.controller.reservation) {
      name = this.controller.reservation.username;
    } else {
      return;
    }
  }

  // We only exclude players in the friends.js
  if (friends.indexOf(name) > -1) {
    return true;
  }

  let getPlayer = function (name) {
    brain.increaseIdiot(name, 0);
    return Memory.players[name];
  };

  var player = getPlayer(name);

  let addRoom = function (player, room) {
    if (!player.rooms) {
      player.rooms = {};
    }
    if (!player.rooms[room.name]) {
      player.rooms[room.name] = {
        visited: Game.time
      };
      Memory.players[player.name] = player;
    }
  };

  addRoom(player, this);

  if (player.level === 0) {
    attack0(this);
    player.counter++;
    if (player.counter > 5) {
      player.level = 1;
      player.counter = 0;
    }
    Memory.players[name] = player;
  }
  return true;
};
