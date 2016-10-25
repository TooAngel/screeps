'use strict';

function getPlayer(name) {
  if (!Memory.players) {
    Memory.players = {};
  }

  var player = Memory.players[name];
  if (!player) {
    player = {
      name: name,
      rooms: {},
      level: 0,
      counter: 0
    };
    Memory.players[name] = player;
  }
  return player;
}

function addRoom(player, room) {
  if (!player.rooms[room.name]) {
    player.rooms[room.name] = {
      visited: Game.time
    };
    Memory.players[player.name] = player;
  }
}

function attack0(creep) {
  creep.log('Queuing level 0 attack from scout <------ ' + creep.memory.base);
  Game.notify(Game.time + ' ' + creep.room.name + ' Queuing autoattacker');
  Game.rooms[creep.memory.base].memory.queue.push({
    role: 'autoattackmelee',
    target: creep.room.name
  });
  return true;
}


function attack1(creep) {

}


module.exports = {

  attackRoom: function(creep) {
    if (config.autoattack.disabled) {
      return true;
    }
    var name;
    if (creep.room.controller.owner) {
      name = creep.room.controller.owner.username;
    } else {
      if (creep.room.controller.reservation) {
        name = creep.room.controller.reservation.username;
      } else {
        return;
      }
    }
    let friends = [];
    try {
      friends = require('friends');
    } catch (error) {

    }
    if (friends.indexOf(name) > -1) {
      return true;
    }

    var player = getPlayer(name);
    addRoom(player, creep.room);

    if (player.level === 0) {
      attack0(creep);
      player.counter++;
      if (player.counter > 5) {
        player.level = 1;
        player.counter = 0;
      }
      Memory.players[name] = player;
    }
    return true;
  }
};
