'use strict';

/*
 * defendranged is called after 'threshold' when a room is attacked
 *
 * Tries to fight against the hostile creeps from ramparts if possible
 */

roles.defendranged = {};

roles.defendranged.settings = {
  layoutString: 'RM',
  amount: [1, 1],
  maxLayoutAmount: 20,
  fillTough: true,
};

// TODO This overwrites the target so redo and enable again
// module.exports.action = function(creep) {
//  creep.memory.countdown = creep.memory.countdown || 100;
//
//  let hostiles = creep.room.findEnemys();
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
// };
const action = function(creep) {
  creep.memory.countdown = creep.memory.countdown || 100;

  const recycleCreep = function(creep) {
    creep.say('recycle');
    if (creep.room.controller && creep.room.controller.my) {
      if (creep.memory.countdown > 0) {
        creep.memory.countdown -= 1;
        creep.say('rnd');
        creep.moveRandom();
        return false;
      }
    }
    return Creep.recycleCreep(creep);
  };

  let hostiles = creep.room.findEnemys();
  if (hostiles.length === 0) {
    if (recycleCreep(creep)) {
      return true;
    }
    creep.waitRampart();
    return true;
  }

  hostiles = _.sortBy(hostiles, (object) => {
    return creep.pos.getRangeTo(object.pos);
  });
  const target = hostiles[0];
  creep.memory.countdown = 100;
  creep.memory.target = target.pos;

  if (creep.fightRampart(target)) {
    creep.say('fightRampart');
    return true;
  }

  creep.say('fightRanged');
  return creep.fightRanged(target);
};

roles.defendranged.action = action;
