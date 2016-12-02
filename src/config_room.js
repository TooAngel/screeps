'use strict';

Room.prototype.execute = function() {
  let returnCode = this.handle();
  for (var creep of this.find(FIND_MY_CREEPS)) {
    creep.handle();
  }
  return returnCode;
};

Room.prototype.handle = function() {
  if (this.controller && this.controller.my) {
    return this.myHandleRoom();
  }
  return this.externalHandleRoom();
};
