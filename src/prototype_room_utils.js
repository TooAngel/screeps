'use strict';

Room.prototype.sortMyRoomsByLinearDistance = function(target) {
  let sortByLinearDistance = function(object) {
    return Game.map.getRoomLinearDistance(target, object);
  };

  return _.sortBy(Memory.myRooms, sortByLinearDistance);
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
  if (this.memory.misplacedSpawn && this.controller.level == 4) {
    offset = 300;
  }
  return this.energyCapacityAvailable - offset;
};

Room.prototype.splitRoomName = function() {
  var patt = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
  var result = patt.exec(this.name);
  return result;
};

Room.prototype.inQueue = function(spawn) {
  for (var item of this.memory.queue) {
    if (item.role != spawn.role) {
      continue;
    }
    if (spawn.routing && spawn.routing.targetId && item.routing) {
      if (item.routing.targetId != spawn.routing.targetId) {
        continue;
      }
    }
    if (spawn.routing && spawn.routing.targetRoom && item.routing) {
      if (item.routing.targetRoom != spawn.routing.targetRoom) {
        continue;
      }
    }
    return true;
  }
  return false;
};

Room.prototype.checkAndSpawnSourcer = function() {
  var sources = this.find(FIND_SOURCES);

  let source;

  let isSourcer = function(object) {
    if (object.memory.role != 'sourcer') {
      return false;
    }
    if (object.memory.routing && object.memory.routing.targetId != source.id) {
      return false;
    }
    if (object.memory.routing && object.memory.routing.targetRoom != source.pos.roomName) {
      return false;
    }
    return true;
  };

  for (source of sources) {
    let sourcers = this.find(FIND_MY_CREEPS, {
      filter: isSourcer
    });
    if (sourcers.length === 0) {
      //      this.log(source.id);
      this.checkRoleToSpawn('sourcer', 1, source.id, this.name);
    }
  }
};

Room.prototype.checkRoleToSpawn = function(role, amount, targetId, targetRoom, level) {
  if (targetRoom === undefined) {
    targetRoom = this.name;
  }
  if (amount === undefined) {
    amount = 1;
  }

  let creepMemory = {
    role: role,
    level: level,
    routing: {
      targetRoom: targetRoom,
      targetId: targetId
    }
  };

  if (this.inQueue(creepMemory)) {
    return false;
  }

  if (targetRoom === this.name) {
    let creeps = this.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        if (creep.memory.routing === undefined) {
          return false;
        }
        if (targetId !== undefined &&
          targetId !== creep.memory.routing.targetId) {
          return false;
        }
        if (targetRoom !== undefined &&
          targetRoom !== creep.memory.routing.targetRoom) {
          return false;
        }
        return creep.memory.role == role;
      }
    });
    if (creeps.length >= amount) {
      return false;
    }
  }

  let spawns = this.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_SPAWN;
    }
  });

  for (var spawn of spawns) {
    if (!spawn.spawning || spawn.spawning === null) {
      continue;
    }

    let creep = Game.creeps[spawn.spawning.name];
    if (creep.memory.role == role) {
      return false;
    }
    if (targetId && creep.memory.routing) {
      if (targetId != creep.memory.routing.targetId) {
        return false;
      }
    }
    if (creep.memory.routing) {
      if (targetRoom != creep.memory.routing.targetRoom) {
        return false;
      }
    }
  }
  this.memory.queue.push(creepMemory);
};

Room.prototype.checkParts = function(parts, actualCost, energy) {
  if (!parts) { return; }
  parts.foreach(
    function(p) {
      actualCost += BODYPART_COST[parts[p]];
      if (actualCost > energy) { return; }
    }
  );
  return actualCost;
};

Room.prototype.getPartConfig = function(datas) {

  let layout = datas.layout;
  let amount = datas.amount;
  let minEnergyStored = datas.minEnergyStored;
  let maxEnergyUsed = datas.maxEnergyUsed;
  let prefixParts = datas.prefixParts;
  let sufixParts = datas.sufixParts;
  let energyAvailable = this.energyAvailable;
  let parts = []; let cost = 0;

  if (minEnergyStored < energyAvailable) {return;}
  if (maxEnergyUsed < energyAvailable) {energyAvailable = maxEnergyUsed;}

  if (prefixParts) {
    let newCost = this.checkParts(prefixParts, 0, energyAvailable);
    if (newCost) {
      cost = newCost;
      parts.concat(prefixParts);
    } else {
      return;
    }
  }
  if (amount) { // if size is defined
    let pushAll = function(element, index, array) {
      for (let i = 0; i < element; i++) {
        parts.push(layout[index]);
        cost += BODYPART_COST[layout[index]];
      }
    };
    amount.foreach(pushAll);
    layout = parts;
    parts = [];
  }
  let i = 1; let j = 1;
  let halt = false;
  let layoutCost; let layoutParts; let part;
  while (!halt && parts.length + j <= 50) {
    layoutCost = 0; layoutParts = [];
    while (!halt && j <= layout.length && parts.length + j < 50) {
      part = layout[j - 1];
      layoutCost += BODYPART_COST[part];
      if (cost + layoutCost <= energyAvailable) {
        layoutParts.push(part);
      } else if (i > 1) {
        halt = true;
      } else { return; }
    }
    if (!halt) {
      cost += layoutCost;
      parts = parts.concat(layoutParts);
      j = 1; i++;
    }
  }
  parts = _.sortBy(parts, function(p) {
    return _.indexOf(layout, p) + 1;
  });
  return parts;
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
    let current = last.buildRoomPosition(parseInt(direction, 10));
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
