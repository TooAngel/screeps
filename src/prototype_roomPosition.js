'use strict';

RoomPosition.prototype.findInRangeStructures = function(structures, range, structureTypes) {
  return this.findInRange(FIND_STRUCTURES, 1, {
    filter: function(object) {
      return structureTypes.indexOf(object.structureType) >= 0;
    }
  });
};

RoomPosition.prototype.findClosestStructure = function(structures, structureType) {
  return this.findClosestByPath(structures, {
    filter: function(object) {
      return object.structureType === structureType;
    }
  });
};

RoomPosition.prototype.getAdjacentPosition = function(direction) {
  var adjacentPos = [
    [0, 0],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1]
  ];
  return new RoomPosition(this.x + adjacentPos[direction][0], this.y + adjacentPos[direction][1], this.roomName);
};

RoomPosition.prototype.checkForWall = function() {
  return this.lookFor(LOOK_TERRAIN)[0] === 'wall';
};

RoomPosition.prototype.inPath = function() {
  let room = Game.rooms[this.roomName];
  for (let pathName in room.getMemoryPaths()) {
    let path = room.getMemoryPath(pathName);
    for (let pos of path) {
      if (this.isEqualTo(pos.x, pos.y)) {
        return true;
      }
    }
  }
  return false;
};

RoomPosition.prototype.inPositions = function() {
  let room = Game.rooms[this.roomName];

  if (!room.memory.position) {
    return false;
  }

  for (let creepId in room.memory.position.creep) {
    let pos = room.memory.position.creep[creepId];
    if (!pos) {
      // TODO introduce this.log()
      console.log('inPositions:', this.roomName, creepId);
      continue;
    }
    if (this.isEqualTo(pos.x, pos.y)) {
      return true;
    }
  }
  for (let structureId in room.memory.position.structure) {
    let poss = room.memory.position.structure[structureId];
    for (let pos of poss) {
      // TODO special case e.g. when powerSpawn can't be set on costmatrix.setup - need to be fixed there
      if (!pos) {
        continue;
      }
      if (this.isEqualTo(pos.x, pos.y)) {
        return true;
      }
    }
  }

  return false;
};

RoomPosition.prototype.isExit = function() {
  if (this.x <= 1 || this.x >= 48 || this.y <= 1 || this.y >= 48) {
    return true;
  }
  return false;
};

RoomPosition.prototype.validPosition = function() {
  if (this.isExit()) {
    return false;
  }
  if (this.checkForWall()) {
    return false;
  }
  if (this.inPositions()) {
    return false;
  }
  if (this.inPath()) {
    return false;
  }
  return true;
};

RoomPosition.prototype.buildRoomPosition = function(direction, distance) {
  if (distance > 1) {
    console.log('!!!! Distance > 1 not yet implemented');
  }
  return this.getAdjacentPosition((direction - 1) % 8 + 1);
};

RoomPosition.prototype.findNearPosition = function*() {
  let distanceMax = 1;
  for (let distance = 1; distance <= distanceMax; distance++) {
    for (let direction = 1; direction <= 8 * distance; direction++) {
      let posNew = this.buildRoomPosition(direction, distance);
      if (!posNew.validPosition()) {
        //        console.log(posNew + ' - invalid');
        continue;
      }
      // Single position or array
      // Array?, because path and structures are arrays?
      yield posNew;
    }
  }
};
