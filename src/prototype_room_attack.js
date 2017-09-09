'use strict';

/**
 * Attack42 is called so because 42 is the only true answer :-).
 *
 * USAGE: get a Room Object then .attack42('targetRoomName')
 * e.g. `Game.rooms[Memory.myRooms[0]].attack42('targetRoomName')``;.
 * TODO add an attack42 event if invader is seen by reserver, sourcer or carry.
 *
 * @example room.attack42('E5S3')
 *
 * @param {string} roomName - Should be your targetRoomName.
 * @param {Array} [spawn] - YourCustomSpawn Array of {creeps: creepsToAdd, role: 'rolesToAdd'}.
 *
 */
Room.prototype.attack42 = function(roomName, spawn) {
  spawn = spawn || [{
      creep: 1,
      role: 'autoattackmelee'
    }, {
      creep: 1,
      role: 'defender'
    }, {
      creep: 1,
      role: 'squadheal'
    },

    {
      creep: 2,
      role: 'autoattackmelee'
    }, {
      creep: 2,
      role: 'defender'
    }, {
      creep: 2,
      role: 'squadheal'
    }
  ];

  let closestSpawn = this.closestSpawn(roomName);
  if (closestSpawn && closestSpawn.id) {
    brain.startMeleeSquad(closestSpawn.room, roomName);
  }
};

const getClosestRoom = function(roomName) {
  let sortByDistance = function(object) {
    return Game.map.getRoomLinearDistance(roomName, object);
  };

  let roomsMy = _.sortBy(Memory.myRooms, sortByDistance);
  return Game.rooms[roomsMy[0]];
};

const attacks = {
  attack0: function(room) {
    const origin = getClosestRoom(room.name);
    origin.checkRoleToSpawn('autoattackmelee', 1, undefined, room.name);
    return true;
  },

  attack1: function(room) {
    const origin = getClosestRoom(room.name);
    brain.startSquad(origin.name, room.name);
    return true;
  },

  attack2: function(room) {
    const origin = getClosestRoom(room.name);
    origin.attack42(room.name);
    return true;
  }
};

const addRoom = function(player, room) {
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

const getPlayer = function(name) {
  brain.increaseIdiot(name, 0);
  return Memory.players[name];
};

Room.prototype.getOwnerName = function() {
  if (this.controller.owner) {
    return this.controller.owner.username;
  }

  if (this.controller.reservation) {
    return this.controller.reservation.username;
  }
  return;
};

Room.prototype.launchAutoAttack = function(player) {
  if (!player.lastAttacked) {
    player.lastAttacked = Game.time;
    Memory.players[player.name] = player;
  }
  const lastAttacked = player.lastAttacked;
  if (Game.time < lastAttacked + config.autoattack.timeBetweenAttacks) {
    return false;
  }
  this.log(`Queuing level ${player.level} attack`);
  if (config.autoattack.notify) {
    Game.notify(Game.time + ' ' + this.name + ' Queuing autoattacker');
  }
  attacks[`attack${player.level}`](this);
  player.counter++;
  if (player.counter > 10) {
    player.level += 1;
    player.counter = 0;
  }
  Memory.players[player.name] = player;
};

Room.prototype.attackRoom = function() {
  if (config.autoattack.disabled) {
    return true;
  }
  var name = this.getOwnerName();
  if (!name) {
    return;
  }

  // We only exclude players in the friends.js
  if (friends.indexOf(name) > -1) {
    return true;
  }

  var player = getPlayer(name);

  addRoom(player, this);

  if (player.level < 2) {
    this.launchAutoAttack(player);
  }
  return true;
};
