'use strict';

Room.prototype.exectueEveryTicks = function(ticks) {
  return (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks === 0;
};

Room.prototype.handle = function() {
  if (this.controller && this.controller.my) {
    this.myHandleRoom();
    return true;
  }
  this.externalHandleRoom();
  return false;
};

Room.prototype.execute = function() {
  this.memory.lastSeen = Game.time;
  try {
    let returnCode = this.handle();
    for (var creep of this.find(FIND_MY_CREEPS)) {
      creep.handle();
    }
    delete this.transferableStructures;
    return returnCode;
  } catch (err) {
    this.log('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack);
    Game.notify('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack, 30);
    return false;
  }
};
