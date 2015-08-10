'use strict';

var helper = require('helper');
var config = require('config');

module.exports.boostActions = ['harvest', 'capacity'];

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, MOVE, WORK];
  return room.get_part_config(energy, parts);
};

module.exports.energyBuild = function(room, energy, source, heal) {
  var max = 2000;
  energy = Math.max(250, Math.min(max, room.energyCapacityAvailable));
  return energy;
};

let execute = function(creep) {
  if (!creep.room.terminal) {
    creep.suicide();
    return true;
  }
  let carrying = _.sum(creep.carry);
  if (carrying == creep.carryCapacity) {
    let search = PathFinder.search(
      creep.pos, {
        pos: creep.room.terminal.pos,
        range: 1
      }, {
        roomCallback: helper.getAvoids(creep.room, {}, true),
      }
    );
    let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
    for (let key in creep.carry) {
      if (creep.carry[key] === 0) {
        continue;
      }
      let returnCode = creep.transfer(creep.room.terminal, key);
      return true;
    }
  }

  let minerals = creep.room.find(FIND_MINERALS);
  if (minerals.length > 0) {
    let posMem = creep.room.memory.position.creep[minerals[0].id];
    let pos = new RoomPosition(posMem.x, posMem.y, posMem.roomName);
    let search = PathFinder.search(
      creep.pos, {
        pos: pos,
        range: 0
      }, {
        roomCallback: helper.getAvoids(creep.room, {}, true),
      }
    );
    let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
    creep.harvest(minerals[0]);
  }
  return true;
};

module.exports.action = function(creep) {
  return execute(creep);
};

module.exports.execute = function(creep) {
  return execute(creep);
};
