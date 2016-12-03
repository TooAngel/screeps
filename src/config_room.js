'use strict';

Room.prototype.execute = function() {
  let returnCode = this.handle();
  for (var creep of this.find(FIND_MY_CREEPS)) {
    creep.handle();
  }
  delete this.transferableStructures;
  delete this.droppedResources;
  delete this.constructionSites;
  return returnCode;
};

Room.prototype.handle = function() {
  if (this.controller && this.controller.my) {
    return this.myHandleRoom();
  }
  this.externalHandleRoom();
  return false;
};
