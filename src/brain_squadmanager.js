'use strict';

const {debugLog} = require('./logging');

module.exports.handleSquadManager = function() {
  if (Object.keys(Memory.squads).length > 0) {
    debugLog('brain', `brain.handleSquadManager squads: ${Object.keys(Memory.squads).length}`);
  }
  for (const squadIndex of Object.keys(Memory.squads)) {
    const squad = Memory.squads[squadIndex];
    if (!squad.siege || Object.keys(squad.siege).length === 0) {
      continue;
    }
    if (squad.action === 'move') {
      let allReady = true;

      // Check if all siege creeps are waiting
      for (const siegeId of Object.keys(squad.siege)) {
        const siege = squad.siege[siegeId];
        if (!siege.waiting) {
          allReady = false;
          break;
        }
      }

      // Check if all heal creeps are waiting
      if (allReady) {
        for (const healId of Object.keys(squad.heal)) {
          const heal = squad.heal[healId];
          if (!heal.waiting) {
            allReady = false;
            break;
          }
        }
      }

      // Transition to attack if all creeps are ready
      if (allReady) {
        squad.action = 'attack';
      }
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
 * @return {void}
 */
function addToQueue(spawns, roomNameFrom, roomNameTarget, squadName, queueLimit) {
  for (const spawn of spawns) {
    _.times(spawn.creeps, () => {
      // Check queue limit if specified
      if (queueLimit && Memory.rooms[roomNameFrom].queue.length >= queueLimit) {
        return;
      }

      Memory.rooms[roomNameFrom].queue.push({
        role: spawn.role,
        routing: {
          targetRoom: roomNameTarget,
        },
        squad: squadName,
      });
    });
  }
}

/**
 * createSquad - Internal helper to create squad with consistent structure
 *
 * @param {String} type - Squad type prefix for naming (e.g., 'siege', 'melee')
 * @param {String} roomNameFrom - Room to spawn creeps from
 * @param {String} roomNameAttack - Target room to attack
 * @param {Array} spawns - Array of spawn definitions {creeps: number, role: string}
 * @param {Object} squadTypes - Object with squad role types as keys (e.g., {siege: {}, heal: {}})
 * @return {String} Squad name
 */
function createSquad(type, roomNameFrom, roomNameAttack, spawns, squadTypes) {
  const name = `${type}-${roomNameFrom}-${roomNameAttack}-${Game.time}`;
  const route = Game.map.findRoute(roomNameFrom, roomNameAttack);
  const target = route.length > 1 ? route[route.length - 2].room : roomNameFrom;

  Memory.squads = Memory.squads || {};
  addToQueue(spawns, roomNameFrom, roomNameAttack, name);

  Memory.squads[name] = {
    born: Game.time,
    target: roomNameAttack,
    from: roomNameFrom,
    route: route,
    action: 'move',
    moveTarget: target,
    ...squadTypes,
  };

  return name;
}

/**
 * startSquad used to attack player.rooms
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 * @return {String} Squad name
 */
function startSquad(roomNameFrom, roomNameAttack) {
  const siegeSpawns = [{
    creeps: 1,
    role: 'squadsiege',
  }, {
    creeps: 3,
    role: 'squadheal',
  }];

  return createSquad('siege', roomNameFrom, roomNameAttack, siegeSpawns, {
    siege: {},
    heal: {},
  });
}
module.exports.startSquad = startSquad;

/**
 * startMeleeSquad use to clean rooms from invaders and players
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 * @param {Array} [spawns]
 * @return {String} Squad name
 */
function startMeleeSquad(roomNameFrom, roomNameAttack, spawns) {
  // TODO check for queue length
  const defaultSpawns = [{
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

  return createSquad('melee', roomNameFrom, roomNameAttack, spawns || defaultSpawns, {
    autoattackmelee: {},
    heal: {},
  });
}
module.exports.startMeleeSquad = startMeleeSquad;
