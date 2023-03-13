'use strict';

RoomPosition.prototype.findClosestStructureWithMissingEnergyByRange = function(filter) {
  const structure = this.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (object) => (object.store && object.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && (!filter || filter(object))),
  });
  return structure;
};

RoomPosition.prototype.clearPosition = function(target) {
  const structures = this.lookFor('structure');
  for (const structureId of Object.keys(structures)) {
    const structure = structures[structureId];
    if (structure.structureType === STRUCTURE_SPAWN) {
      const spawns = this.getRoom().findSpawn();
      if (spawns.length <= 1) {
        target.remove();
        return true;
      }
    }
    if (structure.structureType === target.structureType) {
      console.log(`Trying to clear Position for constructionSite, while target already correct structure: ${structure.structureType} ${structure.pos}`);
      continue;
    }
    console.log(`Destroying: ${structure.structureType} ${structure.pos}`);
    structure.destroy();
  }
};

RoomPosition.prototype.getClosestSource = function(filter) {
  let source = this.findClosestByPath(FIND_SOURCES_ACTIVE, {
    filter,
  });
  if (source === null) {
    source = this.findClosestByRange(FIND_SOURCES_ACTIVE);
  }
  if (source === null) {
    source = this.findClosestByRange(FIND_SOURCES);
  }
  return source;
};

RoomPosition.prototype.findInRangeStructures = function(objects, range, structureTypes) {
  // TODO this method should be deprecated
  return this.findInRange(objects, range, {filter: (object) => structureTypes.includes(object.structureType)});
};

RoomPosition.prototype.findHostileStructuresInRangedAttackRange = function() {
  return this.findInRange(FIND_HOSTILE_STRUCTURES, 3);
};

RoomPosition.prototype.findClosestStructure = function(structures, structureType) {
  return this.findClosestByPath(structures, {filter: (object) => object.structureType === structureType});
};

/**
 * Get the position adjacent to this position in a specific direction
 *
 * @param {Number} direction (or 0)
 * @return {boolean|void|RoomPosition} adjacent position, or this position for direction==0
 */
RoomPosition.prototype.getAdjacentPosition = function(direction) {
  const adjacentPos = [
    [0, 0],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];
  // no clean way to handle negative directions here because 0 is a special case instead of equivalent to 8
  if (direction > 8) {
    direction = RoomPosition.fixDirection(direction);
  }
  const x = this.x + adjacentPos[direction][0];
  const y = this.y + adjacentPos[direction][1];

  if (x < 0 || y < 0) {
    return false;
  }
  if (x > 49 || y > 49) {
    return false;
  }

  try {
    return new RoomPosition(x, y, this.roomName);
  } catch (e) {
    // TODO do we need to catch it?
    this.log(`RoomPosition.getAdjacentPosition Exception: ${e} for direction ${direction} x: ${x} y: ${y} roomName: ${this.roomName} stack: ${e.stack}`);
    // throw e;
    return;
  }
};

RoomPosition.prototype.getAllAdjacentPositions = function* () {
  for (let direction = 1; direction <= 8; direction++) {
    const position = this.getAdjacentPosition(direction);
    if (position) {
      yield position;
    }
  }
};

RoomPosition.prototype.getAllPositionsInRange = function* (range) {
  for (let x = -range; x <= range; ++x) {
    for (let y = -range; y <= range; ++y) {
      if (this.x + x >= 0 && this.y + y >= 0 && this.x + x < 50 && this.y + y < 50) {
        yield new RoomPosition(this.x + x, this.y + y, this.roomName);
      }
    }
  }
};

RoomPosition.prototype.hasNonObstacleAdjacentPosition = function() {
  for (const pos of this.getAllPositionsInRange(1)) {
    if (!pos.checkForWall() && !pos.checkForObstacleStructure() && !pos.checkForCreep()) {
      return true;
    }
  }
  return false;
};

RoomPosition.prototype.checkForCreep = function() {
  return this.lookFor(LOOK_CREEPS).length > 0;
};

RoomPosition.prototype.checkForWall = function() {
  return this.lookFor(LOOK_TERRAIN)[0] === 'wall';
};

RoomPosition.prototype.checkForObstacleStructure = function() {
  return this.lookFor(LOOK_STRUCTURES).some((s) => OBSTACLE_OBJECT_TYPES.includes(s.structureType));
};

RoomPosition.prototype.inPath = function() {
  const room = this.getRoom();
  for (const pathName of Object.keys(room.getMemoryPaths())) {
    const path = room.getMemoryPath(pathName);
    for (const pos of path) {
      if (this.x === pos.x && this.y === pos.y) {
        return true;
      }
    }
  }
  return false;
};

RoomPosition.prototype.inPositions = function() {
  const room = this.getRoom();
  if (!room.data.positions) {
    return false;
  }

  for (const creepId of Object.keys(room.data.positions.creep)) {
    if (!room.data.positions.creep[creepId]) {
      // TODO when does this happen?
      continue;
    }
    try {
      for (const pos of room.data.positions.creep[creepId]) {
        if (!pos) {
          continue;
        }
        if (this.isEqualTo(pos.x, pos.y)) {
          return true;
        }
      }
    } catch (e) {
      this.log(`inPositions ${creepId} ${room.data.positions.creep[creepId]} ${e}`);
    }
  }

  for (const structureId of Object.keys((room.data.positions.structure || {}))) {
    for (const pos of room.data.positions.structure[structureId]) {
      if (this.isEqualTo(pos.x, pos.y)) {
        return true;
      }
    }
  }

  return false;
};

RoomPosition.prototype.isBorder = function(offset) {
  offset = offset || 0;
  if (this.x <= 1 + offset || this.x >= 48 - offset || this.y <= 1 + offset || this.y >= 48 - offset) {
    return true;
  }
  return false;
};

RoomPosition.prototype.isValid = function() {
  if (this.x < 0 || this.y < 0) {
    return false;
  }
  if (this.x > 49 || this.y > 49) {
    return false;
  }
  return true;
};

RoomPosition.prototype.validPosition = function(opts = {}) {
  if (!opts.ignoreBorder && this.isBorder()) {
    if (opts.debug) {
      this.log('is border');
    }
    return false;
  }
  if (!opts.ignoreWall && this.checkForWall()) {
    if (opts.debug) {
      this.log('is wall');
    }
    return false;
  }
  if (!opts.ignorePositions && this.inPositions(opts)) {
    if (opts.debug) {
      this.log('is positions');
    }
    return false;
  }
  if (!opts.ignorePath && this.inPath()) {
    if (opts.debug) {
      this.log('is path');
    }
    return false;
  }
  return this.isValid();
};

RoomPosition.prototype.getFirstNearPosition = function(...args) {
  return this.findNearPosition(...args).next().value;
};

RoomPosition.prototype.getLastNearPosition = function(...args) {
  // TODO not sure how this works
  const arr = this.findNearPosition(...args);
  arr.next();
  arr.next();
  return arr.next().value;
};

RoomPosition.prototype.getBestNearPosition = function(...args) {
  return _.max(Array.from(this.findNearPosition(...args)), (pos) => Array.from(pos.findNearPosition(...args)).length);
};

RoomPosition.prototype.getWorseNearPosition = function(...args) {
  return _.max(Array.from(this.findNearPosition(...args)), (pos) => -1 * Array.from(pos.findNearPosition(...args)).length);
};

RoomPosition.prototype.findNearPosition = function* (...args) {
  for (const posNew of this.getAllAdjacentPositions()) {
    if (args.debug) {
      console.log(posNew);
    }
    if (!posNew.validPosition(...args)) {
      if (args.debug) {
        console.log(posNew + ' - invalid');
      }
      continue;
    }
    // Single position or array
    // Array?, because path and structures are arrays?
    yield posNew;
  }
};

RoomPosition.prototype.getRoom = function() {
  const room = Game.rooms[this.roomName];
  if (!room) {
    throw new Error(`Could not access room ${this.roomName}`);
  }
  return room;
};

/**
 * Restore RoomPosition object after JSON serialisation.
 *
 * @param {object} json JSON object
 * @param {number} json.x X coordinate
 * @param {number} json.y Y coordinate
 * @param {string} json.roomName Name of the room
 * @return {RoomPosition} RoomPosition object
 */
RoomPosition.fromJSON = function(json) {
  return new RoomPosition(json.x, json.y, json.roomName);
};

/**
 * Given a direction-like number, wrap it to fit in 1-8
 *
 * @param {Number} direction
 * @return {Number} fixed direction
 */
RoomPosition.fixDirection = function(direction) {
  return (((direction - 1) % 8) + 8) % 8 + 1;
};

/**
 * Given a direction, 1-8, increment/decrement it by some value
 *
 * @param {Number} direction
 * @param {Number} change
 * @return {Number}
 */
RoomPosition.changeDirection = function(direction, change) {
  return RoomPosition.fixDirection(direction + change);
};

/**
 * Given a direction, 1-8, return the opposite direction
 *
 * @param {Number} direction
 * @return {Number}
 */
RoomPosition.oppositeDirection = function(direction) {
  return RoomPosition.fixDirection(direction + 4);
};
