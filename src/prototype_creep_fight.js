'use strict';

Creep.prototype.findClosestSourceKeeper = function() {
  return this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      if (object.owner.username == 'Source Keeper') {
        return true;
      }
      return false;
    }
  });
};

Creep.prototype.findClosestEnemy = function() {
  return this.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return !brain.isFriend(object.owner.username);
    }
  });
};

Creep.prototype.handleDefender = function() {
  let hostile = this.findClosestEnemy();

  let hostiles = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
    filter: function(object) {
      return !brain.isFriend(object.owner.username);
    }
  });

  if (this.fightRampart(hostile)) {
    return true;
  }

  var range;
  if (hostile !== null) {
    if (this.hits < 0.5 * this.hitsMax) {
      let direction = this.pos.getDirectionTo(hostile);
      this.rangedAttack(hostile);
      direction = (direction + 3) % 8 + 1;
      let pos = this.pos.getAdjacentPosition(direction);
      let terrain = pos.lookFor(LOOK_TERRAIN)[0];
      if (terrain == 'wall') {
        direction = (Math.random() * 8) + 1;
      }
      this.move(direction);
      return true;
    }

    range = this.pos.getRangeTo(hostile);
    if (range > 3) {
      let search = PathFinder.search(
        this.pos, {
          pos: hostile.pos,
          range: 0
        }, {
          roomCallback: this.room.getAvoids(this.room, {}, true),
          maxRooms: 0
        }
      );

      if (search.incomplete) {
        this.moveRandom();
      }
      let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    }
    if (range === 0) {
      this.log('Range: ' + range);
    }
    if (range < 3) {
      var direction = this.pos.getDirectionTo(hostile);
      direction = (direction + 3) % 8 + 1;
      if (!direction || direction === null || this.pos.x === 0 || this.pos.x == 49 || this.pos.y === 0 || this.pos.y == 49) {
        this.moveTo(25, 25);
        return true;
      }
      var pos = this.pos.getAdjacentPosition(direction);
      var field = pos.lookFor(LOOK_TERRAIN)[0];
      if (field == 'wall') {
        direction = Math.floor((Math.random() * 8) + 1);
      }
      let creeps = pos.lookFor('creep');
      if (creeps.length > 0) {
        direction = Math.floor((Math.random() * 8) + 1);
      }
      this.move(direction);
    }
    this.rangedAttack(hostile);
    return true;
  }

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
    range = this.pos.getRangeTo(myCreeps[0]);
    if (range <= 1) {
      this.heal(myCreeps[0]);
    } else {
      this.rangedHeal(myCreeps[0]);
    }
    return true;
  }

  var allyCreeps = this.room.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      if (object.hits == object.hitsMax) {
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
    range = this.pos.getRangeTo(myCreeps[0]);
    if (range <= 1) {
      this.heal(allyCreeps[0]);
    } else {
      this.rangedHeal(allyCreeps[0]);
    }
    return true;
  }

  let constructionSite = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (!object.owner) {
        return false;
      }
      if (object.owner.username == Memory.username) {
        return false;
      }
      return true;
    }
  });
  if (constructionSite !== null) {
    this.say('kcs');
    this.log('Kill constructionSite: ' + JSON.stringify(constructionSite));
    let search = PathFinder.search(
      this.pos, {
        pos: constructionSite.pos,
        range: 0
      }, {
        roomCallback: this.room.getAvoids(this.room, {}, true),
        maxRooms: 0
      }
    );

    if (search.incomplete) {
      this.moveRandom();
      return true;
    }
    let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    return true;
  }

  this.moveRandom();
  return true;
};

Creep.prototype.waitRampart = function() {
  this.say('waitRampart');
  let creep = this;
  let structure = this.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: function(object) {
      if (object.structureType != STRUCTURE_RAMPART) {
        return false;
      }
      return creep.pos.getRangeTo(object) > 0;
    }
  });

  if (!structure) {
    this.moveRandom();
    return true;
  }
  let search = PathFinder.search(
    this.pos, {
      pos: structure.pos,
      range: 0
    }, {
      roomCallback: this.room.getAvoids(this.room, {}, true),
      maxRooms: 0
    }
  );

  if (search.incomplete) {
    this.moveRandom();
    return true;
  }
  let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
  return true;
};

Creep.prototype.fightRampart = function(target) {
  if (!target) {
    return false;
  }

  let position = target.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_RAMPART;
    }
  });

  if (position === null) {
    return false;
  }

  let range = target.pos.getRangeTo(position);
  if (range > 3) {
    return false;
  }

  let callback = this.room.getMatrixCallback;

  // TODO Extract the callback method to ... e.g. room and replace this.room.getAvoids
  if (this.room.memory.costMatrix && this.room.memory.costMatrix.base) {
    let room = this.room;
    callback = function(end) {
      let callbackInner = function(roomName) {
        let costMatrix = PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
        // TODO the ramparts could be within existing walls (at least when converging to the newmovesim
        costMatrix.set(position.pos.x, position.pos.y, 0);
        return costMatrix;
      };
      return callbackInner;
    };
  }

  let search = PathFinder.search(
    this.pos, {
      pos: position.pos,
      range: 0
    }, {
      roomCallback: callback(position.pos),
      maxRooms: 1
    }
  );

  let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
  if (returnCode == OK) {
    return true;
  }
  if (returnCode == ERR_TIRED) {
    return true;
  }

  this.log('creep_fight.fightRampart returnCode: ' + returnCode + ' path: ' + JSON.stringify(search.path[0]));

  let targets = this.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
    filter: this.room.findAttackCreeps
  });
  if (targets.length > 1) {
    this.rangedMassAttack();
  } else {
    this.rangedAttack(target);
  }
  return true;
};

Creep.prototype.flee = function(target) {
  let direction = this.pos.getDirectionTo(target);
  this.rangedAttack(target);
  direction = (direction + 3) % 8 + 1;
  let pos = this.pos.getAdjacentPosition(direction);
  let terrain = pos.lookFor(LOOK_TERRAIN)[0];
  if (terrain == 'wall') {
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

  let creep = this;
  let callbackFunction = function(roomName) {
    let callback = creep.room.getAvoids(creep.room);
    let costMatrix = callback(roomName);
    for (let i = 0; i < 50; i++) {
      costMatrix.set(i, 0, 0xFF);
      costMatrix.set(i, 49, 0xFF);
      costMatrix.set(0, i, 0xFF);
      costMatrix.set(49, i, 0xFF);
    }
    let room = Game.rooms[roomName];
    let structures = room.find(FIND_STRUCTURES, {
      filter: function(object) {
        return object.structureType != STRUCTURE_ROAD;
      }
    });
    for (let i in structures) {
      let structure = structures[i];
      costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
    }
    return costMatrix;
  };

  let search = PathFinder.search(
    this.pos, {
      pos: target.pos,
      range: 3
    }, {
      roomCallback: callbackFunction,
      maxRooms: 1
    }
  );

  let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
  if (returnCode == OK) {
    return true;
  }
  if (returnCode == ERR_TIRED) {
    return true;
  }

  this.log('creep_ranged.attack_without_rampart returnCode: ' + returnCode);
};

Creep.prototype.avoidEdge = function(range) {
  let lowerRangeModifier = range - 1;
  let higherRangeModifier = 50 - range;
  if (this.pos.x <= lowerRangeModifier ||
    this.pos.x >= higherRangeModifier ||
    this.pos.y <= lowerRangeModifier ||
    this.pos.y >= higherRangeModifier
  ) {
    this.moveTo(25, 25, {
      reusePath: 0
    });
    return true;
  }
  return false;
};

Creep.prototype.fightSafeMode = function() {
  if (this.room.controller.safeMode) {
    let constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
    this.moveTo(constructionSites[0], {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  }
  return false;
};

Creep.prototype.notifyAttack = function() {
  if (config.autoattack.notify && !this.memory.notified) {
    this.log('Attacking');
    Game.notify(Game.time + ' ' + this.room.name + ' Attacking');
    this.memory.notified = true;
  }
};

Creep.prototype.siege = function() {

  this.notifyAttack();

  if (this.fightSafeMode()) {
    return true;
  }

  var spawn = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      return ((object.structureType == STRUCTURE_SPAWN || object.structureType == STRUCTURE_TOWER) && !object.pos.lookFor(LOOK_STRUCTURES)[1]);
    }
  });
  if (spawn === null) {
    spawn = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
      filter: function(object) {
        return (object.structureType == STRUCTURE_SPAWN || object.structureType == STRUCTURE_TOWER);
      }
    });
  }

  if (spawn === null) {
    let structures = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
      filter: function(object) {
        return object.structureType != STRUCTURE_CONTROLLER;
      }
    });
    if (structures === null) {
      this.say('YouGotPwnd', true);
      var constructionSites = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
      this.moveTo(constructionSites, {
        reusePath: 0,
        ignoreCreeps: true
      });
      return true;
    }
    this.moveTo(structures, {
      reusePath: 0,
      ignoreCreeps: true
    });
    this.dismantle(structures);
    return true;
  }

  let search = PathFinder.search(
    this.pos, {
      pos: spawn.pos,
      range: 1
    }, {
      maxRooms: 1
    }
  );

  var healer = this.pos.findInRange(FIND_MY_CREEPS, 45, {
    filter: function(object) {
      return object.memory.role == 'squadheal';
    }
  });

  var attackerClose = this.pos.findInRange(FIND_MY_CREEPS, 5, {
    filter: function(object) {
      return object.memory.role == 'squadsiege' || object.memory.role == 'autoattackmelee';
    }
  });

  var attackerFar = this.pos.findInRange(FIND_MY_CREEPS, 48, {
    filter: function(object) {
      return object.memory.role == 'squadsiege' || object.memory.role == 'autoattackmelee';
    }
  });

  if (this.pos.getRangeTo(spawn.pos) <= 1) {
    this.dismantle(spawn);
    return true;
  } else if (search.path[0].lookFor(LOOK_STRUCTURES).length !== 0 && search.path[0].lookFor(LOOK_STRUCTURES)[0].structureType != STRUCTURE_ROAD) {
    this.say('RazingLow!', true);
    let structures = this.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: function(object) {
        return object.structureType != STRUCTURE_ROAD;
      }
    });
    structures.sort(function(a, b) { return a.hits - b.hits; });
    this.dismantle(structures[0]);
    this.moveTo(structures[0], {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  } else if (search.path[0].lookFor(LOOK_CREEPS).length !== 0 && search.path[1] && search.path[1].lookFor(LOOK_STRUCTURES).length !== 0 && search.path[1].lookFor(LOOK_STRUCTURES)[0].structureType != STRUCTURE_ROAD) {
    this.say('Razing!', true);
    this.moveTo(search.path[1], {
      reusePath: 0
    });
    return true;
  } else if (healer.length > 2 || (attackerClose === 0 && attackerFar !== 0) || !this.memory.squad) {
    this.say('Terminatin', true);
    let structures = this.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: function(object) {
        return object.structureType != STRUCTURE_ROAD;
      }
    });
    structures.sort(function(a, b) { return a.hits - b.hits; });
    this.dismantle(structures[0]);
    this.move(this.pos.getDirectionTo(search.path[0]), {
      ignoreCreeps: true
    });
    return true;
  }
  if (this.avoidEdge(2)) {
    return true;
  }
  return false;
};

Creep.prototype.autosiege = function() {

  this.notifyAttack();

  if (this.fightSafeMode()) {
    return true;
  }

  var spawn = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      return ((object.structureType == STRUCTURE_SPAWN || object.structureType == STRUCTURE_TOWER) && !object.pos.lookFor(LOOK_STRUCTURES)[1]);
    }
  });
  if (spawn === null) {
    spawn = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
      filter: function(object) {
        return (object.structureType == STRUCTURE_SPAWN || object.structureType == STRUCTURE_TOWER);
      }
    });
  }
  if (spawn === null) {
    var hostileCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (hostileCreep === null) {
      this.say('Razing!', true);
      let structures = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: function(object) {
          return object.structureType != STRUCTURE_CONTROLLER;
        }
      });
      if (structures === null) {
        this.say('YouGotPwnd', true);
        var constructionSites = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        this.moveTo(constructionSites, {
          reusePath: 0,
          ignoreCreeps: true
        });
        return true;
      }
      this.moveTo(structures, {
        reusePath: 0,
        ignoreCreeps: true
      });
      this.attack(structures);
      return true;
    }
    this.say('ARRRGH!!', true);
    this.moveTo(hostileCreep, {
      reusePath: 0,
      ignoreCreeps: true
    });
    this.attack(hostileCreep);
    return true;
  }

  let search = PathFinder.search(
    this.pos, {
      pos: spawn.pos,
      range: 1
    }, {
      maxRooms: 1
    }
  );

  let closestHostileCreep = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (this.pos.getRangeTo(closestHostileCreep) <= 25 && closestHostileCreep.pos.lookFor(LOOK_STRUCTURES) === null) {
    this.say('ARRRGH!!', true);
    this.moveTo(closestHostileCreep, {
      reusePath: 0
    });
    this.attack(closestHostileCreep);
    return true;
  }
  var healer = this.pos.findInRange(FIND_MY_CREEPS, 45, {
    filter: function(object) {
      return object.memory.role == 'squadheal';
    }
  });
  var attackerClose = this.pos.findInRange(FIND_MY_CREEPS, 5, {
    filter: function(object) {
      return object.memory.role == 'squadsiege' || object.memory.role == 'autoattackmelee';
    }
  });
  var attackerFar = this.pos.findInRange(FIND_MY_CREEPS, 48, {
    filter: function(object) {
      return object.memory.role == 'squadsiege' || object.memory.role == 'autoattackmelee';
    }
  });
  if (this.pos.getRangeTo(spawn.pos) == 1) {
    this.say('ARRRGH!!', true);
    this.attack(spawn);
    return true;
  }
  if (search.path[0].lookFor(LOOK_STRUCTURES).length !== 0 && search.path[0].lookFor(LOOK_STRUCTURES)[0].structureType != STRUCTURE_ROAD) {
    let structures = this.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: function(object) {
        return object.structureType != STRUCTURE_ROAD;
      }
    });
    structures.sort(function(a, b) { return a.hits - b.hits; });
    this.say('RazingLow!', true);
    this.attack(structures[0]);
    this.moveTo(structures[0], {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  }
  if (search.path[0].lookFor(LOOK_CREEPS).length !== 0 && search.path[1] && search.path[1].lookFor(LOOK_STRUCTURES).length !== 0 && search.path[1].lookFor(LOOK_STRUCTURES)[0].structureType != STRUCTURE_ROAD) {
    this.say('Razing!', true);
    this.moveTo(search.path[1], {
      reusePath: 0
    });
    return true;
  }
  if (healer.length > 2 || (attackerClose === 0 && attackerFar !== 0) || !this.memory.squad) {
    this.say('Terminatin', true);
    let structures = this.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: function(object) {
        return object.structureType != STRUCTURE_ROAD;
      }
    });
    structures.sort(function(a, b) { return a.hits - b.hits; });
    this.attack(structures[0]);
    this.move(this.pos.getDirectionTo(search.path[0]), {
      ignoreCreeps: true
    });
    return true;
  }
  if (this.avoidEdge(2)) {
    return true;
  }
  return false;
};

Creep.prototype.squadHeal = function() {
  var range;
  var creepsToHeal = this.pos.findInRange(FIND_MY_CREEPS, 10, {
    filter: function(object) {
      return object.hits < object.hitsMax / 1.5;
    }
  });
  creepsToHeal.sort(function(a, b) { return a.hits - b.hits; });
  if (creepsToHeal.length !== 0) {
    let creepToHeal = creepsToHeal[0];
    range = this.pos.getRangeTo(creepToHeal);
    if (range <= 1) {
      this.heal(creepToHeal);
      this.moveTo(creepToHeal, {
        reusePath: 0,
        ignoreCreeps: true
      });
    } else {
      this.rangedHeal(creepToHeal);
      this.moveTo(creepToHeal, {
        reusePath: 0,
        ignoreCreeps: true
      });
    }
    return true;
  }

  var creepToHeal = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax;
    }
  });

  if (creepToHeal !== null && creepToHeal.pos.getRangeTo(this) < 25) {
    range = this.pos.getRangeTo(creepToHeal);
    if (range > 1) {
      this.rangedHeal(creepToHeal);
    } else {
      this.heal(creepToHeal);
    }
    if (creepToHeal.id == this.id && this.room.name == this.memory.routing.targetRoom) {
      this.say('heal here?');
      let exitNext = this.pos.findClosestByRange(FIND_EXIT);
      this.cancelOrder('move');
      this.cancelOrder('moveTo');
      this.moveTo(exitNext, {
        reusePath: 0,
        ignoreCreeps: true
      });
    } else if (this.pos.getRangeTo(creepToHeal) == 1) {
      this.say('healpower!', true);
      this.moveTo(creepToHeal, {
        reusePath: 0,
        ignoreCreeps: true
      });
    } else if (this.pos.getRangeTo(creepToHeal < 25)) {
      this.say('healpower!', true);
      this.moveTo(creepToHeal, {
        reusePath: 0,
      });
    }
    return true;
  }

  var attacker = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.memory.role == 'squadsiege' || object.memory.role == 'autoattackmelee';
    }
  });

  if (this.pos.x === 0 ||
    this.pos.x == 49 ||
    this.pos.y === 0 ||
    this.pos.y == 49
  ) {
    this.moveTo(25, 25, {
      reusePath: 0
    });
    return true;
  }
  if (this.room.name != this.memory.routing.targetRoom && this.hits == this.hitsMax) {
    return false;
  }
  if (attacker === null) {
    return true;
  }
  if (this.pos.getRangeTo(attacker) == 1) {
    this.moveTo(attacker, {
      reusePath: 0,
      ignoreCreeps: true
    });
    return true;
  }
  if (this.moveTo(attacker, {
      reusePath: 0,
    }) != OK) {
    this.moveTo(attacker, {
      reusePath: 0,
      ignoreCreeps: true
    });
    range = this.pos.getRangeTo(attacker);
    if (range > 1) {
      this.rangedHeal(attacker);
    } else {
      this.heal(attacker);
    }
    return true;
  }

  return true;
};
