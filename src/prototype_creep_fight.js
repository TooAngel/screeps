'use strict';

Creep.prototype.findClosestSourceKeeper = function() {
  return this.pos.findClosestByRangePropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Source Keeper']);
};

Creep.prototype.findClosestEnemy = function() {
  return this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return !brain.isFriend(object.owner.username);
    }
  });
};

Creep.prototype.fleeFromHostile = function(hostile) {
  let direction = this.pos.getDirectionTo(hostile);
  direction = (direction + 3) % 8 + 1;
  if (!direction || direction === null || this.pos.x === 0 || this.pos.x === 49 || this.pos.y === 0 || this.pos.y === 49) {
    this.moveTo(25, 25);
    return true;
  }
  for (let offset = 0, dir, pos; offset < 8; offset++) {
    let dir = (direction + offset) % 8 + 1;
    let pos = this.pos.getAdjacentPosition(dir);
    if (!pos.checkForWall() && pos.lookFor(LOOK_CREEPS).length === 0) {
      direction = (direction + offset) % 8 + 1;
      break;
    }
  }
  this.rangedAttack(hostile);
  this.move(direction);
};

Creep.prototype.attackHostile = function(hostile) {
  let range;
  if (this.hits < 0.5 * this.hitsMax || this.pos.getRangeTo(hostile) < 3) {
    return this.fleeFromHostile(hostile);
  }

  let returnCode = this.moveToMy(hostile.pos);
  this.rangedAttack(hostile);
  return true;

};

Creep.prototype.healMyCreeps = function() {
  var myCreeps = this.room.find(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.hits < object.hitsMax) {
        return true;
      }
      return false;
    }
  });
  if (myCreeps.length > 0) {
    this.say('heal', true);
    this.moveTo(myCreeps[0]);
    if (this.pos.getRangeTo(myCreeps[0]) <= 1) {
      this.heal(myCreeps[0]);
    } else {
      this.rangedHeal(myCreeps[0]);
    }
    return true;
  }
  return false;
};

Creep.prototype.healAllyCreeps = function() {
  var allyCreeps = this.room.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      if (object.hits === object.hitsMax) {
        return false;
      }
      if (brain.isFriend(object.owner.username)) {
        return true;
      }
      return false;
    }
  });
  if (allyCreeps.length > 0) {
    this.say('heal ally', true);
    this.moveTo(allyCreeps[0]);
    let range = this.pos.getRangeTo(allyCreeps[0]);
    if (range <= 1) {
      this.heal(allyCreeps[0]);
    } else {
      this.rangedHeal(allyCreeps[0]);
    }
    return true;
  }
};

Creep.prototype.moveToHostileConstructionSites = function() {
  let constructionSite = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (!object.owner) {
        return false;
      }
      if (object.owner.username === Memory.username) {
        return false;
      }
      return true;
    }
  });
  if (constructionSite !== null) {
    this.say('kcs');
    this.log('Kill constructionSite: ' + JSON.stringify(constructionSite));
    let returnCode = this.moveToMy(constructionSite.pos, 0);
    return true;
  }
  return false;
};

Creep.prototype.handleDefender = function() {
  let hostile = this.findClosestEnemy();

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

  this.moveRandom();
  return true;
};

Creep.prototype.findClosestRampart = function() {
  return this.pos.findClosestByRangePropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_RAMPART], false, {
    filter: rampart => this.pos.getRangeTo(rampart) > 0 && !rampart.pos.checkForObstacleStructure()
  });
};

Creep.prototype.waitRampart = function() {
  this.say('waitRampart');
  const rampart = this.findClosestRampart();

  if (!rampart) {
    this.moveRandom();
    return true;
  }
  const returnCode = this.moveToMy(rampart.pos, 0);
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
    filter: this.room.findAttackCreeps
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

  this.log('creep_fight.fightRampart returnCode: ' + returnCode);

  return true;
};

Creep.prototype.flee = function(target) {
  let direction = this.pos.getDirectionTo(target);
  this.rangedAttack(target);
  direction = (direction + 3) % 8 + 1;
  let pos = this.pos.getAdjacentPosition(direction);
  let terrain = pos.lookFor(LOOK_TERRAIN)[0];
  if (terrain === 'wall') {
    direction = (Math.random() * 8) + 1;
  }
  this.move(direction);
  return true;
};

Creep.prototype.fightRanged = function(target) {
  if (this.hits < 0.5 * this.hitsMax) {
    return this.flee(target);
  }

  var range = this.pos.getRangeTo(target);
  var direction = null;

  if (range <= 2) {
    return this.flee(target);
  }
  if (range <= 3) {
    let returnCode = this.rangedAttack(target);
    return true;
  }

  let returnCode = this.moveToMy(target.pos, 3);
  if (returnCode === OK) {
    return true;
  }
  if (returnCode === ERR_TIRED) {
    return true;
  }

  this.log('creep_ranged.attack_without_rampart returnCode: ' + returnCode);
};

Creep.prototype.siege = function() {
  this.memory.hitsLost = this.memory.hitsLast - this.hits;
  this.memory.hitsLast = this.hits;

  // if (this.hits - this.memory.hitsLost < this.hits / 2) {
  if (this.hits < 0.7 * this.hitsMax) {
    let exitNext = this.pos.findClosestByRange(FIND_EXIT);
    this.moveTo(exitNext);
    return true;
  }

  if (!this.memory.notified) {
    this.log('Attacking');
    Game.notify(Game.time + ' ' + this.room.name + ' Attacking');
    this.memory.notified = true;
  }
  var tower = this.pos.findClosestStructure(FIND_HOSTILE_STRUCTURES, STRUCTURE_TOWER);
  let target = tower;
  if (tower === null) {
    var spawn = this.pos.findClosestStructure(FIND_HOSTILE_STRUCTURES, STRUCTURE_SPAWN);
    target = spawn;
  }
  if (target === null) {
    var cs = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    this.moveTo(cs);
    return false;
  }
  var path = this.pos.findPathTo(target, {
    ignoreDestructibleStructures: false,
    ignoreCreeps: true
  });
  let returnCode;

  var posLast = path[path.length - 1];
  if (path.length === 0 || !target.pos.isEqualTo(posLast.x, posLast.y)) {
    var structure = this.pos.findClosestStructure(FIND_STRUCTURES, STRUCTURE_RAMPART);
    returnCode = this.moveTo(structure);
    target = structure;
  } else {
    if (this.hits > this.hitsMax - 2000) {
      returnCode = this.moveByPath(path);
    }
  }

  let structures = target.pos.lookFor('structure');
  for (let i = 0; i < structures.length; i++) {
    if (structures[i].structureType === STRUCTURE_RAMPART) {
      target = structures[i];
      break;
    }
  }

  this.dismantle(target);
  return true;
};

Creep.prototype.squadHeal = function() {
  var range;
  let creepToHeal = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax;
    }
  });

  if (creepToHeal !== null) {
    range = this.pos.getRangeTo(creepToHeal);
    if (range > 1) {
      this.rangedHeal(creepToHeal);
    } else {
      this.heal(creepToHeal);
    }
    if (creepToHeal.id === this.id) {
      this.say('exit');
      let exit = this.pos.findClosestByRange(FIND_EXIT);
      this.moveTo(exit);
    } else {
      this.say(JSON.stringify(creepToHeal));
      this.moveTo(creepToHeal);
    }
    return true;
  }

  const attacker = this.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['squadsiege']);

  if (this.pos.x === 0 ||
    this.pos.x === 49 ||
    this.pos.y === 0 ||
    this.pos.y === 49
  ) {
    this.moveTo(25, 25);
    return true;
  }
  if (attacker === null) {
    var cs = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    this.moveTo(cs);
    return false;
  }
  this.moveTo(attacker);
  return false;
};
