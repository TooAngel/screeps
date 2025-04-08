const {startAttack} = require('./diplomacy');

/**
 * This module is used to allow player easy access to different actions on the NPC
 * like asking for reports, triggering attacks, ...
 */

global.utils = {
  /**
   * Show queue
   *
   * @param {string} roomName
   */
  showQueue: (roomName) => {
    const memory = Memory.rooms[roomName];
    if (!memory) {
      console.log('room not found');
      return;
    }
    console.log(memory.queue.map((item) => item.role));
  },
  /**
   * Attack player
   *
   * @param {string} playerName
   */
  attack: (playerName) => {
    const player = Memory.players[playerName];
    if (!player) {
      console.log('player not found');
      return;
    }
    startAttack(player);
  },
  /**
   * Print out known players
   */
  printPlayers: function() {
    for (const playerKey of Object.keys(Memory.players)) {
      const player = Memory.players[playerKey];
      console.log(`${player.name} rooms: ${Object.keys(player.rooms).length} level: ${player.level} counter: ${player.counter} reputation: ${player.reputation}`);
    }
    // console.log(JSON.stringify(Memory.players, null, 2));
  },

  /**
   *  roomCheck, checks for occupied rooms
   */
  roomCheck: function() {
    for (const roomName in Memory.rooms) {
      if (Memory.rooms[roomName].state === 'Occupied') {
        console.log(`${roomName} ${global.data.rooms[roomName].player}`);
      }
    }
    console.log('roomCheck - done');
  },

  /**
   * Prinst out the status of all terminals
   */
  terminals: function() {
    console.log('Terminals:');
    for (const roomName of Memory.myRooms) {
      const room = Game.rooms[roomName];
      if (room.terminal) {
        console.log(`${roomName} ${JSON.stringify(room.terminal.store)}`);
      }
    }
    console.log('terminals - done');
  },


  /**
   * Lists the number of constructionSites per rooms
   */
  constructionSiteStats: function() {
    const aggregate = function(result, value) {
      result[value.pos.roomName] = (result[value.pos.roomName] || (result[value.pos.roomName] = 0)) + 1;
      return result;
    };
    const resultReduce = _.reduce(Game.constructionSites, aggregate, {});
    console.log(JSON.stringify(resultReduce));
    console.log('constructionSiteStats - done');
  },

  /**
   * Prints the memory usage for the different keys
   */
  memory: function() {
    for (const keys of Object.keys(Memory)) {
      console.log(keys, JSON.stringify(Memory[keys]).length);
    }
    console.log('memory - done');
  },

  /**
   * Prints the memory usage for the different rooms
   */
  memoryRooms: function() {
    for (const keys of Object.keys(Memory.rooms)) {
      console.log(keys, JSON.stringify(Memory.rooms[keys]).length);
    }
    console.log('memoryRooms - done');
  },

  /**
   * Prints the memory usage for a specific room
   *
   * @param {string} roomName
   */
  memoryRoom: function(roomName) {
    for (const keys of Object.keys(Memory.rooms[roomName])) {
      console.log(keys, JSON.stringify(Memory.rooms[roomName][keys]).length);
    }
    console.log('memoryRoom - done');
  },

  /**
   * Prints all reserved rooms
   */
  showReservedRooms: function() {
    for (const roomName of Object.keys(Memory.rooms)) {
      const room = Memory.rooms[roomName];
      if (room.state === 'Reserved') {
        console.log(roomName, JSON.stringify(room.reservation));
      }
    }
    console.log('showReservedRooms - done');
  },

  /**
   * Shows the queue aggregated by role
   *
   * @param {string} roomName
   */
  queueCheck: function(roomName) {
    const found = _.countBy(Memory.rooms[roomName].queue, (object) => object.role);
    console.log(JSON.stringify(found));
  },
};
