// todo-msc i did not find a better place to put this 3 functions at
// courtesy of @warinternal Aug 2016
global.ex = (x, y) => (y) ? JSON.stringify(x) : JSON.stringify(x, null, 2);
// https://en.wikipedia.org/wiki/Sigmoid_function
global.sigmoid = (x) => 1 + Math.tanh((2 * x) - 1);
// sigmoid on Game.cpu.limit + Game.cpu.bucket
global.cpuLimit = () => _.ceil(Game.cpu.limit * global.sigmoid(Game.cpu.bucket / 10000));

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

  // todo-msc: changed for lower room level (2) added (* 10)
  levelToSendNext: function(baseRoom, parts) {
    let returnValue = 0;
    /* eslint-disable */
    switch (baseRoom.controller.level) {
      case 0:
      case 1:
      case 2:
      case 3:
        returnValue = parts.carryParts.carry * CARRY_CAPACITY * 10;
        break;
      case 4:
        returnValue = parts.carryParts.carry * CARRY_CAPACITY * 5;
        break;
      case 5:
        returnValue = parts.carryParts.carry * CARRY_CAPACITY * 4;
        break;
      case 6:
        returnValue = parts.carryParts.carry * CARRY_CAPACITY * 3;
        break;
      case 7:
        returnValue = parts.carryParts.carry * CARRY_CAPACITY * 3;
        break;
      case 8:
        returnValue = parts.carryParts.carry * CARRY_CAPACITY;
        break;
    }
    /* eslint-enable */
    return returnValue;
  },

  splitRoomName: function(name) {
    const patt = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
    return patt.exec(name);
  },

  routeCallback: function(to, useHighWay) {
    return function(roomName, fromRoomName) {
      let returnValue = Infinity;
      if (roomName === to) {
        returnValue = 1;
      } else {
        if (Memory.rooms[roomName]) {
          if (Memory.rooms[roomName].state === 'Occupied') {
            // console.log(Game.time, `Creep.prototype.getRoute: Do not route through occupied rooms ${roomName}`);
            if (config.path.allowRoutingThroughFriendRooms && friends.indexOf(Memory.rooms[roomName].player) > -1) {
              console.log('routing through friendly room' + roomName);
              returnValue = 1;
            } else {
              // console.log(Game.time, 'Not routing through enemy room' + roomName);
              returnValue = Infinity;
            }
          }
          if (Memory.rooms[roomName].state === 'Blocked') {
            // console.log(Game.time, `Creep.prototype.getRoute: Do not route through blocked rooms ${roomName}`);
            returnValue = Infinity;
          }
        }
        if (useHighWay) {
          const nameSplit = global.utils.splitRoomName(roomName);
          if (nameSplit[2] % 10 === 0 || nameSplit[4] % 10 === 0) {
            returnValue = 0.5;
          } else {
            returnValue = 2;
          }
        } else {
          returnValue = 1;
        }
      }
      return returnValue;
    };
  },
};
