'use strict';

let helper = require('helper');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return Math.max(200, room.energyAvailable);
};

module.exports.energyBuild = function(room) {
  return Math.max(200, room.energyAvailable);
};

function recycleCreep(creep) {
  creep.say('recycle');
  if (creep.room.controller && creep.room.controller.my) {
    if (creep.memory.countdown > 0) {
      creep.memory.countdown -= 1;
      creep.say('rnd');
      creep.moveRandom();
      return false;
    }
  }
  if (creep.room.name != creep.memory.base) {
    if (creep.stayInRoom()) {
      return true;
    }
  }
  return Creep.recycleCreep(creep);
}

// TODO This overwrites the target so redo and enable again
//module.exports.action = function(creep) {
//  creep.memory.countdown = creep.memory.countdown || 100;
//
//  let hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
//  if (hostiles.length === 0) {
//    if (recycleCreep(creep)) {
//      return true;
//    }
//    creep.waitRampart();
//    return true;
//  }
//
//  hostiles = _.sortBy(hostiles, function(object) {
//    return creep.pos.getRangeTo(object.pos);
//  });
//  let target = hostiles[0];
//  creep.memory.countdown = 100;
//  creep.memory.target = target.pos;
//
//  if (creep.fightRampart(target)) {
//    creep.say('fightRampart');
//    return true;
//  }
//
//  creep.say('fightRanged');
//  return creep.fightRanged(target);
//};

module.exports.execute = function(creep) {
  creep.memory.countdown = creep.memory.countdown || 100;

  let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
    filter: helper.find_attack_creep
  });
  if (hostiles.length === 0) {
    if (recycleCreep(creep)) {
      return true;
    }
    creep.waitRampart();
    return true;
  }

  hostiles = _.sortBy(hostiles, function(object) {
    return creep.pos.getRangeTo(object.pos);
  });
  let target = hostiles[0];
  creep.memory.countdown = 100;
  creep.memory.target = target.pos;

  if (creep.fightRampart(target)) {
    creep.say('fightRampart');
    return true;
  }

  creep.say('fightRanged');
  return creep.fightRanged(target);
};
