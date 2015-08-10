'use strict';

let helper = require('helper');
let wallsetter = require('wallsetter');
let config = require('config');

module.exports = {
  buildBlockers: function(room) {

    // TODO Add check for costmatrix, layout is initialized
    //    if (!room.memory.layout) {
    //      return false;
    //    }

    var spawns = room.find(FIND_MY_STRUCTURES, {
      filter: function(object) {
        return object.structureType == 'spawn';
      }
    });
    if (spawns.length === 0) {
      return false;
    }

    var data = wallsetter.closeExitsByPath(room.name);
    wallsetter.checkRamparts(room.name);
    return true;
  }
};
