'use strict';

Creep.prototype.moveRandom = function(onPath) {
  let start = Math.ceil(Math.random() * 8);
  let direction = 0;
  for (let i = start; i < start + 8; i++) {
    direction = ((i - 1) % 8) + 1;
    let pos = this.pos.getAdjacentPosition(direction);
    if (pos.isExit()) {
      continue;
    }
    if (onPath && !pos.inPath()) {
      continue;
    }

    break;
  }
  this.move(direction);
};

Creep.prototype.moveRandomWithin = function(goal, dist = 3) {
  let start = Math.ceil(Math.random() * 8);
  let direction = 0;
  for (let i = start; i < start + 8; i++) {
    direction = ((i - 1) % 8) + 1;
    let pos = this.pos.getAdjacentPosition(direction);
    if (pos.isExit()) {
      continue;
    }
    if (pos.getRangeTo(goal) > dist) {
      continue;
    }
    break;
  }
  this.say(direction);
  this.move(direction);
};

Creep.prototype.moveCreep = function(position, direction) {
  if (position.x <= 0 || position.x >= 49 || position.y <= 0 || position.y >= 49) {
    return false;
  }

  var pos = new RoomPosition(position.x, position.y, this.room.name);
  var creeps = pos.lookFor('creep');
  if (creeps.length > 0 && creeps[0].memory) {
    if (creeps[0].memory.role === 'carry') {
      creeps[0].move(direction);
      return;
    }
    if (this.memory.role === 'defendmelee') {
      creeps[0].move(direction);
      return;
    }
    if (creeps[0].memory.role === 'harvester') {
      creeps[0].move(direction);
      return;
    }
    if (this.memory.role === 'upgrader' &&
      creeps[0].memory.role === 'storagefiller') {
      creeps[0].move(direction);
      return;
    }
    if (this.memory.role === 'upgrader' &&
      creeps[0].memory.role === 'upgrader') {
      creeps[0].suicide();
      this.log('New killing');
      return;
    }
    if (this.memory.role === 'upgrader' &&
      creeps[0].memory.role === 'sourcer') {
      this.log('config_creep_move suicide sourcer');
      creeps[0].suicide();
      return;
    }
    if (this.memory.role === 'upgrader' &&
      creeps[0].memory.role === 'harvester') {
      this.log('config_creep_move suicide harvester');
      creeps[0].suicide();
      return;
    }
  }
};
