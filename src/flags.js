'use strict';

module.exports = {

  clearFlags: function(name) {
    var room = Game.rooms[name];
    var flags = room.find(FIND_FLAGS);
    for (var i in flags) {
      if (flags[i].name != room.name + '-filler' && flags[i].color != COLOR_WHITE) {
        flags[i].remove();
      }
    }
  },

  toggleGlobalFlags: function(name, globalPath_name) {
    var room = Game.rooms[name];
    var flags = room.find(FIND_FLAGS, {
      filter: function(object) {
        return object.color != COLOR_WHITE;
      }
    });
    for (var i in flags) {
      flags[i].remove();
    }
    if (Object.keys(flags).length > 0) {
      return;
    }

    let path = Room.deserializePath(room.memory.globalPath[globalPath_name].path);
    for (var path_i in path) {
      room.createFlag(path[path_i].x, path[path_i].y, null, COLOR_GREY);
    }

  },

  togglePathFlags: function(name) {
    var room = Game.rooms[name];
    var flags = room.find(FIND_FLAGS, {
      filter: function(object) {
        return object.color != COLOR_WHITE;
      }
    });
    for (var i in flags) {
      flags[i].remove();
    }
    if (Object.keys(flags).length > 0) {
      return;
    }

    let path = Room.deserializePath(room.memory.setup.path);
    for (var path_i in path) {
      room.createFlag(path[path_i].x, path[path_i].y, null, COLOR_GREY);
    }

  },

  findOldPath: function() {
    for (var room_i in Memory.myRooms) {
      var room = Game.rooms[Memory.myRooms[room_i]];
      for (var gp_i in room.memory.globalPath) {
        var gp = room.memory.globalPath[gp_i];
        if (!gp.fixed) {
          room.log(gp_i);
        }
      }
    }
  }
};
