'use strict';

let wallsetter = require('wallsetter');

Room.prototype.buildBlockers = function() {

  // TODO Add check for costmatrix, layout is initialized
  //    if (!room.memory.layout) {
  //      return false;
  //    }

  var spawns = this.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'spawn';
    }
  });
  if (spawns.length === 0) {
    return false;
  }

  var data = wallsetter.closeExitsByPath(this.name);
  wallsetter.checkRamparts(this.name);
  return true;
};
