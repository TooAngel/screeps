'use strict';

function getOppositeDirection(direction) {
  console.log('getOppositeDirection typeof: ' + typeof direction);
  return ((direction + 3) % 8) + 1;
}

Creep.prototype.mySignController = function() {
  if (config.info.signController && this.room.exectueEveryTicks(config.info.resignInterval)) {
    let text = config.info.signText;
    if (config.quests.enabled && this.memory.role === 'reserver') {
      if (Math.random() < config.quests.signControllerPercentage) {
        let quest = {
          id: Math.random(),
          origin: this.memory.base,
          type: 'Quest',
          //info: 'http://tooangel.github.io/screeps/doc/Quests.html'
          info: 'https://goo.gl/QEyNzG' // Pointing to the workspace branch doc
        };
        this.log('Attach quest');
        text = JSON.stringify(quest);
      }
    }

    let returnCode = this.signController(this.room.controller, text);
  }
};

Creep.prototype.moveToMySearch = function(target, range, allowExits) {
  let search = PathFinder.search(
    this.pos, {
      pos: target,
      range: range
    }, {
      roomCallback: this.room.getCostMatrixCallback(target, true, this.pos.roomName === (target.pos || target).roomName, allowExits),
      maxRooms: 0,
      swampCost: config.layout.swampCost,
      plainCost: config.layout.plainCost
    }
  );
  return search;
};

Creep.prototype.moveToMy = function(target, range, allowExits, cache) {
  range = range || 1;

  let search;
  if (cache) {
    let memory = this.memory.moveToMy;
    if (!memory || Game.time > memory.born + config.creep.cacheMoveToMy) {
      search = this.moveToMySearch(target, range, allowExits);
      memory = {
        born: Game.time,
        search: search
      };
      this.memory.moveToMy = memory;
      // this.log(JSON.stringify(search));
    }
    search = memory.search;
  } else {
    search = this.moveToMySearch(target, range, allowExits);
  }

  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }

  if (search.path.length === 0 && !search.incomplete) {
    // this.say('mtm 0');
    // this.log(`mtm 0: ${target} ${JSON.stringify(search)}`);
    this.move(this.pos.getDirectionTo(target));
    return OK;
  }

  // Fallback to moveTo when the path is incomplete and the creep is only switching positions
  if (search.path.length < 2 && search.incomplete) {
    // this.log(`Fallback ${JSON.stringify(search)} ${target}`);
    // let searchNew = PathFinder.search(
    //   this.pos, {
    //     pos: target,
    //     range: range
    //   }
    // );
    // this.log(`mtm incomplete: ${target} ${JSON.stringify(search)} ${JSON.stringify(searchNew)}`);
    // this.log(`mtm incomplete: ${target} ${JSON.stringify(search)}`);
    // return this.moveByPath(searchNew.path);
    return this.moveTo(target);
  }

  if (this.pos.isEqualTo(search.path[0].x, search.path[0].y)) {
    search.path.shift();
  }

  // let returnCode = this.moveByPath(search.path);
  let returnCode = this.move(this.pos.getDirectionTo(search.path[0].x, search.path[0].y));

  this.say(this.pos.getDirectionTo(search.path[0].x, search.path[0].y));
  if (returnCode === ERR_TIRED) {
    return returnCode;
  }
  if (returnCode === ERR_NOT_FOUND) {
    this.log(`NOT FOUND: ${JSON.stringify(search)}`);
    // this.move(this.pos.getDirectionTo(search.path[1].x, search.path[1].y));
    return returnCode;
  }
  if (returnCode !== OK) {
    this.log(`MoveToMy: Error moveByPath ${returnCode} ${JSON.stringify(search)}`);
  }
  // if (this.name.startsWith('mineral')) {
  //   this.log(this.pos, JSON.stringify(search));
  // }
  return returnCode;
};

Creep.prototype.inBase = function() {
  return this.room.name === this.memory.base;
};

Creep.prototype.handle = function() {
  if (this.spawning) {
    return;
  }

  if (this.memory.recycle) {
    Creep.recycleCreep(this);
    return;
  }

  let role = this.memory.role;
  if (!role) {
    this.log('Creep role not defined for: ' + this.id + ' ' + this.name.split('-')[0].replace(/[0-9]/g, ''));
    this.suicide();
    return;
  }

  try {
    let unit = roles[role];
    if (unit.stayInRoom) {
      if (this.stayInRoom()) {
        return;
      }
    }

    if (!this.memory.boosted) {
      if (this.boost()) {
        return true;
      }
    }

    if (unit.action) {
      if (this.memory.routing && this.memory.routing.reached) {
        if (this.inBase() || !Room.isRoomUnderAttack(this.room.name)) {
          // TODO maybe rename action to ... something better
          //      this.say('Action');
          return unit.action(this);
        }
      }

      if (this.followPath(unit.action)) {
        return true;
      }
    }

    //    if (this.memory.role != 'defendranged' && this.memory.role != 'repairer' && this.memory.role != 'scout' && this.memory.role != 'scoutnextroom' && this.memory.role != 'nextroomer' && this.memory.role != 'upgrader') {
    //      this.log('After followPath');
    //    }

    if (unit.execute) {
      unit.execute(this);
      // TODO this is very old, can be removed?
    } else {
      this.log('Old module execution !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1');
      unit(this);
    }
  } catch (err) {
    let message = 'Executing creep role failed: ' +
      this.room.name + ' ' +
      this.name + ' ' +
      this.id + ' ' +
      JSON.stringify(this.pos) + ' ' +
      err;
    if (err !== null) {
      message += '\n' + err.stack;
    }

    this.log(message);
    Game.notify(message, 30);
  } finally {
    if (this.memory.last === undefined) {
      this.memory.last = {};
    }
    let last = this.memory.last;
    this.memory.last = {
      pos1: this.pos,
      pos2: last.pos1,
      pos3: last.pos2
    };
  }
};

Creep.prototype.isStuck = function() {
  if (!this.memory.last) {
    return false;
  }
  if (!this.memory.last.pos2) {
    return false;
  }
  if (!this.memory.last.pos3) {
    return false;
  }
  for (let pos = 1; pos < 4; pos++) {
    if (!this.pos.isEqualTo(this.memory.last['pos' + pos].x, this.memory.last['pos' + pos].y)) {
      return false;
    }
  }
  return true;
};

Creep.prototype.getEnergyFromStructure = function() {
  if (this.carry.energy === this.carryCapacity) {
    return false;
  }
  var area = this.room.lookForAtArea(
    'structure',
    Math.max(1, this.pos.y - 1),
    Math.max(1, this.pos.x - 1),
    Math.min(48, this.pos.y + 1),
    Math.min(48, this.pos.x + 1)
  );
  for (var y in area) {
    for (var x in area[y]) {
      if (area[y][x].length === 0) {
        continue;
      }
      for (var i in area[y][x]) {
        if (area[y][x][i].structureType === STRUCTURE_EXTENSION ||
          area[y][x][i].structureType === STRUCTURE_SPAWN) {
          this.withdraw(area[y][x][i], RESOURCE_ENERGY);
          return true;
        }
      }
    }
  }
};

Creep.prototype.stayInRoom = function() {
  if (this.inBase()) {
    return false;
  }

  var exitDir = Game.map.findExit(this.room, this.memory.base);
  var exit = this.pos.findClosestByRange(exitDir);
  this.moveTo(exit);
  return true;
};

Creep.prototype.buildRoad = function() {
  if (this.room.controller && this.room.controller.my) {
    if (this.pos.lookFor(LOOK_TERRAIN)[0] !== 'swamp' &&
      (this.room.controller.level < 3 || this.room.memory.misplacedSpawn)) {
      return false;
    }
  }

  // TODO as creep variable
  if (this.memory.role != 'carry' && this.memory.role != 'harvester') {
    this.getEnergyFromStructure();
  }

  if (this.carry.energy === 0) {
    return false;
  }

  var i;

  if (this.room.controller && !this.room.controller.my && this.room.controller.owner) {
    return false;
  }

  if (this.pos.x === 0 ||
    this.pos.x === 49 ||
    this.pos.y === 0 ||
    this.pos.y === 49
  ) {
    return true;
  }

  let structures = this.pos.lookFor(LOOK_STRUCTURES);
  if (structures.length > 0) {
    for (let structure of structures) {
      if (structure.structureType === STRUCTURE_ROAD) {
        this.repair(structure);
        return true;
      }
    }
  }

  let creep = this;

  let constructionSites = this.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD], false, {
    filter: cs => creep.pos.getRangeTo(cs.pos) < 4
  });

  if (constructionSites.length > 0) {
    this.build(constructionSites[0]);
    return true;
  }

  constructionSites = this.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD]);
  if (
    constructionSites.length <= config.buildRoad.maxConstructionSitesRoom &&
    Object.keys(Game.constructionSites).length < config.buildRoad.maxConstructionSitesTotal
    //&& this.pos.inPath()
  ) {
    let returnCode = this.pos.createConstructionSite(STRUCTURE_ROAD);
    if (returnCode === OK) {
      return true;
    }
    if (returnCode != OK && returnCode != ERR_INVALID_TARGET && returnCode != ERR_FULL) {
      this.log('Road: ' + this.pos + ' ' + returnCode + ' pos: ' + this.pos);
    }
    return false;
  }
  return false;
};

Creep.prototype.moveForce = function(target, forward) {
  var positionId = this.getPositionInPath(target);
  var nextPosition;
  if (forward) {
    nextPosition = this.memory.path[this.room.name][(+positionId + 1)];
  } else {
    nextPosition = this.memory.path[this.room.name][(+positionId - 1)];
  }

  var lastPos = this.memory.lastPosition;
  if (this.memory.lastPosition &&
    this.pos.isEqualTo(new RoomPosition(
      lastPos.x,
      lastPos.y,
      lastPos.roomName))) {
    var pos = new RoomPosition(nextPosition.x, nextPosition.y, this.room.name);
    var creeps = pos.lookFor('creep');
    if (0 < creeps.length) {
      this.moveCreep(pos, getOppositeDirection(nextPosition.direction));
    }
  }

  if (this.fatigue === 0) {
    if (forward) {
      if (!nextPosition) {
        return true;
      }
      this.move(nextPosition.direction);
    } else {
      let position = this.memory.path[this.room.name][(+positionId)];
      this.move(getOppositeDirection(position.direction));
    }
    this.memory.lastPosition = this.pos;
  }
  return;
};

Creep.prototype.getPositionInPath = function(target) {
  if (!this.memory.path) {
    this.memory.path = {};
  }
  if (!this.memory.path[this.room.name]) {
    var start = this.pos;
    var end = new RoomPosition(target.x, target.y, target.roomName);

    this.memory.path[this.room.name] = this.room.findPath(start, end, {
      ignoreCreeps: true,
      costCallback: this.room.getCostMatrixCallback(end, true)
    });
  }
  var path = this.memory.path[this.room.name];

  for (var index in path) {
    if (this.pos.isEqualTo(path[index].x, path[index].y)) {
      return index;
    }
  }
  return -1;
};

Creep.prototype.killPrevious = function() {
  const previous = this.pos.findInRange(FIND_MY_CREEPS, 1, {
    filter: creep => {
      if (creep.id === this.id) {
        return false;
      }
      if (creep.memory.role !== this.memory.role) {
        return false;
      }
      if (creep.memory.routing.targetId !== this.memory.routing.targetId) {
        return false;
      }
      return true;
    }
  })[0];
  if (!previous) {
    return false;
  }

  if (this.ticksToLive < previous.ticksToLive) {
    this.log('kill me: me: ' + this.ticksToLive + ' they: ' + previous.ticksToLive);
    this.suicide();
  } else {
    this.log('kill other: me: ' + this.ticksToLive + ' they: ' + previous.ticksToLive);
    previous.suicide();
  }
  return true;
};

Creep.prototype.respawnMe = function() {
  let routing = {
    targetRoom: this.memory.routing.targetRoom,
    targetId: this.memory.routing.targetId,
    route: this.memory.routing.route
  };
  var spawn = {
    role: this.memory.role,
    heal: this.memory.heal,
    level: this.memory.level,
    routing: routing
  };
  Game.rooms[this.memory.base].memory.queue.push(spawn);
};

Creep.prototype.spawnReplacement = function(maxOfRole) {
  if (this.memory.nextSpawn) {
    //    this.say('sr: ' + (this.ticksToLive - this.memory.nextSpawn));
    if (this.ticksToLive === this.memory.nextSpawn) {
      if (maxOfRole) {
        let creepOfRole = this.room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', [this.memory.role]);

        if (creepOfRole.length > maxOfRole) {
          return false;
        }
      }
      this.respawnMe();
    }
  }
};

Creep.prototype.setNextSpawn = function() {
  if (!this.memory.nextSpawn) {
    this.memory.nextSpawn = Game.time - this.memory.born - config.creep.renewOffset;
    //    this.killPrevious();

    if (this.ticksToLive < this.memory.nextSpawn) {
      this.respawnMe();
    }
  }
};
