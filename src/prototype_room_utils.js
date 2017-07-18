'use strict';

Room.prototype.sortMyRoomsByLinearDistance = function(target) {
  let sortByLinearDistance = function(object) {
    return Game.map.getRoomLinearDistance(target, object);
  };

  return _.sortBy(Memory.myRooms, sortByLinearDistance);
};

Room.prototype.nearestRoomName = function(roomsNames, limit) {
  let roomName = this.name;
  let filterByLinearDistance = function(object) {
    let dist = Game.map.getRoomLinearDistance(roomName, object);
    return dist <= limit;
  };
  roomsNames = _.filter(roomsNames, filterByLinearDistance);
  let sortByLinearDistance = function(object) {
    let dist = Game.map.getRoomLinearDistance(roomName, object);
    return dist;
  };
  return _.min(roomsNames, sortByLinearDistance);
};

Room.getPropertyFilterOptsObj = function(property, properties, without = false, opts = {}) {
  const table = {};
  _.each(properties, e => table[e] = true);
  const propParts = property.split('.');
  return Object.assign({}, opts, {
    filter: s => {
      let propValue = s;
      for (let prop of propParts) {
        propValue = propValue[prop];
      }
      return without ? !table[propValue] : table[propValue] && (!opts.filter || opts.filter(s));
    }
  });
};

/**
 * use a static array for filter a find.
 *
 * @param  {Number}  findTarget      one of the FIND constant. e.g. [FIND_MY_STRUCTURES]
 * @param  {String}  property        the property to filter on. e.g. 'structureType' or 'memory.role'
 * @param  {Array}  properties      the properties to filter. e.g. [STRUCTURE_ROAD, STRUCTURE_RAMPART]
 * @param  {Boolean} [without=false] Exclude or include the properties to find.
 * @param  {object} [opts={}] Additional options.
 * @param  {function} [opts.filter] Additional filter that wil be applied after cache.
 * @return {Array}                  the objects returned in an array.
 */
Room.prototype.findPropertyFilter = function(findTarget, property, properties, without = false, opts = {}) {
  let key = `${findTarget} ${property} ${properties} ${without}`;
  this.checkCache();

  let result;
  if (cache.rooms[this.name].find[key] && cache.rooms[this.name].find[key].time === Game.time) {
    // this.log(`Found ${key} ${cache.rooms[this.name].find[key]}`);
    result = cache.rooms[this.name].find[key].result;
  } else {
    const opts = Room.getPropertyFilterOptsObj(property, properties, without);
    result = this.find(findTarget, opts);
    cache.rooms[this.name].find[key] = {
      time: Game.time,
      result: result
    };
  }
  if (opts.filter) {
    return _.filter(result, opts.filter);
  } else {
    return result;
  }
};

Room.prototype.closestSpawn = function(target) {
  let pathLength = {};
  let roomsMy = this.sortMyRoomsByLinearDistance(target);

  for (let room of roomsMy) {
    let route = Game.map.findRoute(room, target);
    let routeLength = global.utils.returnLength(route);

    if (route && routeLength) {
      //TODO @TooAngel please review: save found route from target to myRoom Spawn by shortest route!
      //Memory.rooms[room].routing = Memory.rooms[room].routing || {};
      //Memory.rooms[room].routing[room + '-' + target] = Memory.rooms[room].routing[room + '-' + target] || {
      //    path: room + '-' + route,
      //    created: Game.time,
      //    fixed: false,
      //    name: room + '-' + target,
      //    category: 'moveToByClosestSpawn'
      //  };

      pathLength[room] = {
        room: room,
        route: route,
        length: routeLength
      };
    }
  }

  let shortest = _.sortBy(pathLength, global.utils.returnLength);
  return _.first(shortest).room;
};

Room.prototype.getEnergyCapacityAvailable = function() {
  let offset = 0;
  if (this.memory.misplacedSpawn && this.controller.level === 4) {
    offset = 300;
  }
  return this.energyCapacityAvailable - offset;
};

Room.prototype.splitRoomName = function() {
  var patt = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
  var result = patt.exec(this.name);
  return result;
};

Room.pathToString = function(path) {
  if (!config.performance.serializePath) {
    return path;
  }

  let result = path[0].roomName + ':';
  result += path[0].x.toString().lpad('0', 2) + path[0].y.toString().lpad('0', 2);
  let last;
  for (let pos of path) {
    if (!last) {
      last = new RoomPosition(pos.x, pos.y, pos.roomName);
      continue;
    }
    let current = new RoomPosition(pos.x, pos.y, pos.roomName);
    result += last.getDirectionTo(current);
    last = current;
  }
  //   console.log(result);
  return result;
};

Room.stringToPath = function(string) {
  if (!config.performance.serializePath) {
    return string;
  }

  let parts = string.split(':');
  let roomName = parts[0];
  string = parts[1];
  let path = [];
  let x = parseInt(string.slice(0, 2), 10);
  string = string.substring(2);
  let y = parseInt(string.slice(0, 2), 10);
  string = string.substring(2);
  let last = new RoomPosition(x, y, roomName);
  path.push(last);
  for (let direction of string) {
    let current = last.getAdjacentPosition(parseInt(direction, 10));
    path.push(current);
    last = current;
  }
  //   console.log(path);
  return path;
};

Room.test = function() {
  let original = Memory.rooms.E37N35.routing['pathStart-harvester'].path;
  let string = Room.pathToString(original);
  let path = Room.stringToPath(string);
  for (let i in Memory.rooms.E37N35.routing['pathStart-harvester'].path) {
    if (original[i].x != path[i].x) {
      console.log('x unequal', i, original[i].x, path[i].x);
    }
    if (original[i].y != path[i].y) {
      console.log('y unequal', i, original[i].y, path[i].y);
    }
    if (original[i].roomName != path[i].roomName) {
      console.log('roomName unequal', i, original[i].roomName, path[i].roomName);
    }
  }
};
