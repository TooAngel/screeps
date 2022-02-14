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
    if (playerName === '_GrimReaper') {
      player.reputation = Math.abs(player.reputation);
    }
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
  if (name === 'Invader') {
    return;
  }

  value = value || 0;
  Memory.players = Memory.players || {};

  initPlayer(name);

  if (!Memory.players[name].reputation) {
    Memory.players[name].reputation = 0;
  }

  Memory.players[name].reputation += value;
}

module.exports.addToReputation = addToReputation;

/**
 * initPlayer
 *
 * @param {string} name
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
}
module.exports.initPlayer = initPlayer;
