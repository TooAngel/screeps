'use strict';

Creep.prototype.getRoute = function() {
  if (!this.memory.routing) {
    this.log('No routing why?');
    this.suicide();
    throw new Error();
  }

  if (this.memory.routing.route) {
    return this.memory.routing.route;
  }

  // Add room avoidance
  let route = [];
  if (this.memory.base !== this.memory.routing.targetRoom) {
    route = this.room.findRoute(this.memory.base, this.memory.routing.targetRoom);
  }
  route.splice(0, 0, {
    room: this.memory.base,
  });
  this.memory.routing.route = route;
  return route;
};

Creep.prototype.allowOverTake = function(directions) {
  const dir = directions && directions.direction;
  if (dir && (!this.inBase() || this.room.controller.level < 4)) {
    if (this.fatigue === 0) {
      const pos = this.pos.getAdjacentPosition(dir);
      const reverseDir = directions.direction > 4 ? directions.direction - 4 : directions.direction + 4;
      this.moveCreep(pos, reverseDir);
    } else {
      const reverseDir = directions.direction > 4 ? directions.direction - 4 : directions.direction + 4;
      const randomDir = Game.time % 2 ? 1 : -1;
      const pos = this.pos.getAdjacentPosition(reverseDir);
      return this.moveCreep(pos, (reverseDir + 3 * randomDir) % 8 || 8);
    }
  }
  return false;
};

Creep.prototype.getRoutePos = function(route) {
  let routePos = this.memory.routing.routePos || 0;
  // Detect room change
  if (!route[routePos] || this.room.name !== route[routePos].room) {
    routePos = _.findIndex(route, (i) => i.room === this.room.name);

    // TODO if we can't find the room in the array
    if (routePos < 0) {
      this.log('newmove: No routepos found: ' + JSON.stringify(route));
    }
  }
  this.memory.routing.routePos = routePos;
  return routePos;
};

Creep.prototype.getPathPos = function(route, routePos, path) {
  // TODO solve better, was introduced due to call of moveByPathMy
  if (!this.memory.routing) {
    this.memory.routing = {};
  }
  let pathPos = this.memory.routing.pathPos || 0;
  const pos = path[pathPos];

  if (!pos || !this.pos.isEqualTo(pos.x, pos.y)) {
    pathPos = _.findIndex(path, (i) => i.x === this.pos.x && i.y === this.pos.y);
    if (pathPos === -1) {
      // Not sure if this method is the best place
      // this.log('routing: Not on path, pos: ' + JSON.stringify(this.pos) + '
      // path: ' + JSON.stringify(path));

      if (Room.isRoomUnderAttack(this.room.name)) {
        this.moveTo(path[0].x, path[0].y, {
          ignoreCreeps: true,
        });
        return -1;
      }

      // TODO Check that we are not standing on another path
      // TODO Check that we are not standing on the room borders
      if (routePos < (route.length - 1) && Room.isRoomUnderAttack(route[routePos + 1].room)) {
        return -1;
      }

      // Move to the middle of the path, something else could be better
      // When using the costmatrix, that should be fine
      const posTarget = path[Math.floor(path.length / 2)];

      // TODO when does this happen?
      if (!posTarget) {
        // this.log('config_creep_routing.move middle: ' + posTarget);
        return -1;
      }
      const returnCode = this.moveTo(posTarget.x, posTarget.y, {
        ignoreCreeps: true,
      });
      if (returnCode !== OK && returnCode !== ERR_TIRED) {
        this.log('newmove: moveTo: ' + returnCode + ' ' + JSON.stringify(path[path.length / 2]) + ' ' + (path.length / 2));
      }
      return -1;
    }
  }
  return pathPos;
};

Creep.prototype.getDirections = function(path, pathPos) {
  let flee = false;
  if (this.room.name !== this.memory.base && Room.isRoomUnderAttack(this.room.name)) {
    this.say('flee');
    delete this.memory.routing.reached;
    // TODO flee disabled 2016-01-15
    flee = false;
  }

  // TODO handle if next room is under attack

  const pos = path[pathPos];
  if (!pos) {
    console.log('newmove: getDirections: pathPos: ' + pathPos + ' path: ' + JSON.stringify(path));
  }
  const currentPos = new RoomPosition(pos.x, pos.y, this.room.name);
  let forwardDirection;
  let backwardDirection;
  let direction;

  if (pathPos + 1 < path.length) {
    const nextPos = path[pathPos + 1];
    forwardDirection = currentPos.getDirectionTo(nextPos.x, nextPos.y);
  }

  if (pathPos - 1 >= 0) {
    const nextPos = path[pathPos - 1];
    backwardDirection = currentPos.getDirectionTo(nextPos.x, nextPos.y);
  }

  let offset = 1;
  if (flee || this.memory.routing.reverse) {
    offset = -1;
    if (pathPos - 1 < 0) {
      return {
        forwardDirection: forwardDirection,
        backwardDirection: 0,
        direction: 0,
        pathOffset: 0,
      };
    }
    direction = backwardDirection;
  } else {
    if (pathPos + 1 > path.length - 1) {
      // this.log('creep_routing.getDirections: ' +
      // this.memory.routing.reached);
      // if (true) throw new Error();
      this.say('EoP');
      return;
    }
    direction = forwardDirection;
  }

  return {
    forwardDirection: forwardDirection,
    backwardDirection: backwardDirection,
    direction: direction,
    pathOffset: offset,
  };
};

Creep.prototype.checkPreMove = function(datas) {
  if (!datas.path) {
    return true;
  }
  if (datas.pathPos < 0) {
    this.memory.routing.pathPos = datas.pathPos;
    return true;
  }
  return false;
};

Creep.prototype.followPath = function(action) {
  const route = this.getRoute();
  const routePos = this.getRoutePos(route);

  // TODO Disable base room for now
  // if (routePos === 0) {
  //   this.say('R:Base');
  //   return false;
  // }

  if (!this.memory.routing.targetId && this.room.name === this.memory.routing.targetRoom) {
    this.memory.routing.reached = true;
    return action(this);
  }
  const prepareData = this.moveByPathPrepare(route, routePos, 'pathStart', this.memory.routing.targetId);
  if (this.checkPreMove(prepareData)) {
    if (prepareData.unit.preMove && prepareData.unit.preMove(this, prepareData.directions)) {
      return true;
    }
    if (!prepareData.path || prepareData.path.length === 0) {
      return false;
    }
  } else if (prepareData.unit.preMove && prepareData.unit.preMove(this, prepareData.directions)) {
    // if(!this.isStuck()){  // May be used if a issue happen. Didn't need it while testing
    return true;
    // }
  }
  return this.moveByPathMy(route, routePos, 'pathStart', this.memory.routing.targetId, action, prepareData);
};

Creep.prototype.moveByPathPrepare = function(route, routePos, start, target) {
  const result = {};
  result.unit = roles[this.memory.role];

  // Somehow reset the pathPos if the path has changed?!
  result.path = this.room.getPath(route, routePos, start, target);
  if (!result.path) {
    return result;
  }
  result.pathPos = this.getPathPos(route, routePos, result.path);
  if (result.pathPos < 0) {
    return result;
  }
  result.directions = this.getDirections(result.path, result.pathPos);
  return result;
};

Creep.prototype.moveByPathMy = function(route, routePos, start, target, action, prepareData) {
  if (!prepareData) {
    prepareData = this.moveByPathPrepare(route, routePos, start, target);
  }
  const {unit, path, pathPos, directions} = prepareData;

  if (pathPos < 0) {
    let posFirst;
    try {
      if (this.memory.routing.reverse) {
        posFirst = new RoomPosition(path[0].x, path[0].y, path[0].roomName);
      } else {
        const step = path.length > 1 ? path.length - 2 : path.length - 1;
        posFirst = new RoomPosition(path[step].x, path[step].y, path[step].roomName);
      }
    } catch (e) {
      // TODO config.serializePath mismatch with memory is the only case I know of
      this.log('Can not parse path in cache will delete Memory');
      delete Memory.rooms[this.room.name];
      return false;
    }

    const search = PathFinder.search(
      this.pos, {
        pos: posFirst,
        range: 0,
      }, {
        roomCallback: this.room.getCostMatrixCallback(posFirst, true),
        maxRooms: 1,
        swampCost: config.layout.swampCost,
        plainCost: config.layout.plainCost,
      }
    );

    if (config.visualizer.enabled && config.visualizer.showPathSearches) {
      visualizer.showSearch(search);
    }

    if (search.incomplete) {
      this.moveTo(posFirst);
      return true;
    }

    // this.log('creep_routing.followPath not on path: ' +
    // this.pos.getDirectionTo(search.path[0]) + ' pathPos: ' + pathPos + ' pos:
    // ' + this.pos + ' routePos: ' + routePos + ' path: ' +
    // JSON.stringify(path) + ' route: ' + JSON.stringify(route));
    this.say('R:p-1: ' + this.pos.getDirectionTo(search.path[0]));
    const creepPos = this.pos;
    const returnCode = this.moveTo(_.min(search.path, (object) => {
      return object.getRangeTo(creepPos);
    }), {
      reusePath: 0,
    });
    if (returnCode === OK) {
      return true;
    }
    if (returnCode === ERR_TIRED) {
      return true;
    }

    this.log('creep_routing.followPath not on path returnCode: ' + returnCode);

    return true;
  }

  if (!Room.isRoomUnderAttack(this.room.name)) {
    if (routePos === route.length - 1) {
      if (pathPos === path.length - 2) {
        if (this.memory.killPrevious) {
          this.killPrevious();
        }
      }
      if (pathPos === path.length - 1 && !this.memory.routing.reverse) {
        // this.log('creep_routing.followPath reached: ' + pathPos + '
        // path.length: ' + path.length);
        this.memory.routing.reached = true;
        this.memory.timeToTravel = 1500 - this.ticksToLive;
        return action(this);
      }
    }
  }

  // build roads
  if (unit.buildRoad) {
    const target = Game.getObjectById(this.memory.routing.targetId);
    if (config.buildRoad.buildToOtherMyRoom || !target || target.structureType !== STRUCTURE_STORAGE) {
      this.buildRoad();
    }
  }

  if (!directions) {
    // TODO Better true? On stuck on the border, execute is executed in the previous room
    if (this.pos.isBorder()) {
      return true;
    }
    this.log('no directions');
    return false;
  }
  if (!directions.forwardDirection && !directions.backwardDirection) {
    this.log('no forward and backward direction');
    return false;
  }
  // this.say(directions.direction);
  if (directions.direction === 0) {
    // TODO When does this happen?
    // this.log('zero direction: pathPos: ' + pathPos + ' path: ' + path);
    // throw new Error();
  }
  // this.say(directions.direction);
  if (!directions.direction) {
    // TODO E.g. carry creeps run into this, if the sourcer is missing
    //     this.log('config_creep_routing no directions.direction: ' + JSON.stringify(directions) + ' ' + JSON.stringify(this.memory.routing));
  }

  this.move(directions.direction);

  this.memory.routing.routePos = routePos;
  this.memory.routing.pathPos = pathPos + directions.pathOffset;
  return true;
};
