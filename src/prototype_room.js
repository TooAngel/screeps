'use strict';

Room.prototype.handle = function() {
  if (this.controller && this.controller.my) {
    return this.myHandleRoom();
  }
  return this.externalHandleRoom();
};

Room.prototype.execute = function() {

  // if (cache && cache.rooms && cache.rooms.W1N4) {
  //   console.log('ROOM W1N4":' + cache.rooms.W1N4.costMatrix);
  // }
  this.memory.lastSeen = Game.time;
  try {
    let returnCode = this.handle();
    for (var creep of this.find(FIND_MY_CREEPS)) {
      creep.handle();
    }
    delete this.transferableStructures;
    delete this.droppedResources;
    delete this.constructionSites;
    return returnCode;
  } catch (err) {
    this.log('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack);
    Game.notify('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack, 30);
    return false;
  }
};
