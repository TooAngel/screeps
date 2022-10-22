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
      if (player.reputation === undefined) {
        player.reputation = 0;
        console.log(`Missing reputation: ${name}`);
      }
    }
  },

  roomCheck: function() {
    for (const roomName in Memory.rooms) {
      if (Memory.rooms[roomName].state === 'Occupied') {
        console.log(`${roomName} ${global.data.rooms[roomName].player}`);
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

  constructionSiteStats: function() {
    const aggregate = function(result, value) {
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

  showReservedRooms: function() {
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

  /**
   * from string format of creep parts String (tooAngel config format) to creep parts array (screeps format)
   *
   * @param {string} stringParts creep parts String
   * @return {undefined|string[]} creep parts array
   */
  stringToParts: function(stringParts) {
    if (!stringParts || typeof (stringParts) !== 'string') {
      return undefined;
    }
    const arrayParts = [];
    for (const partChar of stringParts) {
      let part;
      switch (partChar) {
      case 'M':
        part = MOVE;
        break;
      case 'C':
        part = CARRY;
        break;
      case 'A':
        part = ATTACK;
        break;
      case 'W':
        part = WORK;
        break;
      case 'R':
        part = RANGED_ATTACK;
        break;
      case 'T':
        part = TOUGH;
        break;
      case 'H':
        part = HEAL;
        break;
      case 'K':
        part = CLAIM;
        break;
      default:
        // should never enter
        part = MOVE;
        console.error('stringToParts illegal partChar : ' + part);
      }
      arrayParts.push(part);
    }
    return arrayParts;
  },

  splitRoomName: function(name) {
    const pattern = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
    return pattern.exec(name);
  },

  routeCallbackRoomHandle: function(roomName) {
    let returnValue;
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
    return returnValue;
  },

  routeCallback: function(to, useHighWay) {
    return function(roomName) {
      let returnValue = Infinity;
      if (roomName === to) {
        returnValue = 1;
      } else {
        if (Memory.rooms[roomName]) {
          returnValue = global.utils.routeCallbackRoomHandle(roomName);
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

  // unclaim functions
  killCreeps: function(room) {
    const creepsToKill = _.filter(Game.creeps, (c) => c.memory.base === room.name);
    room.log('creepsToKill', _.size(creepsToKill), _.map(creepsToKill, (c) => c.suicide()));
  },

  removeNextStructure: function(room) {
    let returnValue;
    const myStructuresToDestroy = _.sortBy(room.findMyStructures(), (s) => s.hitsMax);
    const controller = myStructuresToDestroy.shift();
    if (_.size(myStructuresToDestroy) > 0) {
      returnValue = myStructuresToDestroy[0].destroy();
    } else {
      returnValue = controller.unclaim();
      delete Memory.rooms[room.name];
    }
    room.log('removeNextStructure returns', returnValue,
      'next structure', myStructuresToDestroy[0],
      'total structures', _.size(myStructuresToDestroy),
      'controller', global.ex(controller));
    return returnValue;
  },

  // return: String with fixed width for rounded number
  leftPadRound: function(nr, lpad, digest) {
    return nr.toFixed(digest).padStart(lpad + digest + 1);
  },
};
