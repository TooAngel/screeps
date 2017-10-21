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

Creep.prototype.moveRandomWithin = function(goal, dist = 3) {
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
