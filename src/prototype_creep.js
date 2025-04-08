'use strict';

const {addToReputation} = require('./diplomacy');

/**
 * The data property represent the current data of the creep stored on the heap
 */
Object.defineProperty(Creep.prototype, 'data', {
  get() {
    if (!global.data.creeps[this.name]) {
      global.data.creeps[this.name] = {};
    }
    return global.data.creeps[this.name];
  },
});

/**
 * getLink - Gets the link from heap data, or sets if missing
 *
 * @param {object} creep - The creep
 * @return {object} - The link
 **/
Creep.prototype.getCloseByLink = function() {
  if (this.room.controller.level < 5) {
    return;
  }
  if (!this.data.link) {
    const structures = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: {structureType: STRUCTURE_LINK}});
    if (structures.length === 0) {
      return;
    }
    this.data.link = structures[0].id;
  }
  return Game.getObjectById(this.data.link);
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
  if (config.info.signController && this.room.executeEveryTicks(config.info.resignInterval)) {
    let text = config.info.signText;
    if (config.quests.enabled && this.memory.role === 'reserver' && Game.rooms[this.memory.base].terminal) {
      if (Math.random() < config.quests.signControllerPercentage) {
        const quest = {
          type: 'quest',
          id: Math.floor(Math.random() * 100000),
          origin: this.memory.base,
          info: 'http://tooangel.github.io/screeps',
        };
        text = JSON.stringify(quest);
        this.room.debugLog('quests', `Attach quest: ${text}`);
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

Creep.prototype.inMyRoom = function() {
  return this.room.isMy();
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

Creep.prototype.handleAttacked = function() {
  if (!this.data.lastHits) {
    this.data.lastHits = this.hits;
    return;
  }
  if (this.data.lastHits > this.hits) {
    const hostileCreeps = this.room.findHostileAttackingCreeps();
    for (const hostileCreep of hostileCreeps) {
      addToReputation(hostileCreep.owner.username, this.hits - this.data.lastHits);
    }
  }
  this.data.lastHits = this.hits;
};

Creep.prototype.handle = function() {
  this.memory.room = this.pos.roomName;
  if (!this.checkForHandle()) {
    return;
  }
  try {
    this.handleAttacked();

    if (!this.unit()) {
      this.log('Unknown role suiciding');
      this.suicide();
      return;
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
      JSON.stringify(this.memory) + ' ' +
      err;
    if (err !== null) {
      message += '\n' + err.stack;
    }

    this.log(message);
    Game.notify(message, 30);
  } finally {
    if (this.fatigue === 0) {
      if (this.memory.lastPositions === undefined) {
        this.memory.lastPositions = [];
      }
      this.memory.lastPositions.unshift(this.pos);
      this.memory.lastPositions = this.memory.lastPositions.slice(0, 7);
    }
  }
};

Creep.prototype.isStuck = function() {
  if (!this.memory.lastPositions) {
    return false;
  }
  const creep = this;
  const filter = (accumulator, currentValue) => {
    const value = creep.pos.isEqualTo(currentValue.x, currentValue.y) ? 1 : 0;
    return accumulator + value;
  };
  const sum = this.memory.lastPositions.reduce(filter, 0);
  const stuck = sum > 4;
  return stuck;
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
    Math.min(48, this.pos.x + 1),
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

Creep.prototype.notBuildRoadWithLowEnergyButOnSwamp = function() {
  if (this.room.isMy() &&
    this.room.energyCapacityAvailable < 550 &&
    this.pos.lookFor(LOOK_TERRAIN)[0] !== 'swamp') {
    return true;
  }
};

Creep.prototype.repairRoadOnSpot = function() {
  const structures = this.pos.lookFor(LOOK_STRUCTURES);
  if (structures.length > 0) {
    for (const structure of structures) {
      if ((structure.structureType === STRUCTURE_ROAD) && (structure.hits < structure.hitsMax)) {
        this.repair(structure);
        return true;
      }
    }
  }
};

Creep.prototype.checkIfBuildRoadIsPossible = function() {
  if (!this.unit().buildRoad) {
    return false;
  }

  const target = Game.getObjectById(this.memory.routing.targetId);
  if (!config.buildRoad.buildToOtherMyRoom && target && target.structureType === STRUCTURE_STORAGE) {
    return false;
  }

  if (this.notBuildRoadWithLowEnergyButOnSwamp()) {
    return false;
  }

  // TODO as creep variable
  if (this.memory.role !== 'carry' && this.memory.role !== 'universal') {
    this.getEnergyFromStructure();
  }

  if (this.carry.energy === 0) {
    return false;
  }

  if (this.room.controller && !this.room.controller.my && this.room.controller.owner) {
    return false;
  }

  return true;
};

Creep.prototype.buildRoad = function() {
  if (!this.checkIfBuildRoadIsPossible()) {
    return false;
  }

  if (this.pos.isBorder(-1)) {
    return true;
  }

  if (this.repairRoadOnSpot()) {
    return true;
  }

  let constructionSites = this.pos.findInRangeConstructionSiteRoad(3);
  if (constructionSites.length > 0) {
    this.build(constructionSites[0]);
    return true;
  }

  constructionSites = this.room.findConstructionSiteRoad();
  if (
    constructionSites.length <= config.buildRoad.maxConstructionSitesRoom &&
    Object.keys(Game.constructionSites).length < config.buildRoad.maxConstructionSitesTotal &&
    this.memory.routing.pathPos >= 0
  // && this.pos.inPath()
  ) {
    const returnCode = this.pos.createConstructionSite(STRUCTURE_ROAD);
    if (returnCode === OK) {
      return true;
    }
    if (returnCode !== ERR_INVALID_TARGET && returnCode !== ERR_FULL && returnCode !== ERR_NOT_OWNER) {
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
    // TODO this happens sometimes, e.g. `kill other - me ttl: 1473 they ttl: 44`
    // needs to be investigated (if it is really an issue)
    this.creepLog(`kill ${killWhoName} - me ttl: ${this.ticksToLive} they ttl: ${previous.ticksToLive}`);
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
    type: this.memory.routing.type,
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
    if (this.ticksToLive === this.memory.nextSpawn) {
      if (maxOfRole) {
        const creepOfRole = this.room.findCreep(this.memory.role);
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
