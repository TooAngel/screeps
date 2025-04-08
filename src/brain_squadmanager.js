'use strict';

const {debugLog} = require('./logging');

module.exports.isFriend = function(name) {
  if (!Memory.players) {
    Memory.players = {};
  }

  if (global.config.maliciousNpcUsernames.includes(name)) {
    return false;
  }
  if (friends.indexOf(name) > -1) {
    return true;
  }
  if (!Memory.players[name]) {
    return true;
  }
  if (Memory.players[name].reputation > 0) {
    return true;
  }
  if (name === 'Source Keeper') {
    return true;
  }
  return false;
};

module.exports.handleSquadManager = function() {
  if (Object.keys(Memory.squads).length > 0) {
    debugLog('brain', 'brain.handleSquadManager squads: ${Object.keys(Memory.squads).length}');
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
function addToQueue(spawns, roomNameFrom, roomNameTarget, squadName, queueLimit) {
  queueLimit = queueLimit || false;
  const outer = function(spawn) {
    return function _addToQueue() {
      if (queueLimit === false) {
        Memory.rooms[roomNameFrom].queue.push({
          role: spawn.role,
          routing: {
            targetRoom: roomNameTarget,
          },
          squad: squadName,
        });
      } else if (Memory.rooms[roomNameFrom].queue.length < queueLimit) {
        Memory.rooms[roomNameFrom].queue.push({
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
}
/**
 * startSquad used to attack player.rooms
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 */
function startSquad(roomNameFrom, roomNameAttack) {
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
  addToQueue(siegeSpawns, roomNameFrom, roomNameAttack, name);

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
}
module.exports.startSquad = startSquad;

/**
 * startMeleeSquad use to clean rooms from invaders and players
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 * @param {Array} [spawns]
 */
function startMeleeSquad(roomNameFrom, roomNameAttack, spawns) {
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
  addToQueue(spawns, roomNameFrom, roomNameAttack, name);

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
}
module.exports.startMeleeSquad = startMeleeSquad;
