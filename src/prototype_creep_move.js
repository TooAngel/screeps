'use strict';

Creep.prototype.moveRandom = function(onPath) {
  const startDirection = _.random(1, 8);
  let direction = 0;
  for (let i = 0; i < 8; i++) {
    direction = RoomPosition.changeDirection(startDirection, i);
    const pos = this.pos.getAdjacentPosition(direction);
    if (pos.isBorder(-1)) {
      continue;
    }
    if (onPath && !pos.inPath()) {
      continue;
    }
    if (pos.checkForWall()) {
      continue;
    }
    if (pos.checkForObstacleStructure()) {
      continue;
    }
    break;
  }
  this.move(direction);
};

Creep.prototype.moveRandomWithin = function(goal, dist = 3, goal2 = false) {
  const startDirection = _.random(1, 8);
  let direction = 0;
  for (let i = 0; i < 8; i++) {
    direction = RoomPosition.changeDirection(startDirection, i);
    const pos = this.pos.getAdjacentPosition(direction);
    if (pos.isBorder(-1)) {
      continue;
    }
    if (pos.getRangeTo(goal) > dist) {
      continue;
    }
    if (goal2 && pos.getRangeTo(goal2) > dist) {
      continue;
    }
    if (pos.checkForWall()) {
      continue;
    }
    if (pos.checkForObstacleStructure()) {
      continue;
    }
    break;
  }
  this.move(direction);
};

Creep.prototype.moveCreep = function(position, direction) {
  if (position.isBorder(-1)) {
    return false;
  }

  const pos = new RoomPosition(position.x, position.y, this.room.name);
  const creeps = pos.lookFor('creep');
  if (creeps.length > 0 && creeps[0].memory) {
    const role = this.memory.role;
    if (creeps[0] && !creeps[0].memory.routing) {
      creeps[0].memory.routing = {};
    }
    if ((role === 'sourcer' || role === 'reserver') && creeps[0].memory.role !== 'harvester' && !creeps[0].memory.routing.reverse) {
      creeps[0].move(direction);
      creeps[0].memory.forced = true;
      return true;
    }
    const targetRole = creeps[0].memory.role;
    if (role === 'defendmelee' ||
      targetRole === 'harvester' ||
      targetRole === 'carry') {
      creeps[0].move(direction);
      return true;
    }
    if (role === 'upgrader' &&
      targetRole === 'storagefiller') {
      creeps[0].move(direction);
      return true;
    }
    if (role === 'upgrader' &&
      (targetRole === 'harvester' || targetRole === 'sourcer' || targetRole === 'upgrader')) {
      this.log('config_creep_move suicide ' + targetRole);
      creeps[0].suicide();
      return true;
    }
  }
};

Creep.prototype.preMoveExtractorSourcer = function(directions) {
  this.pickupEnergy();

  // Misplaced spawn
  if ((this.memory.role === 'sourcer') && this.inBase() && (this.room.memory.misplacedSpawn || this.room.controller.level < 3)) {
    // this.say('smis', true);
    const targetId = this.memory.routing.targetId;

    const source = this.room.memory.position.creep[targetId];
    // TODO better the position from the room memory
    this.moveTo(source, {
      ignoreCreeps: true,
    });
    if (this.pos.getRangeTo(source) > 1) {
      return true;
    }
  }

  if (!this.room.controller) {
    const target = this.findClosestSourceKeeper();
    if (target !== null) {
      const range = this.pos.getRangeTo(target);
      if (range > 6) {
        this.memory.routing.reverse = false;
      }
      if (range < 6) {
        this.memory.routing.reverse = true;
      }
    } else {
      // todo-msc if SourceKeeper is killed while reverse == true
      this.memory.routing.reverse = false;
    }
  }

  // TODO copied from nextroomer, should be extracted to a method or a creep flag
  // Remove structures in front
  if (!directions) {
    return false;
  }
  // TODO when is the forwardDirection missing?
  if (directions.forwardDirection) {
    const posForward = this.pos.getAdjacentPosition(directions.forwardDirection);
    let terrain = posForward.lookFor(LOOK_TERRAIN);
    const structures = posForward.lookFor(LOOK_STRUCTURES);
    for (const structure of structures) {
      if (structure.structureType === STRUCTURE_ROAD) {
        terrain = ['road'];
        continue;
      }
      if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
        continue;
      }
      if (structure.structureType === STRUCTURE_SPAWN && structure.my) {
        continue;
      }
      this.dismantle(structure);
      this.say('dismantle', true);
      break;
    }
    if (!this.memory.last || this.pos.x !== this.memory.last.pos1.x || this.pos.y !== this.memory.last.pos1.y) {
      if (!this.memory.pathDatas) {
        this.memory.pathDatas = {swamp: 0, plain: 0, road: 0};
      }
      this.memory.pathDatas[terrain[0]]++;
    }
  }
};

Creep.prototype.checkForSourceKeeper = function() {
  if (!this.room.controller) {
    const target = this.findClosestSourceKeeper();
    if (target !== null) {
      const range = this.pos.getRangeTo(target);
      if (range > 6) {
        this.memory.routing.reverse = false;
      }
      if (range < 6) {
        this.memory.routing.reverse = true;
      }
    }
  }
};
