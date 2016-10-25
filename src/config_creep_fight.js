'use strict';

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
    if (returnCode == OK) {
      this.pos.createConstructionSite(STRUCTURE_RAMPART);
    }
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
