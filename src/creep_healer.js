'use strict';

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [HEAL, MOVE];
  return room.get_part_config(energy, parts);
};


function heal(creep) {
  if (creep.hits < creep.hitsMax) {
    creep.heal(creep);
  }

  var targethostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  var range = creep.pos.getRangeTo(targethostile);
  var name = null;
  let target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax;
    }
  });
  var unhealthyCreepRange = creep.pos.getRangeTo(target);
  if (range <= 1) {
    var direction = creep.pos.getDirectionTo(targethostile);
    creep.move((direction + 4) % 8);
  } else {
    if (unhealthyCreepRange > 1) {
      creep.moveTo(target);
    }
  }

  if (unhealthyCreepRange <= 1) {
    creep.heal(target);
  } else if (unhealthyCreepRange <= 3) {
    creep.rangedHeal(target);
  }
  return true;
}

module.exports.execute = function(creep) {
  // creep.log('here')
  var methods = null;
  var flags = [Game.flags.H1, Game.flags.H2, Game.flags.H3, Game.flags.H4, Game.flags.H5, Game.flags.H6];
  flags = [Game.flags['E9N17-1'], Game.flags['E9N17-2'], Game.flags['E9N17-3'], Game.flags['E9N17-4'], Game.flags['E9N17-5'], Game.flags['E9N17-6']];
  // if (creep.memory.base == 'E6S2' && typeof(creep.memory.born) != 'undefined' && creep.memory.born > 1556957) {
  //     flags = [Game.flags.Flag12, Game.flags.Flag13, Game.flags.Flag14, Game.flags.Flag15, Game.flags.Flag11]; //, Game.flags.Flag4, Game.flags.Flag5, Game.flags.Flag6, Game.flags.Flag1];
  // }

  if (creep.memory.step >= 5) {
    creep.memory.step = 5;
  }

  if (creep.memory.step >= 2) {
    // if (Game.flags.at.roomName == creep.room.name) {
    if (heal(creep)) {
      return true;
    }
    // }
  }


  creep.moveTo(flags[creep.memory.step], {
    reusePath: 5
  });

  if (typeof(flags[creep.memory.step]) == 'undefined' || flags[creep.memory.step].roomName == creep.room.name) {
    creep.memory.step += 1;
  }

};
