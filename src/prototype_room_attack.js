'use strict';

Room.prototype.attackRoom = function() {
  function attack0(room) {
    room.log('Queuing level 0 attack');
    Game.notify(Game.time + ' ' + room.name + ' Queuing autoattacker');

    let sortByDistance = function(object) {
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

  let getPlayer = function(name) {
    brain.increaseIdiot(name, 0);
    return Memory.players[name];
  };

  var player = getPlayer(name);

  let addRoom = function(player, room) {
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
