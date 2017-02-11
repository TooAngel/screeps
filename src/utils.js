/**
 * this should be a collection of useful functions,
 * they should be as general as they can be, so we can use them as often as possible
 **/
global.utils = {
  /**
   * return object.length if exist else return _.size
   *
   * @param {Array} object
   * @returns {*}
   */
  returnLength: function returnLength(object) {
    return (object && object.length) ? object.length : _.size(object);
  },

  checkPlayers: function() {
    for (let name in Memory.players) {
      let player = Memory.players[name];
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
    for (let roomName in Memory.rooms) {
      if (Memory.rooms[roomName].state === 'Occupied') {
        console.log(`${roomName} ${Memory.rooms[roomName].player}`);
      }
    }
  },

  terminals: function() {
    console.log('Terminals:');
    for (let roomName of Memory.myRooms) {
      let room = Game.rooms[roomName];
      if (room.terminal) {
        console.log(`${roomName} ${JSON.stringify(room.terminal.store)}`);
      }
    }
  },

  csstats: function() {
    let aggregate = function(result, value, key) {
      result[value.pos.roomName] = (result[value.pos.roomName] || (result[value.pos.roomName] = 0)) + 1;
      return result;
    };
    let resultReduce = _.reduce(Game.constructionSites, aggregate, {});
    console.log(JSON.stringify(resultReduce));
  },

  memory: function() {
    for (let keys in Memory) {
      console.log(keys, JSON.stringify(Memory[keys]).length);
    }
  },

  memoryRooms: function() {
    for (let keys in Memory.rooms) {
      console.log(keys, JSON.stringify(Memory.rooms[keys]).length);
    }
  },

  memoryRoom: function(roomName) {
    for (let keys in Memory.rooms[roomName]) {
      console.log(keys, JSON.stringify(Memory.rooms[roomName][keys]).length);
    }
  },

  showReserveredRooms: function() {
    for (let roomName in Memory.rooms) {
      let room = Memory.rooms[roomName];
      if (room.state === 'Reserved') {
        console.log(roomName, JSON.stringify(room.reservation));
      }
    }
  },

  checkMinerals: function() {
    let minerals = {};
    for (let name of Memory.myRooms) {
      let room = Game.rooms[name];
      if (room.terminal) {
        console.log(name, JSON.stringify(room.terminal.store));
        for (let mineral in room.terminal.store) {
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
    let minerals = {};
    for (let name of Memory.myRooms) {
      let room = Game.rooms[name];
      if (room.terminal) {
        if (room.terminal.store.energy < 10000) {
          continue;
        }
        console.log(name, JSON.stringify(room.terminal.store));
        for (let mineral in room.terminal.store) {
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
    let prop = function(prop) {
      return function(object) {
        return object[prop];
      };
    };

    var found = _.countBy(Memory.rooms[roomName].queue, prop('role'));
    console.log(JSON.stringify(found));
    return found;
  },

  stringToParts: function(stringParts) {
    if (!stringParts || typeof(stringParts) !== 'string') {
      return;
    }
    let partsConversion = {
      M: MOVE,
      C: CARRY,
      A: ATTACK,
      W: WORK,
      R: RANGED_ATTACK,
      T: TOUGH,
      H: HEAL,
      K: CLAIM,
    };
    let arrayParts = [];
    for (let i = 0; i < stringParts.length; i++) {
      arrayParts.push(partsConversion[stringParts.charAt(i)]);
    }
    return arrayParts;
  },
};
