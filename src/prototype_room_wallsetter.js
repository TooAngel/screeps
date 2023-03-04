'use strict';

Room.prototype.buildBlockers = function() {
  this.debugLog('baseBuilding', 'buildBlockers: ' + this.memory.controllerLevel.buildBlockersInterval);

  const spawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (spawns.length === 0) {
    return false;
  }

  if (this.closeExitsByPath()) {
    return true;
  }
  return this.checkRamparts();
};

Room.prototype.checkRamparts = function() {
  const room = Game.rooms[this.name];
  if (!room.memory.walls) {
    return false;
  }
  for (const rampart of room.memory.walls.ramparts) {
    const pos = new RoomPosition(rampart.x, rampart.y, rampart.roomName);
    pos.createConstructionSite(STRUCTURE_RAMPART);
  }
};

Room.prototype.checkExitsAreReachable = function() {
  // Make sure every exit is reachable

  const inLayer = function(room, pos) {
    for (let i = 0; i < room.memory.walls.layer_i; i++) {
      for (const j of Object.keys(room.memory.walls.layer[i])) {
        const position = room.memory.walls.layer[i][j];
        if (pos.x === position.x && pos.y === position.y) {
          return true;
        }
      }
    }
    return false;
  };
  const costMatrixBase = this.getMemoryCostMatrix();

  const exits = this.find(FIND_EXIT);
  const room = this;
  const callbackNew = function() {
    const costMatrix = room.getMemoryCostMatrix();
    return costMatrix;
  };
  for (const exit of exits) {
    const targets = [{
      pos: this.controller.pos,
      range: 1,
    }];

    let search = PathFinder.search(
      exit,
      targets, {
        roomCallback: callbackNew,
        maxRooms: 1,
      },
    );

    if (search.incomplete) {
      search = PathFinder.search(
        exit,
        targets, {
          maxRooms: 1,
        },
      );
      for (const pathPos of search.path) {
        if (inLayer(this, pathPos)) {
          this.memory.walls.ramparts.push(pathPos);
          costMatrixBase.set(pathPos.x, pathPos.y, 0);
          this.setMemoryCostMatrix(costMatrixBase);
        }
      }
    }
  }
};

const inLayer = function(room, pos) {
  for (let i = 0; i < room.memory.walls.layer_i; i++) {
    for (const j of Object.keys(room.memory.walls.layer[i])) {
      const position = room.memory.walls.layer[i][j];
      if (pos.isEqualTo(position.x, position.y)) {
        return true;
      }
    }
  }
  return false;
};

Room.prototype.initMemoryWalls = function() {
  if (!this.memory.walls || !this.memory.walls.layer) {
    this.debugLog('baseBuilding', 'closeExitsByPath: Reset walls');
    this.memory.walls = {
      exit_i: 0,
      ramparts: [],
      layer_i: 0,
      // TODO as array?
      layer: {
        0: [],
      },
    };
  }
  if (!this.memory.walls.layer[this.memory.walls.layer_i]) {
    this.memory.walls.layer[this.memory.walls.layer_i] = [];
  }
};

const callbackCloseExitsByPath = function(room) {
  return (roomName, costMatrix) => {
    if (!costMatrix) {
      costMatrix = new PathFinder.CostMatrix();
    }
    for (const avoidIndex of Object.keys(room.memory.walls.ramparts)) {
      const avoidPos = room.memory.walls.ramparts[avoidIndex];
      costMatrix.set(avoidPos.x, avoidPos.y, 0xFF);
    }
    for (const avoidIndex of Object.keys(room.memory.walls.layer[room.memory.walls.layer_i])) {
      const avoidPos = room.memory.walls.layer[room.memory.walls.layer_i][avoidIndex];
      costMatrix.set(avoidPos.x, avoidPos.y, 0xFF);
    }

    return costMatrix;
  };
};

const getTargets = function(room) {
  const targets = [{
    pos: room.controller.pos,
    range: 1,
  }];
  const sources = room.findSources();
  for (const sourceId of Object.keys(sources)) {
    targets.push({
      pos: sources[sourceId].pos,
      range: 1,
    });
  }
  return targets;
};

/**
 * isWallPlaceable
 *
 * @param {object} pos
 * @return {boolean}
 */
function isWallPlaceable(pos) {
  const exit = pos.findClosestByRange(FIND_EXIT);
  const range = pos.getRangeTo(exit);
  return range > 1;
}

/**
 * layerFinished
 *
 * @param {object} room
 * @return {boolean}
 */
function layerFinished(room) {
  room.memory.walls.exit_i = 0;
  room.memory.walls.layer_i++;
  if (room.memory.walls.layer_i >= config.layout.wallThickness) {
    room.memory.walls.finished = true;
    return false;
  }
  return true;
}

/**
 * getPath
 *
 * @param {object} room
 * @param {array} exits
 * @return {array | undefined}
 */
function getPath(room, exits ) {
  const exit = exits[room.memory.walls.exit_i];
  const targets = getTargets(room);
  const {path, incomplete} = PathFinder.search(
    exit,
    targets, {
      roomCallback: callbackCloseExitsByPath(room),
      maxRooms: 1,
    },
  );

  if (incomplete) {
    room.memory.walls.exit_i++;
    return;
  }
  return path;
}

/**
 * closePosition
 *
 * @param {object} room
 * @param {object} pathPos
 * @return {number}
 */
function closePosition(room, pathPos) {
  let structure = STRUCTURE_WALL;
  const costMatrixBase = room.getMemoryCostMatrix();
  if (pathPos.inPath()) {
    structure = STRUCTURE_RAMPART;
    costMatrixBase.set(pathPos.x, pathPos.y, 0);
    room.memory.walls.ramparts.push(pathPos);
  } else if (pathPos.inPositions()) {
    structure = STRUCTURE_RAMPART;
    room.debugLog('baseBuilding', 'closeExitsByPath: pathPos in Positions: ' + pathPos);
    room.memory.walls.ramparts.push(pathPos);
  } else {
    costMatrixBase.set(pathPos.x, pathPos.y, 0xff);
  }
  room.setMemoryCostMatrix(costMatrixBase);
  room.memory.walls.layer[room.memory.walls.layer_i].push(pathPos);
  return pathPos.createConstructionSite(structure);
}

Room.prototype.closeExitsByPath = function() {
  if (this.memory.walls && this.memory.walls.finished) {
    return false;
  }

  this.initMemoryWalls();

  const exits = this.find(FIND_EXIT);
  if (this.memory.walls.exit_i >= exits.length) {
    return layerFinished(this);
  }

  const path = getPath(this, exits);
  if (!path) {
    return true;
  }
  for (const pathPosPlain of path) {
    const pathPos = new RoomPosition(pathPosPlain.x, pathPosPlain.y, this.name);
    if (isWallPlaceable(pathPos)) {
      if (inLayer(this, pathPos)) {
        continue;
      }

      const returnCode = closePosition(this, pathPos);
      if (returnCode === ERR_FULL) {
        return false;
      }
      if (returnCode === ERR_INVALID_TARGET) {
        return false;
      }
      return true;
    }
  }
  // I guess when the position is near to the exit (e.g. source on x: 47
  // TODO I think this can break the setup, It will find the way to this source which is in the walls / ramparts and skip the others
  this.memory.walls.exit_i++;
  return true;
};
