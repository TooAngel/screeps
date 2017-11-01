'use strict';

Creep.prototype.mySignController = function() {
  if (config.info.signController && this.room.exectueEveryTicks(config.info.resignInterval)) {
    let text = config.info.signText;
    if (config.quests.enabled && this.memory.role === 'reserver') {
      if (Math.random() < config.quests.signControllerPercentage) {
        const quest = {
          id: Math.random(),
          origin: this.memory.base,
          type: 'Quest',
          // info: 'http://tooangel.github.io/screeps/doc/Quests.html'
          info: 'https://goo.gl/QEyNzG', // Pointing to the workspace branch doc
        };
        this.log('Attach quest');
        text = JSON.stringify(quest);
      }
    }

    const returnCode = this.signController(this.room.controller, text);
    if (returnCode !== OK) {
      this.log('sign controller: ' + returnCode);
    }
  }
};

Creep.prototype.moveToMy = function(target, range) {
  range = range || 1;
  const search = PathFinder.search(
    this.pos, {
      pos: target,
      range: range,
    }, {
      roomCallback: this.room.getCostMatrixCallback(target, true, this.pos.roomName === (target.pos || target).roomName),
      maxRooms: 0,
      swampCost: config.layout.swampCost,
      plainCost: config.layout.plainCost,
    }
  );

  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }

  this.creepLog('moveToMy search:', JSON.stringify(search));
  // Fallback to moveTo when the path is incomplete and the creep is only switching positions
  if (search.path.length < 2 && search.incomplete) {
    // this.log(`fallback ${JSON.stringify(target)} ${JSON.stringify(search)}`);
    this.moveTo(target);
    return false;
  }
  return this.move(this.pos.getDirectionTo(search.path[0] || target.pos || target));
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

  const role = this.memory.role;
  if (!role) {
    this.log('Creep role not defined for: ' + this.id + ' ' + this.name.split('-')[0].replace(/[0-9]/g, ''));
    this.suicide();
    return;
  }

  try {
    const unit = roles[role];
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

      if (this.memory.forced) {
        delete this.memory.forced;
        return;
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
    if (this.fatigue === 0) {
      if (this.memory.last === undefined) {
        this.memory.last = {};
      }
      const last = this.memory.last;
      this.memory.last = {
        pos1: this.pos,
        pos2: last.pos1,
        pos3: last.pos2,
      };
    }
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
  const area = this.room.lookForAtArea(
    'structure',
    Math.max(1, this.pos.y - 1),
    Math.max(1, this.pos.x - 1),
    Math.min(48, this.pos.y + 1),
    Math.min(48, this.pos.x + 1)
  );
  for (const y of Object.keys(area)) {
    for (const x of Object.keys(area[y])) {
      if (area[y][x].length === 0) {
        continue;
      }
      for (const i in area[y][x]) {
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

  const exitDir = Game.map.findExit(this.room, this.memory.base);
  const exit = this.pos.findClosestByRange(exitDir);
  this.moveTo(exit);
  return true;
};

Creep.prototype.buildRoad = function() {
  if (this.room.controller && this.room.controller.my &&
    this.room.energyCapacityAvailable < 550 &&
    this.pos.lookFor(LOOK_TERRAIN)[0] !== 'swamp') {
    return false;
  }

  // TODO as creep variable
  if (this.memory.role !== 'carry' && this.memory.role !== 'harvester') {
    this.getEnergyFromStructure();
  }

  if (this.carry.energy === 0) {
    return false;
  }

  if (this.room.controller && !this.room.controller.my && this.room.controller.owner) {
    return false;
  }

  if (this.pos.isBorder(-1)) {
    return true;
  }

  const structures = this.pos.lookFor(LOOK_STRUCTURES);
  if (structures.length > 0) {
    for (const structure of structures) {
      if (structure.structureType === STRUCTURE_ROAD) {
        this.repair(structure);
        return true;
      }
    }
  }

  const creep = this;

  let constructionSites = this.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD], {
    filter: (cs) => creep.pos.getRangeTo(cs.pos) < 4,
  });

  if (constructionSites.length > 0) {
    this.build(constructionSites[0]);
    return true;
  }

  constructionSites = this.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD]);
  if (
    constructionSites.length <= config.buildRoad.maxConstructionSitesRoom &&
    Object.keys(Game.constructionSites).length < config.buildRoad.maxConstructionSitesTotal
    // && this.pos.inPath()
  ) {
    const returnCode = this.pos.createConstructionSite(STRUCTURE_ROAD);
    if (returnCode === OK) {
      return true;
    }
    if (returnCode !== OK && returnCode !== ERR_INVALID_TARGET && returnCode !== ERR_FULL) {
      this.log('Road: ' + this.pos + ' ' + returnCode + ' pos: ' + this.pos);
    }
    return false;
  }
  return false;
};

Creep.prototype.moveForce = function(target, forward) {
  const positionId = this.getPositionInPath(target);
  let nextPosition;
  if (forward) {
    nextPosition = this.memory.path[this.room.name][(+positionId + 1)];
  } else {
    nextPosition = this.memory.path[this.room.name][(+positionId - 1)];
  }

  const lastPos = this.memory.lastPosition;
  if (this.memory.lastPosition &&
    this.pos.isEqualTo(new RoomPosition(
      lastPos.x,
      lastPos.y,
      lastPos.roomName))) {
    const pos = new RoomPosition(nextPosition.x, nextPosition.y, this.room.name);
    const creeps = pos.lookFor('creep');
    if (0 < creeps.length) {
      this.moveCreep(pos, RoomPosition.oppositeDirection(nextPosition.direction));
    }
  }

  if (this.fatigue === 0) {
    if (forward) {
      if (!nextPosition) {
        return true;
      }
      this.move(nextPosition.direction);
    } else {
      const position = this.memory.path[this.room.name][(+positionId)];
      this.move(RoomPosition.oppositeDirection(position.direction));
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
    const start = this.pos;
    const end = new RoomPosition(target.x, target.y, target.roomName);

    this.memory.path[this.room.name] = this.room.findPath(start, end, {
      ignoreCreeps: true,
      costCallback: this.room.getCostMatrixCallback(end, true),
    });
  }
  const path = this.memory.path[this.room.name];

  for (const index in path) {
    if (this.pos.isEqualTo(path[index].x, path[index].y)) {
      return index;
    }
  }
  return -1;
};

Creep.prototype.killPrevious = function() {
  const previous = this.pos.findInRange(FIND_MY_CREEPS, 1, {
    filter: (creep) => {
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
    },
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
  const routing = {
    targetRoom: this.memory.routing.targetRoom,
    targetId: this.memory.routing.targetId,
    route: this.memory.routing.route,
  };
  const spawn = {
    role: this.memory.role,
    heal: this.memory.heal,
    level: this.memory.level,
    routing: routing,
  };
  Game.rooms[this.memory.base].memory.queue.push(spawn);
};

Creep.prototype.spawnReplacement = function(maxOfRole) {
  if (this.memory.nextSpawn) {
    //    this.say('sr: ' + (this.ticksToLive - this.memory.nextSpawn));
    if (this.ticksToLive === this.memory.nextSpawn) {
      if (maxOfRole) {
        const creepOfRole = this.room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', [this.memory.role]);

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
