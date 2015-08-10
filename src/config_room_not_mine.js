'use strict';

var creepbuilder = require('creepbuilder');
var helper = require('helper');
var basebuilder = require('basebuilder');
var config = require('config');

Room.prototype.split_room_name = function() {
  var patt = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
  var result = patt.exec(this.name);
  return result;
};

Room.prototype.executeHighwayRoom = function() {
  if (config.power.disabled) {
    return false;
  }

  var structures = this.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_POWER_BANK;
    }
  });
  if (structures.length === 0) {
    if (Memory.power_banks) {
      delete Memory.power_banks[this.name];
    }
    return false;
  }

  if (Memory.power_banks && Memory.power_banks[this.name]) {
    if (Memory.power_banks[this.name].target && Memory.power_banks[this.name] !== null) {
      if (Memory.power_banks[this.name].transporter_called) {
        return;
      }
      if (structures[0].hits < 300000) {
        for (var i = 0; i < Math.ceil(structures[0].power / 1000); i++) {
          this.log('Adding powertransporter at ' + Memory.power_banks[this.name].target);
          Game.rooms[Memory.power_banks[this.name].target].memory.queue.push({
            role: 'powertransporter',
            target: this.name
          });
        }

        Memory.power_banks[this.name].transporter_called = true;
      }
    }
    return;
  }

  // Fix for W8S9
  var walls = this.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'constructedWall';
    }
  });

  if (structures[0].ticksToDecay < 3000) {
    Memory.power_banks[this.name] = {
      target: null
    };
    return true;
  } else {
    var min_route = 6;
    var target = null;
    var route;
    for (var room_id in Memory.my_rooms) {
      var room = Game.rooms[Memory.my_rooms[room_id]];
      if (!room || !room.storage || room.storage.store.energy < config.power.energyForCreeps) {
        continue;
      }
      var route_to_test = Game.map.findRoute(this.name, room.name);
      if (route_to_test.length < min_route) {
        min_route = route_to_test.length;
        target = room;
        route = route_to_test;
      }
    }

    if (!Memory.power_banks) {
      Memory.power_banks = {};
    }
    if (target !== null) {
      if (walls.length > 0) {
        var exits = this.find(route[0].exit);
        var exit = exits[exits.length - 1];
        var path = this.findPath(exit, structures[0].pos);
        var last_pos = path[path.length - 1];
        if (!structures[0].pos.isEqualTo(last_pos.x, last_pos.y)) {
          this.log('No route due to wall');
          Memory.power_banks[this.name] = {
            target: null
          };
          return true;
        }
      }

      Memory.power_banks[this.name] = {
        target: target.name,
        min_route: min_route
      };
      this.log('--------------> Start power harvesting in: ' + target.name + ' <----------------');
      Game.rooms[target.name].memory.queue.push({
        role: 'powerattacker',
        target: this.name
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerhealer',
        target: this.name
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerhealer',
        target: this.name
      });
    } else {
      Memory.power_banks[this.name] = {
        target: null
      };
    }
  }
};
