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

  toggleFlags: function(name) {
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

    var setup = room.memory.setup;
    if (!setup) {
      return;
    }

    var sources = room.find(FIND_SOURCES);
    for (var source_id in sources) {
      var source = sources[source_id];
      room.createFlag(setup['sourcer-' + source.id].x, setup['sourcer-' + source.id].y, room.name + '-sourcer-' + source.id, COLOR_YELLOW);
      room.createFlag(setup['sourcer-' + source.id + '-link'].x + '-link', setup['sourcer-' + source.id + '-link'].y, room.name + '-sourcer-' + source.id + '-link', COLOR_YELLOW);
    }

    room.createFlag(setup.builder.x, setup.builder.y, room.name + '-builder', COLOR_CYAN);
    room.createFlag(setup.storage.x, setup.storage.y, room.name + '-storage', COLOR_CYAN);
    room.createFlag(setup.filler.x, setup.filler.y, room.name + '-filler', COLOR_YELLOW);
    room.createFlag(setup['filler-link'].x, setup['filler-link'].y, room.name + '-filler-link', COLOR_YELLOW);
    room.createFlag(setup.power.x, setup.power.y, room.name + '-power', COLOR_RED);
    room.createFlag(setup.powerSpawn.x, setup.powerSpawn.y, room.name + '-powerSpawn', COLOR_RED);

    for (var spawnId in setup.spawn) {
      room.createFlag(setup.spawn[spawnId].x, setup.spawn[spawnId].y, room.name + '-spawn-' + spawnId, COLOR_BLUE);
    }

    for (var linkId in setup.link) {
      room.createFlag(setup.link[linkId].x, setup.link[linkId].y, room.name + '-link-' + linkId, COLOR_GREEN);
    }

    for (var towerId in setup.tower) {
      room.createFlag(setup.tower[towerId].x, setup.tower[towerId].y, room.name + '-tower-' + towerId, COLOR_GREEN, COLOR_BLUE);
    }

    for (var observerId in setup.observer) {
      room.createFlag(setup.observer[observerId].x, setup.observer[observerId].y, room.name + '-observer-' + observerId, COLOR_BLUE, COLOR_RED);
    }

    for (var labId in setup.lab) {
      room.createFlag(setup.lab[labId].x, setup.lab[labId].y, room.name + '-lab-' + labId, COLOR_RED, COLOR_BLUE);
    }

    for (var containerId in setup.container) {
      room.createFlag(setup.container[containerId].x, setup.container[containerId].y, room.name + '-container-' + containerId, COLOR_GREEN, COLOR_RED);
    }

    for (var terminalId in setup.terminal) {
      room.createFlag(setup.terminal[terminalId].x, setup.terminal[terminalId].y, room.name + '-terminal-' + terminalId, COLOR_RED, COLOR_GREEN);
    }

    for (var towerFillerId in setup.towerFiller) {
      room.createFlag(setup.towerFiller[towerFillerId].x, setup.towerFiller[towerFillerId].y, room.name + '-towerFiller-' + towerFillerId, COLOR_YELLOW, COLOR_GREEN);
    }

    var path = Room.deserializePath(setup.path);
    for (var path_i in path) {
      room.createFlag(path[path_i].x, path[path_i].y, null, COLOR_ORANGE);
    }

    if (room.memory.walls && room.memory.walls.ramparts) {
      for (var rampart_i in room.memory.walls.ramparts) {
        var rampart = room.memory.walls.ramparts[rampart_i];
        var pos = new RoomPosition(rampart.x, rampart.y, rampart.roomName);
        room.createFlag(pos.x, pos.y, null, COLOR_BROWN);
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
    for (var room_i in Memory.my_rooms) {
      var room = Game.rooms[Memory.my_rooms[room_i]];
      for (var gp_i in room.memory.globalPath) {
        var gp = room.memory.globalPath[gp_i];
        if (!gp.fixed) {
          room.log(gp_i);
        }
      }
    }
  }
};
