'use strict';

var min_energy = 3000;

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, CARRY];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable, min_energy);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(energy, min_energy);
};

module.exports.execute = function(creep) {
  var flags = [Game.flags['E-1'], Game.flags['E-2'], Game.flags['E-3']];

  let flag = flags[flags.length - 1];

  if (creep.room.name == creep.memory.base && creep.carry.energy < creep.carryCapacity) {
    creep.moveTo(creep.room.storage, {
      ignoreCreeps: true,
      costCallback: creep.room.getAvoids(creep.room)
    });
    creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
    return true;
  }

  if (flag.pos.roomName == creep.room.name) {
    let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.structureType == STRUCTURE_SPAWN && object.energy < object.energyCapacity) {
          return true;
        }
        if (object.structureType == STRUCTURE_EXTENSION && object.energy < object.energyCapacity) {
          return true;
        }
        return false;
      }
    });
    if (target !== null) {
      creep.say('struct');
      creep.moveTo(target);
      let returnCode = creep.transfer(target, RESOURCE_ENERGY);
      return true;
    }

    target = creep.pos.findClosestByRange(FIND_CREEPS, {
      filter: function(object) {
        if (_.sum(object.carry) == object.carryCapacity) {
          return false;
        }
        if (object.memory && object.memory.role == 'energytransporter') {
          return false;
        }

        return true;
      }
    });
    creep.say('creep');
    creep.moveTo(target);
    creep.transfer(target, RESOURCE_ENERGY);
    return true;
  }

  if (creep.memory.step >= flags.length) {
    creep.memory.step = flags.length - 1;
  }

  if (flags[creep.memory.step].pos.roomName == creep.room.name) {
    if (!creep.carry.energy) {

      creep.memory.step -= 1;
    } else {
      creep.memory.step += 1;
    }
  }
  creep.moveTo(flags[creep.memory.step], {
    reusePath: 50,
    ignoreCreeps: true,
    costCallback: creep.room.getAvoids(creep.room)
  });
};
