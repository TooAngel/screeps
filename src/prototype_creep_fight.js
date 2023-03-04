'use strict';

const {isFriend} = require('./brain_squadmanager');

Creep.prototype.rangeAttackOutsideOfMyRooms = function(targets) {
  if (targets.length > 0) {
    if (!this.room.isMy()) {
      this.rangedAttack(targets[0]);
    }
  }
};

// TODO this method can be removed and the find directly used
Creep.prototype.findClosestSourceKeeper = function() {
  return this.pos.findClosestByRangeSourceKeeper();
};

Creep.prototype.findClosestEnemy = function() {
  return this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return !isFriend(object.owner.username);
    },
  });
};

Creep.prototype.fleeFromHostile = function(hostile) {
  let direction = RoomPosition.oppositeDirection(this.pos.getDirectionTo(hostile));
  if (!direction || direction === null || this.pos.isBorder(-1)) {
    this.moveTo(25, 25);
    return true;
  }
  for (let offset = 0; offset < 8; offset++) {
    const dir = RoomPosition.changeDirection(direction, offset);
    const pos = this.pos.getAdjacentPosition(dir);
    if (!pos.checkForWall() && pos.lookFor(LOOK_CREEPS).length === 0) {
      direction = dir;
      break;
    }
  }
  this.rangedAttack(hostile);
  this.move(direction);
};

Creep.prototype.attackHostile = function(hostile) {
  if (this.hits < 0.5 * this.hitsMax || this.pos.getRangeTo(hostile) < 3) {
    return this.fleeFromHostile(hostile);
  }

  this.moveToMy(hostile.pos);
  this.rangedAttack(hostile);
  return true;
};

Creep.prototype.moveToHostileConstructionSites = function() {
  const constructionSite = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (!object.owner) {
        return false;
      }
      if (object.owner.username === Memory.username) {
        return false;
      }
      return true;
    },
  });
  if (constructionSite !== null) {
    this.say('kcs');
    this.creepLog('Kill constructionSite');
    this.moveToMy(constructionSite.pos, 0);
    return true;
  }
  return false;
};

Creep.prototype.handleDefender = function() {
  const hostile = this.findClosestEnemy();

  if (this.fightRampart(hostile)) {
    return true;
  }

  if (hostile !== null) {
    return this.attackHostile(hostile);
  }

  if (this.healMyCreeps()) {
    return true;
  }

  if (this.healAllyCreeps()) {
    return true;
  }

  if (this.moveToHostileConstructionSites()) {
    return true;
  }

  const invaderCores = this.room.findInvaderCore();
  if (invaderCores.length > 0) {
    this.moveTo(invaderCores[0].pos);
    this.rangedAttack(invaderCores[0]);
    return true;
  }

  this.moveRandom();
  return true;
};

Creep.prototype.findClosestRampart = function() {
  return this.pos.findClosestByRangeRampart();
};

Creep.prototype.waitRampart = function() {
  this.say('waitRampart');
  const rampart = this.findClosestRampart();

  if (!rampart) {
    this.moveRandom();
    return true;
  }
  this.moveToMy(rampart.pos, 0);
  return true;
};

Creep.prototype.fightRampart = function(target) {
  if (!target) {
    return false;
  }

  const rampart = target.findClosestRampart();

  if (rampart === null) {
    return false;
  }

  const range = target.pos.getRangeTo(rampart);
  if (range > 3) {
    return false;
  }

  const targets = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
    filter: this.room.findAttackCreeps,
  });
  if (targets.length > 1) {
    this.rangedMassAttack();
  } else {
    this.rangedAttack(target);
  }

  const returnCode = this.moveToMy(rampart.pos, 0);
  if (returnCode === OK) {
    return true;
  }
  if (returnCode === ERR_TIRED) {
    return true;
  }

  // this.log('creep_fight.fightRampart returnCode: ' + returnCode);

  return true;
};

Creep.prototype.flee = function(target) {
  let direction = RoomPosition.oppositeDirection(this.pos.getDirectionTo(target));
  this.rangedAttack(target);
  const pos = this.pos.getAdjacentPosition(direction);
  const terrain = pos.lookFor(LOOK_TERRAIN)[0];
  if (terrain === 'wall') {
    direction = _.random(1, 8);
  }
  this.move(direction);
  return true;
};

Creep.prototype.fightRanged = function(target) {
  if (this.hits < 0.5 * this.hitsMax) {
    return this.flee(target);
  }

  const range = this.pos.getRangeTo(target);

  if (range <= 2) {
    return this.flee(target);
  }
  if (range <= 3) {
    this.rangedAttack(target);
    return true;
  }

  const returnCode = this.moveToMy(target.pos, 3);
  return returnCode;
};

/**
 * withdraw
 *
 * @param {object} creep
 * @return {boolean}
 */
function withdraw(creep) {
  if (creep.hits < 0.7 * creep.hitsMax) {
    const exitNext = creep.pos.findClosestByRange(FIND_EXIT);
    creep.moveTo(exitNext);
    return true;
  }
  return false;
}

/**
 * handleNotification
 *
 * @param {object} creep
 */
function handleNotification(creep) {
  creep.log('Attacking');
  Game.notify(Game.time + ' ' + creep.room.name + ' Attacking');
  creep.memory.notified = true;
}

/**
 * getStructureTarget
 *
 * @param {object} creep
 * @return {object}
 */
function getStructureTarget(creep) {
  let target = creep.pos.findClosestStructure(FIND_HOSTILE_STRUCTURES, STRUCTURE_TOWER);
  if (!target) {
    target = creep.pos.findClosestStructure(FIND_HOSTILE_STRUCTURES, STRUCTURE_SPAWN);
  }
  return target;
}

/**
 * destroyConstructionSites
 *
 * @param {object} creep
 */
function destroyConstructionSites(creep) {
  const cs = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: (constructionSite) => {
      switch (constructionSite) {
      case STRUCTURE_ROAD:
      case STRUCTURE_CONTROLLER:
      case STRUCTURE_KEEPER_LAIR:
      case STRUCTURE_WALL:
        return false;
      default:
        return true;
      }
    },
  });
  if (cs) {
    creep.moveTo(cs);
  } else {
    creep.healMyCreeps();
  }
}

Creep.prototype.siege = function() {
  this.memory.hitsLost = this.memory.hitsLast - this.hits;
  // This is the same as `lastHits`, except of the execution time, maybe both can be combined
  this.memory.hitsLast = this.hits;

  if (withdraw(this)) {
    return true;
  }

  if (!this.memory.notified) {
    handleNotification(this);
  }

  let target = getStructureTarget(this);
  if (!target) {
    destroyConstructionSites(this);
    return false;
  }
  const path = this.pos.findPathTo(target, {
    ignoreDestructibleStructures: false,
    ignoreCreeps: true,
  });

  const posLast = path[path.length - 1];
  if (path.length === 0 || !target.pos.isEqualTo(posLast.x, posLast.y)) {
    const structure = this.pos.findClosestStructure(FIND_STRUCTURES, STRUCTURE_RAMPART);
    this.moveTo(structure);
    target = structure;
  } else {
    if (this.hits > this.hitsMax - 2000) {
      this.moveByPath(path);
    }
  }

  const structures = target.pos.lookFor('structure');
  for (let i = 0; i < structures.length; i++) {
    if (structures[i].structureType === STRUCTURE_RAMPART) {
      target = structures[i];
      break;
    }
  }
  this.dismantle(target);
  return true;
};
