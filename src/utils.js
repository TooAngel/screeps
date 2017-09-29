/**
 * this should be a collection of useful functions,
 * they should be as general as they can be, so we can use them as often as possible
 **/
global.utils = {
  /**
   * return object.length if exist else return _.size
   *
   * @param {Array} object
   * @return {Number}
   */
  returnLength: function returnLength(object) {
    return (object && object.length) ? object.length : _.size(object);
  },

  showIdiots: function() {
    const idiots = _.sortBy(Memory.players, (o) => {
      return -o.idiot;
    });
    for (let i = 0; i < idiots.length; i++) {
      const idiot = idiots[i];
      console.log(idiot.name, idiot.idiot, idiot.level, idiot.counter);
    }
  },

  checkPlayers: function() {
    for (const name of Object.keys(Memory.players)) {
      const player = Memory.players[name];
      if (player.name === undefined) {
        player.name = name;
        console.log(`Missing name: ${name}`);
      }
      if (player.counter === undefined) {
        player.counter = 0;
        console.log(`Missing counter: ${name}`);
      }

      if (player.level === undefined) {
        player.level = 0;
        console.log(`Missing level: ${name}`);
      }
      if (player.idiot === undefined) {
        player.idiot = 0;
        console.log(`Missing idiot: ${name}`);
      }
    }
  },

  roomCheck: function() {
    for (const roomName in Memory.rooms) {
      if (Memory.rooms[roomName].state === 'Occupied') {
        console.log(`${roomName} ${Memory.rooms[roomName].player}`);
      }
    }
  },

  terminals: function() {
    console.log('Terminals:');
    for (const roomName of Memory.myRooms) {
      const room = Game.rooms[roomName];
      if (room.terminal) {
        console.log(`${roomName} ${JSON.stringify(room.terminal.store)}`);
      }
    }
  },

  csstats: function() {
    const aggregate = function(result, value, key) {
      result[value.pos.roomName] = (result[value.pos.roomName] || (result[value.pos.roomName] = 0)) + 1;
      return result;
    };
    const resultReduce = _.reduce(Game.constructionSites, aggregate, {});
    console.log(JSON.stringify(resultReduce));
  },

  memory: function() {
    for (const keys of Object.keys(Memory)) {
      console.log(keys, JSON.stringify(Memory[keys]).length);
    }
  },

  memoryRooms: function() {
    for (const keys of Object.keys(Memory.rooms)) {
      console.log(keys, JSON.stringify(Memory.rooms[keys]).length);
    }
  },

  memoryRoom: function(roomName) {
    for (const keys of Object.keys(Memory.rooms[roomName])) {
      console.log(keys, JSON.stringify(Memory.rooms[roomName][keys]).length);
    }
  },

  showReserveredRooms: function() {
    for (const roomName of Object.keys(Memory.rooms)) {
      const room = Memory.rooms[roomName];
      if (room.state === 'Reserved') {
        console.log(roomName, JSON.stringify(room.reservation));
      }
    }
  },

  checkMinerals: function() {
    const minerals = {};
    for (const name of Memory.myRooms) {
      const room = Game.rooms[name];
      if (room.terminal) {
        console.log(name, JSON.stringify(room.terminal.store));
        for (const mineral in room.terminal.store) {
          if (mineral === 'U') {
            console.log(room.name, room.terminal.store[mineral]);
          }
          if (!minerals[mineral]) {
            minerals[mineral] = room.terminal.store[mineral];
          } else {
            minerals[mineral] += room.terminal.store[mineral];
          }
        }
      }
    }

    console.log(JSON.stringify(minerals));
    console.log(minerals.U);
  },

  findRoomsWithMineralsToTransfer: function() {
    const minerals = {};
    for (const name of Memory.myRooms) {
      const room = Game.rooms[name];
      if (room.terminal) {
        if (room.terminal.store.energy < 10000) {
          continue;
        }
        console.log(name, JSON.stringify(room.terminal.store));
        for (const mineral in room.terminal.store) {
          if (mineral === 'U') {
            console.log(room.name, room.terminal.store[mineral]);
          }
          if (!minerals[mineral]) {
            minerals[mineral] = room.terminal.store[mineral];
          } else {
            minerals[mineral] += room.terminal.store[mineral];
          }
        }
      }
    }

    console.log(JSON.stringify(minerals));
    console.log(minerals.U);
  },

  queueCheck: function(roomName) {
    // todo move to global.utils
    // todo save functions by prop so creation should only be once
    const prop = function(prop) {
      return function(object) {
        return object[prop];
      };
    };

    const found = _.countBy(Memory.rooms[roomName].queue, prop('role'));
    console.log(JSON.stringify(found));
    return found;
  },

  stringToParts: function(stringParts) {
    if (!stringParts || typeof(stringParts) !== 'string') {
      return;
    }
    const partsConversion = {
      M: MOVE,
      C: CARRY,
      A: ATTACK,
      W: WORK,
      R: RANGED_ATTACK,
      T: TOUGH,
      H: HEAL,
      K: CLAIM,
    };
    const arrayParts = [];
    for (let i = 0; i < stringParts.length; i++) {
      arrayParts.push(partsConversion[stringParts.charAt(i)]);
    }
    return arrayParts;
  },
};
