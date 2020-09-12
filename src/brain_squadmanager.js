'use strict';

brain.initPlayer = function(name) {
  if (!Memory.players[name]) {
    Memory.players[name] = {
      name: name,
      rooms: {},
      level: 0,
      counter: 0,
      idiot: 0,
      reputation: 0,
    };
  }
};

brain.increaseIdiot = function(name, value) {
  if (name === 'Invader') {
    return false;
  }

  value = value || 1;
  Memory.players = Memory.players || {};

  brain.initPlayer(name);

  if (!Memory.players[name].idiot) {
    Memory.players[name].idiot = 0;
  }

  Memory.players[name].idiot += value;
};

brain.isFriend = function(name) {
  if (!Memory.players) {
    Memory.players = {};
  }

  if (name === 'Invader') {
    return false;
  }
  if (friends.indexOf(name) > -1) {
    return true;
  }
  if (!Memory.players[name]) {
    return true;
  }
  if (!Memory.players[name].idiot) {
    return true;
  }
  if (Memory.players[name].idiot <= 0) {
    return true;
  }
  if (name === 'Source Keeper') {
    return true;
  }
  return false;
};

brain.handleSquadmanager = function() {
  if (Object.keys(Memory.squads).length > 0) {
    brain.debugLog('brain', 'brain.handleSquadmanager squads: ${Object.keys(Memory.squads).length}');
  }
  for (const squadIndex of Object.keys(Memory.squads)) {
    const squad = Memory.squads[squadIndex];
    if (!squad.siege || Object.keys(squad.siege).length === 0) {
      return true;
    }
    if (squad.action === 'move') {
      for (const siegeId of Object.keys(squad.siege)) {
        const siege = squad.siege[siegeId];
        if (!siege.waiting) {
          return true;
        }
      }
      for (const healId of Object.keys(squad.heal)) {
        const heal = squad.heal[healId];
        if (!heal.waiting) {
          return true;
        }
      }

      squad.action = 'attack';
    }
  }
};

/**
 * TODO atm addToQueue is only for squad creation usable
 * TODO check for queue.length split queue creation to all unused (or less than closestSpawn.memory.queue.length) spawns in range (e.g. under 6 rooms, move '6' to config or room.memory)
 *
 * @param {Array} spawns  Array of Objects like {creeps: 1, role: 'squadsiege'}
 * @param {String} roomNameFrom  pushing to Game.rooms[roomNameFrom].memory.queue
 * @param {String} roomNameTarget routing target
 * @param {String} squadName
 * @param {Number} [queueLimit] don't push if queueLimit is reached
 */
brain.addToQueue = function(spawns, roomNameFrom, roomNameTarget, squadName, queueLimit) {
  queueLimit = queueLimit || false;
  const outer = function(spawn) {
    return function _addToQueue() {
      if (queueLimit === false) {
        Game.rooms[roomNameFrom].memory.queue.push({
          role: spawn.role,
          routing: {
            targetRoom: roomNameTarget,
          },
          squad: squadName,
        });
      } else if (Game.rooms[roomNameFrom].memory.queue.length < queueLimit) {
        Game.rooms[roomNameFrom].memory.queue.push({
          role: spawn.role,
          routing: {
            targetRoom: roomNameTarget,
          },
          squad: squadName,
        });
      }
    };
  };

  for (const spawn of spawns) {
    _.times(spawn.creeps, outer(spawn));
  }
};
/**
 * brain.startSquad used to attack player.rooms
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 */
brain.startSquad = function(roomNameFrom, roomNameAttack) {
  const name = 'siegesquad-' + Math.random();
  const route = Game.map.findRoute(roomNameFrom, roomNameAttack);
  let target = roomNameFrom;
  if (route.length > 1) {
    target = route[route.length - 2].room;
  }
  Memory.squads = Memory.squads || {};

  const siegeSpawns = [{
    creeps: 1,
    role: 'squadsiege',
  }, {
    creeps: 3,
    role: 'squadheal',
  }];
  this.addToQueue(siegeSpawns, roomNameFrom, roomNameAttack, name);

  Memory.squads[name] = {
    born: Game.time,
    target: roomNameAttack,
    from: roomNameFrom,
    siege: {},
    heal: {},
    route: route,
    action: 'move',
    moveTarget: target,
  };
};

/**
 * brain.startMeleeSquad use to clean rooms from invaders and players
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 * @param {Array} [spawns]
 */
brain.startMeleeSquad = function(roomNameFrom, roomNameAttack, spawns) {
  const name = 'meleesquad-' + Math.random();
  const route = Game.map.findRoute(roomNameFrom, roomNameAttack);
  let target = roomNameFrom;
  if (route.length > 1) {
    target = route[route.length - 2].room;
  }
  Memory.squads = Memory.squads || {};
  // TODO check for queue length
  const meleeSpawn = [{
    creeps: 1,
    role: 'autoattackmelee',
  }, {
    creeps: 1,
    role: 'squadheal',
  }, {
    creeps: 2,
    role: 'autoattackmelee',
  }, {
    creeps: 2,
    role: 'squadheal',
  }];

  spawns = spawns || meleeSpawn;
  this.addToQueue(spawns, roomNameFrom, roomNameAttack, name);

  Memory.squads[name] = {
    born: Game.time,
    target: roomNameAttack,
    from: roomNameFrom,
    autoattackmelee: {},
    heal: {},
    route: route,
    action: 'move',
    moveTarget: target,
  };
};
