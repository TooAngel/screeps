'use strict';

Creep.prototype.rangeAttackOutsideOfMyRooms = function(targets) {
  if (targets.length > 0) {
    if (!this.room.controller || !this.room.controller.my) {
      this.rangedAttack(targets[0]);
    }
  }
};

Creep.prototype.findClosestSourceKeeper = function() {
  return this.pos.findClosestByRangePropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Source Keeper']);
};

Creep.prototype.findClosestEnemy = function() {
  return this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return !brain.isFriend(object.owner.username);
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
    this.log('Kill constructionSite');
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
  return this.pos.findClosestByRangePropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_RAMPART], {
    filter: (rampart) => this.pos.getRangeTo(rampart) > 0 && !rampart.pos.checkForObstacleStructure(),
  });
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

Creep.prototype.siege = function() {
  this.memory.hitsLost = this.memory.hitsLast - this.hits;
  this.memory.hitsLast = this.hits;

  // if (this.hits - this.memory.hitsLost < this.hits / 2) {
  if (this.hits < 0.7 * this.hitsMax) {
    const exitNext = this.pos.findClosestByRange(FIND_EXIT);
    this.moveTo(exitNext);
    return true;
  }

  if (!this.memory.notified) {
    this.log('Attacking');
    Game.notify(Game.time + ' ' + this.room.name + ' Attacking');
    this.memory.notified = true;
  }
  const tower = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, STRUCTURE_TOWER);
  let target = tower;
  if (tower === null) {
    const spawn = this.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, STRUCTURE_SPAWN);
    target = spawn;
  }
  if (target === null) {
    const cs = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    this.moveTo(cs);
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
