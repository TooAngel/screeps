'use strict';

RoomPosition.prototype.findClosestStructureWithMissingEnergyByRange = function(filter) {
  const structure = this.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (object) => (object.store && object.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && (!filter || filter(object))),
  });
  return structure;
};

RoomPosition.prototype.checkTowerFillerPos = function() {
  if (this.isBorder(3)) {
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

RoomPosition.prototype.clearPosition = function(target) {
  const structures = this.lookFor('structure');
  for (const structureId of Object.keys(structures)) {
    const structure = structures[structureId];
    if (structure.structureType === STRUCTURE_SPAWN) {
      const spawns = this.getRoom().findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
      if (spawns.length <= 1) {
        target.remove();
        return true;
      }
    }
    console.log('Destroying: ' + structure.structureType);
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
  return this.findInRangePropertyFilter(objects, range, 'structureType', structureTypes);
};

RoomPosition.prototype.findHostileStructuresInRangedAttackRange = function() {
  return this.findInRange(FIND_HOSTILE_STRUCTURES, 3);
};

RoomPosition.prototype.findClosestStructure = function(structures, structureType) {
  return this.findClosestByPathPropertyFilter(structures, 'structureType', [structureType]);
};

/**
 * Get the position adjacent to this position in a specific direction
 *
 * @param {Number} direction (or 0)
 * @return {RoomPosition} adjacent position, or this position for direction==0
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

  try {
    return new RoomPosition(x, y, this.roomName);
  } catch (e) {
    // this.log(`RoomPosition.getAdjacentPosition Exception: ${e} for direction ${direction} x: ${x} y: ${y} roomName: ${this.roomName} stack: ${e.stack}`);
    // throw e;
    return;
  }
};

RoomPosition.prototype.getAllAdjacentPositions = function* () {
  for (let direction = 1; direction <= 8; direction++) {
    try {
      yield this.getAdjacentPosition(direction);
    } catch (e) {
      // This happens when the RoomPosition is invalid
      continue;
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
  return room.getMemoryPathsSet()[`${this.x} ${this.y}`];
};

RoomPosition.prototype.inPositions = function() {
  const room = this.getRoom();

  if (!room.memory.position) {
    return false;
  }

  for (const creepId of Object.keys(room.memory.position.creep)) {
    if (!room.memory.position.creep[creepId]) {
      // TODO when does this happen?
      continue;
    }
    try {
      for (const pos of room.memory.position.creep[creepId]) {
        if (!pos) {
          continue;
        }
        if (this.isEqualTo(pos.x, pos.y)) {
          return true;
        }
      }
    } catch (e) {
      this.log(`inPositions ${creepId} ${room.memory.position.creep[creepId]} ${e}`);
    }
  }

  for (const structureId of Object.keys(room.memory.position.structure)) {
    for (const pos of room.memory.position.structure[structureId]) {
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
  return true;
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
    if (!posNew.validPosition(...args)) {
      // console.log(posNew + ' - invalid');
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

RoomPosition.wrapFindMethod = (methodName, extraParamsCount) => function(findTarget, ...propertyFilterParams) {
  /* eslint-disable no-invalid-this */
  const extraParams = propertyFilterParams.splice(0, extraParamsCount);
  if (_.isNumber(findTarget)) {
    const objects = this.getRoom().findPropertyFilter(findTarget, ...propertyFilterParams);
    return this[methodName](objects, ...extraParams);
  }
  /* eslint-enable no-invalid-this */
};

/**
 *
 * @param {Number}  findTarget One of the FIND constant. e.g. [FIND_MY_STRUCTURES] or array of RoomObject to apply filters
 * @param range
 * @param {String}  property The property to filter on. e.g. 'structureType' or 'memory.role'
 * @param {Array}  properties The properties to filter. e.g. [STRUCTURE_ROAD, STRUCTURE_RAMPART]
 * @param {Boolean} [without=false] Exclude or include the properties to find.
 * @param {object} [opts={}] Additional options.
 * @param {function} [opts.filter] Additional filter that wil be applied after cache.
 * @return {Array} the objects returned in an array.
 */
RoomPosition.prototype.findInRangePropertyFilter = RoomPosition.wrapFindMethod('findInRange', 1);

/**
 *
 * @param {Number}  findTarget One of the FIND constant. e.g. [FIND_MY_STRUCTURES] or array of RoomObject to apply filters
 * @param {String}  property The property to filter on. e.g. 'structureType' or 'memory.role'
 * @param {Array}  properties The properties to filter. e.g. [STRUCTURE_ROAD, STRUCTURE_RAMPART]
 * @param {Boolean} [without=false] Exclude or include the properties to find.
 * @param {object} [opts={}] Additional options.
 * @param {function} [opts.filter] Additional filter that wil be applied after cache.
 * @return {Array} the objects returned in an array.
 */
RoomPosition.prototype.findClosestByRangePropertyFilter = RoomPosition.wrapFindMethod('findClosestByRange', 0);

/**
 *
 * @param {Number|RoomObject[]}  findTarget One of the FIND constant. e.g. [FIND_MY_STRUCTURES] or array of RoomObject to apply filters
 * @param {String}  property The property to filter on. e.g. 'structureType' or 'memory.role'
 * @param {Array}  properties The properties to filter. e.g. [STRUCTURE_ROAD, STRUCTURE_RAMPART]
 * @param {Boolean} [without=false] Exclude or include the properties to find.
 * @param {object} [opts={}] Additional options.
 * @param {function} [opts.filter] Additional filter that wil be applied after cache.
 * @return {Array} the objects returned in an array.
 */
RoomPosition.prototype.findClosestByPathPropertyFilter = RoomPosition.wrapFindMethod('findClosestByPath', 0);

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
