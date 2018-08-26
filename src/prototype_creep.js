'use strict';

/**
 * initRouting - Makes sure the memory routing object is set
 **/
Creep.prototype.initRouting = function() {
  this.memory.routing = this.memory.routing || {};
};

/**
 * unit - return the unit configuration for this creep
 *
 * @return {object} - The generic configuration for this creep role
 **/
Creep.prototype.unit = function() {
  return roles[this.memory.role];
};

/**
 * mySignController signs the controller either with the default text or
 * attaches a Quest.
 **/
Creep.prototype.mySignController = function() {
  if (config.info.signController && this.room.exectueEveryTicks(config.info.resignInterval)) {
    let text = config.info.signText;
    if (config.quests.enabled && this.memory.role === 'reserver') {
      if (Math.random() < config.quests.signControllerPercentage) {
        const quest = {
          id: Math.floor(Math.random() * 100000),
          origin: this.memory.base,
          end: Math.floor(Game.time / 100) * 100 + config.quests.endTime,
          type: 'Quest',
          info: 'http://tooangel.github.io/screeps/doc/Quests.html',
        };
        text = JSON.stringify(quest);
        // Memory.quests[quest.id] = quest;
        if (config.debug.quest) {
          this.log('Attach quest:', text);
        }
      }
    }

    const returnCode = this.signController(this.room.controller, text);
    if (returnCode !== OK) {
      this.log('sign controller: ' + returnCode);
    }
  }
};

/**
 * inBase - Checks if the creep is in its base
 *
 * @return {boolean} If creep is in its base
 **/
Creep.prototype.inBase = function() {
  return this.room.name === this.memory.base;
};

/**
 * checkForHandle - Checks if the creep can be handled with the usual workflow
 * - spawning creeps are skipped
 * - recycling is handled here
 * - Check if the role is valid
 *
 * @return {boolean} - Creep is ready for handling
 **/
Creep.prototype.checkForHandle = function() {
  if (this.spawning) {
    return false;
  }

  if (this.memory.recycle) {
    Creep.recycleCreep(this);
    return false;
  }

  const role = this.memory.role;
  if (!role) {
    this.log('Creep role not defined for: ' + this.id + ' ' + this.name.split('-')[0].replace(/[0-9]/g, ''));
    this.memory.killed = true;
    this.suicide();
    return false;
  }
  return true;
};

Creep.prototype.handle = function() {
  if (!this.checkForHandle()) {
    return;
  }

  try {
    if (this.unit().setup) {
      this.unit().setup(this);
    }

    if (!this.memory.boosted && this.boost()) {
      return true;
    }

    if (this.memory.routing && this.memory.routing.reached) {
      return this.unit().action(this);
    }

    if (this.followPath(this.unit().action)) {
      return true;
    }

    this.log('Reached end of handling() why?', JSON.stringify(this.memory));
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
  const creep = this;
  const filter = (pos)=> {
    return creep.pos.isEqualTo(pos.x, pos.y) ? 1 : 0;
  };
  return _.sum(_.map(this.memory.last, filter)) > 1;
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

Creep.prototype.buildRoad = function() {
  if (!this.unit().buildRoad) {
    return false;
  }

  const target = Game.getObjectById(this.memory.routing.targetId);
  if (!config.buildRoad.buildToOtherMyRoom && target && target.structureType === STRUCTURE_STORAGE) {
    return false;
  }

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
      if ((structure.structureType === STRUCTURE_ROAD) && (structure.hits < structure.hitsMax)) {
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

Creep.prototype.killPrevious = function(path) {
  if (this.memory.routing.routePos !== this.memory.routing.route.length - 1) {
    return false;
  }

  if (this.memory.routing.pathPos !== path.length - 2) {
    return false;
  }

  if (!this.memory.killPrevious) {
    return false;
  }
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

  let killWho;
  let killWhoName;
  if (this.ticksToLive < previous.ticksToLive) {
    killWhoName = 'me';
    killWho = this;
  } else {
    killWhoName = 'other';
    killWho = previous;
  }

  if (killWho.ticksToLive > killWho.memory.timeToTravel) {
    this.log(`kill ${killWhoName} - me ttl: ${this.ticksToLive} they ttl: ${previous.ticksToLive}
me: ${JSON.stringify(this)} Memory: ${JSON.stringify(this.memory)}
other: ${JSON.stringify(previous)} Memory: ${JSON.stringify(previous.memory)}`);
  }
  killWho.memory.killed = true;
  killWho.suicide();
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

    if (this.ticksToLive < this.memory.nextSpawn) {
      this.respawnMe();
    }
  }
};
