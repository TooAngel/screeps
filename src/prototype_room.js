'use strict';

Room.prototype.exectueEveryTicks = function(ticks) {
  return (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks === 0;
};

Room.prototype.handle = function() {
  if (this.controller && this.controller.my) {
    return this.myHandleRoom();
  }
  return this.externalHandleRoom();
};

Room.prototype.execute = function() {
  this.memory.lastSeen = Game.time;
  try {
    const returnCode = this.handle();
    for (const creep of this.find(FIND_MY_CREEPS)) {
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
