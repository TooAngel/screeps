'use strict';

Room.prototype.inQueue = function(spawn) {
  for (var item of this.memory.queue) {
    if (item.role == spawn.role) {
      this.log(JSON.stringify(spawn) + ' alread in queue');
      return true;
    }
  }
  return false;
};

Room.prototype.getPartConfig = function(energy, parts) {
  var sum = 0;
  var i = 0;
  var partConfig = [];
  while (sum < energy && partConfig.length < 50) {
    var part = parts[i % parts.length];
    if (sum + BODYPART_COST[part] <= energy) {
      partConfig.push(part);
      sum += BODYPART_COST[part];
      i += 1;
    } else {
      break;
    }
  }
  return partConfig;
};


Room.pathToString = function(path) {
  if (!config.performance.serializePath) {
    return path;
  }

  //   console.log(path);
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
