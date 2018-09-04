'use strict';

/**
 * getRoute calculates or returns the stored route, based on the memory prepared
 * memory.routing
 *
 * @return {Array} - result of `room.findRoute` base room added
 */
Creep.prototype.getRoute = function() {
  if (this.memory.routing.route) {
    return this.memory.routing.route;
  }

  let route = [];
  if (this.memory.base !== this.memory.routing.targetRoom) {
    route = this.room.findRoute(this.memory.base, this.memory.routing.targetRoom);
    if (route < 0) {
      route = this.room.findRoute(this.memory.base, this.memory.routing.targetRoom, true);
    }
  }

  if (!route.splice && (route < 0)) {
    throw new Error(`Creep.prototype.getRoute: route can not be spliced: ${JSON.stringify(route)}`);
  }
  route.splice(0, 0, {
    room: this.memory.base,
  });
  this.memory.routing.route = route;
  return route;
};

/**
 * getRoutePos returns the current position on the route
 *
 * @param {Array} route - List of rooms to check against
 * @return {number} - returns the index of the current position in the given route
 */
Creep.prototype.getRoutePos = function(route) {
  this.memory.routing.routePos = this.memory.routing.routePos || 0;
  if (!route[this.memory.routing.routePos] || this.room.name !== route[this.memory.routing.routePos].room) {
    this.memory.routing.routePos = _.findIndex(route, (i) => i.room === this.room.name);
  }
  return this.memory.routing.routePos;
};

/**
 * getPathPos returns the current position on the path
 *
 * @param {list} path - Path to find the current position in
 * @return {number} - returns the index of the current position in the given route
 */
Creep.prototype.getPathPos = function(path) {
  let pathPos = this.memory.routing.pathPos || 0;
  const pos = path[pathPos];
  if (!pos || !this.pos.isEqualTo(pos.x, pos.y)) {
    pathPos = _.findIndex(path, (i) => i.x === this.pos.x && i.y === this.pos.y);
    this.memory.routing.pathPos = pathPos;
  }
  return pathPos;
};

/**
 * getDirections calculates the
 *  - forwardDirection: direction to next pos in path
 *  - backwardDirection: direction to previous pos in path
 *  - direction: which direction to go
 *  - pathOffset: offset for the path
 * based on the current path, pathPos and memory.routing.reverse
 *
 * @param {list} path - The path of the Creep
 * @param {number} pathPos - The current patPosition
 * @return {object} - forwardDirection, backwardDirection, direction, pathOffset
 **/
Creep.prototype.getDirections = function(path) {
  const pathPos = this.memory.routing.pathPos;
  if (pathPos < 0) {
    return {};
  }
  const currentPos = this.pos;
  let offset = 1;
  let forwardDirection;
  let backwardDirection;
  let direction;
  let nextPos;
  if (pathPos + 1 < path.length) {
    nextPos = path[pathPos + 1];
    forwardDirection = currentPos.getDirectionTo(nextPos.x, nextPos.y);
  }

  if (pathPos - 1 >= 0) {
    nextPos = path[pathPos - 1];
    backwardDirection = currentPos.getDirectionTo(nextPos.x, nextPos.y);
  }

  if (this.memory.routing.reverse) {
    offset = -1;
    direction = backwardDirection;
  } else {
    this.memory.routing.reverse = false;
    direction = forwardDirection;
  }

  return {
    forwardDirection: forwardDirection,
    backwardDirection: backwardDirection,
    direction: direction,
    pathOffset: offset,
    reverse: this.memory.routing.reverse,
  };
};

// TODO Maybe execute on creep creation
/**
 * prepareRoutingMemory Initializes the routing memory
 *
 * @return {list} - The path
 **/
Creep.prototype.prepareRoutingMemory = function() {
  const route = this.getRoute();
  const routePos = this.getRoutePos(route);
  const path = this.room.getPath(route, routePos, 'pathStart', this.memory.routing.targetId);
  this.getPathPos(path);
  return path;
};

/**
 * followPath follows that path for the creep and executes `action` when target
 * is reached
 *
 * @param {function} action - Action function to execute when target is reached
 * @return {boolean} - If the execution is successful
 */
Creep.prototype.followPath = function(action) {
  if (this.followPathWithoutTargetId()) {
    return action(this);
  }
  const path = this.prepareRoutingMemory();
  const directions = this.getDirections(path);
  if (this.unit().preMove && this.unit().preMove(this, directions)) {
    return true;
  }
  // Recalculate the directions, if `preMove` changed `memory.routing.reversed`
  this.getDirections(path);
  this.getPathPos(path);
  this.killPrevious(path);
  if (this.followPathWithTargetId(path)) {
    return action(this);
  }
  return this.moveByPathMy(path);
};

Creep.prototype.followPathWithoutTargetId = function() {
  if (!this.memory.routing.targetId && this.room.name === this.memory.routing.targetRoom) {
    this.memory.routing.reached = true;
    return true;
  }
  return false;
};

Creep.prototype.followPathWithTargetId = function(path) {
  if (this.memory.routing.routePos === this.memory.routing.route.length - 1 &&
    this.memory.routing.pathPos === path.length - 1 && !this.memory.routing.reverse) {
    this.memory.routing.reached = true;
    // TODO handle creeps with body part?
    this.memory.timeToTravel = CREEP_LIFE_TIME - this.ticksToLive;
    return true;
  }
  return false;
};

/**
 * moveBackToPath moves to the first or last position based on
 * `memory.routing.reverse` to get to the best path position.
 *
 * @param {list} path - The path we want to get back to
 * @return {boolean} - Result of `creep.moveToMy`
 **/
Creep.prototype.moveBackToPath = function(path) {
  let pos;
  if (this.memory.routing.reverse) {
    pos = new RoomPosition(path[0].x, path[0].y, path[0].roomName);
  } else {
    const step = path.length > 1 ? path.length - 2 : path.length - 1;
    pos = new RoomPosition(path[step].x, path[step].y, path[step].roomName);
  }

  const moveToMyResult = this.moveToMy(pos, 0);
  if (!moveToMyResult) {
    this.log(`${Game.time} moveBackToPath moveToMy(${JSON.stringify(pos)}, 0); => ${moveToMyResult}`);
  }
  return moveToMyResult;
};

/**
 * validateDirections check if the directions object has at least one direction
 *
 * @param {object} directions - The object to check
 * @return {boolean} - If the object is valid
 **/
function validateDirections(directions) {
  return directions && directions.direction && (directions.forwardDirection || directions.backwardDirection);
}

/**
 * moveByPathMy follows the given path or gets back to the path
 *
 * @param {list} path - The path to follow
 * @param {number} [pathPos] - The current position on the path
 * @param {object} [directions] - Precalculated directions on the path
 * @return {boolean} true if a way was found to move the creep
 **/
Creep.prototype.moveByPathMy = function(path, pathPos, directions) {
  if (this.fatigue > 0) {
    return true;
  }
  pathPos = pathPos || this.memory.routing.pathPos;
  if (pathPos < 0) {
    return this.moveBackToPath(path);
  }

  this.buildRoad();

  directions = directions || this.getDirections(path);
  if (!validateDirections(directions)) {
    if (config.debug.routing) {
      this.log(`${Game.time} moveByPathMy: Directions invalid pathPos: ${pathPos} path[pathPos]: ${path[pathPos]} directions: ${global.ex(directions, 1)}`);
    }
    return false;
  }

  const moveResponse = this.move(directions.direction);
  if (moveResponse !== OK && moveResponse !== ERR_NO_BODYPART && !this.pos.isBorder()) {
    // TODO carries sometimes run into this issues when switching between rooms
    this.log(`${Game.time} moveByPathMy this.move(${directions.direction}) => ${moveResponse} DEBUG: reverse: ${this.memory.routing.reverse} pathPos: ${pathPos} directions: ${directions} path: ${path}`);
  }
  this.memory.routing.pathPos = pathPos + directions.pathOffset;
  return true;
};

/**
 * checkForRoutingReached checks if current room and targetRoom matches
 * and set memory.routing.reached to true
 **/
Creep.prototype.checkForRoutingReached = function() {
  if (this.room.name === this.memory.routing.targetRoom) {
    this.memory.routing.reached = true;
  }
};
