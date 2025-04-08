const {debugLog} = require('./logging');
const {getMyRoomWithinRange} = require('./helper_findMyRooms');
const {startSquad, startMeleeSquad} = require('./brain_squadmanager');

/**
 * checkPlayers
 *
 * - checks the room list of the player
 * - Announce top and bottom list in memory segments
 *
 * @return {void}
 */
function checkPlayers() {
  if (Game.time % config.diplomacy.checkPlayersInterval !== 0) {
    return;
  }
  Memory.players = Memory.players || {};
  for (const playerName of Object.keys(Memory.players)) {
    const player = Memory.players[playerName];
    player.reputation = player.reputation || 0;
    for (const roomName of Object.keys(player.rooms || {})) {
      const roomData = global.data.rooms[roomName];
      if (roomData) {
        if (roomData.player !== playerName) {
          if (config.debug.diplomacy) {
            console.log(`Player: ${playerName} Removing room from player list room: ${roomName} roomData.player: ${roomData.player}`);
          }
          delete player.rooms[roomName];
        }
      }
    }
  }

  RawMemory.setActiveSegments([1, 2]);
  RawMemory.setPublicSegments([1, 2]);
  RawMemory.setDefaultPublicSegment(1);

  const top = Object.keys(Memory.players).map((playerName) => {
    return {name: playerName, reputation: Memory.players[playerName].reputation};
  });
  top.sort((a, b) => b.reputation - a.reputation);
  RawMemory.segments[1] = JSON.stringify({
    'top': JSON.parse(JSON.stringify(top.slice(0, 10))),
  });
  RawMemory.segments[2] = JSON.stringify({
    'bottom': JSON.parse(JSON.stringify(top.reverse().slice(0, 10))),
  });
}

module.exports.checkPlayers = checkPlayers;

const findRoomPair = function(player) {
  for (const roomName of Object.keys(player.rooms).sort(() => 0.5 - Math.random())) {
    debugLog('diplomacy', `findRoomPairs for room ${roomName}`);
    const minRCL = ((global.data.rooms[roomName] || {}).controller || {}).level || config.autoAttack.minAttackRCL;
    const range = 7;
    const myRoomName = getMyRoomWithinRange(roomName, range, minRCL);
    if (myRoomName) {
      return {
        myRoomName: myRoomName,
        theirRoomName: roomName,
      };
    }
  }
  return false;
};

/**
 * getAttackAction
 *
 * Gets a fitting action for the player
 *
 * @param {object} player
 * @return {object}
 */
function getAttackAction(player) {
  const actions = [
    {
      name: 'simpleAttack',
      value: -1 * 1500,
      level: 0,
      execute: (roomPair) => {
        const origin = Game.rooms[roomPair.myRoomName];
        origin.checkRoleToSpawn('autoattackmelee', 1, undefined, roomPair.theirRoomName);
      },
    },
    {
      name: 'squad',
      value: -4 * 1500,
      level: 1,
      execute: (roomPair) => {
        startSquad(roomPair.myRoomName, roomPair.theirRoomName);
      },
    },
    {
      name: 'attack42',
      value: -6 * 1500,
      level: 2,
      execute: (roomPair) => {
        startMeleeSquad(roomPair.myRoomName, roomPair.theirRoomName);
      },
    },
  ];
  const possibleActions = actions.filter((action) => {
    if (action.value < player.reputation) {
      return false;
    }
    if (action.level < player.level) {
      return false;
    }
    return true;
  });

  if (possibleActions.length === 0) {
    debugLog('diplomacy', `No possible actions found`);
    player.lastAttacked = Game.time;
    return;
  }
  debugLog('diplomacy', `handleRetaliation player: ${JSON.stringify(player)} possibleActions: ${JSON.stringify(possibleActions)}`);
  possibleActions.sort(() => 0.5 - Math.random());
  return possibleActions[0];
}

/**
 * startAttack
 *
 * @param {object} player - The player to attack
 * @return {void}
 */
function startAttack(player) {
  const action = getAttackAction(player);
  if (!action) {
    player.lastAttacked = Game.time;
    return;
  }

  const roomPair = findRoomPair(player);
  if (!roomPair) {
    debugLog('diplomacy', `handleRetaliation: Can not find a fitting room pair`);
    player.lastAttacked = Game.time;
    return;
  }

  debugLog('diplomacy', `Running attack roomPair: ${JSON.stringify(roomPair)} action: ${JSON.stringify(action)}`);
  player.lastAttacked = Game.time;
  if (config.autoAttack.notify) {
    Game.notify(Game.time + ' ' + this.name + ' Queuing retaliation');
  }
  player.counter++;
  if (player.counter > 10) {
    player.level += 1;
    player.counter = 0;
  }
  action.execute(roomPair);
}
module.exports.startAttack = startAttack;

/**
 * handleRetaliation
 *
 * @param {object} player
 * @return {boolean|void}
 */
function handleRetaliation(player) {
  if (!player.lastAttacked) {
    player.lastAttacked = Game.time + config.autoAttack.timeBetweenAttacks;
  }
  if (Game.time < player.lastAttacked + config.autoAttack.timeBetweenAttacks) {
    // debugLog('diplomacy', `Too early to attack`);
    return false;
  }
  return startAttack(player);
}

/**
 * addToReputation
 *
 * Add value to the existing reputation of the player given by name
 *
 * @param {string} name
 * @param {number} value
 * @return {void}
 */
function addToReputation(name, value) {
  if (global.config.maliciousNpcUsernames.includes(name)) {
    return;
  }
  value = value || 0;
  Memory.players = Memory.players || {};

  const player = initPlayer(name);
  // debugLog('diplomacy', `addToReputation name: ${name} value: ${value} player: ${JSON.stringify(player)}`);

  if (!player.reputation) {
    player.reputation = 0;
  }

  player.reputation += value;

  if (value < 0) {
    try {
      handleRetaliation(player);
    } catch (e) {
      console.log('addToReputation');
      console.log(e);
      console.log(e.stack);
    }
  }
}

module.exports.addToReputation = addToReputation;

/**
 * initPlayer
 *
 * @param {string} name
 * @return {object}
 */
function initPlayer(name) {
  if (!Memory.players[name]) {
    Memory.players[name] = {
      name: name,
      rooms: {},
      level: 0,
      counter: 0,
      reputation: 0,
    };
  }
  return Memory.players[name];
}
module.exports.initPlayer = initPlayer;

/**
 * addRoomToPlayer
 *
 * @param {object} player
 * @param {object} room
 */
function addRoomToPlayer(player, room) {
  if (!player.rooms) {
    player.rooms = {};
  }
  if (!player.rooms[room.name]) {
    player.rooms[room.name] = {
      visited: Game.time,
    };
  }
}

module.exports.addRoomToPlayer = addRoomToPlayer;
