'use strict';

var helper = require('helper');

var min_energy = 3000;

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, MOVE, WORK];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable, min_energy);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(energy, min_energy);
};

function build(creep) {
  let methods = null;
  methods = [
    Creep.getEnergy,
    Creep.constructTask,
    Creep.transferEnergy,
    Creep.upgradeControllerTask,
    Creep.repairStructure
  ];

  return Creep.execute(creep, methods);
}

module.exports.execute = function(creep) {

  var flags = [Game.flags[creep.memory.base + '-1'], Game.flags[creep.memory.base + '-2'], Game.flags[creep.memory.base + '-3'], Game.flags[creep.memory.base + '-4'], Game.flags[creep.memory.base + '-5']];

  let flag = flags[flags.length - 1];


  if (creep.carry.energy === 0 && creep.memory.step == flags.length - 1 && creep.room.controller && !creep.room.controller.my) {
    if (creep.room.name != flags[flags.length - 2].pos.roomName) {
      creep.moveTo(flags[flags.length - 2]);
      return true;
    }
  }


  if (creep.carry.energy < creep.carryCapacity && creep.room.name != flag.pos.roomName) {
    let sources = creep.room.find(FIND_SOURCES_ACTIVE);
    if (sources.length > 0) {
      creep.moveTo(sources[0]);
      creep.harvest(sources[0]);
      return true;
    }
  }

  if (flag === null) {
    return build(creep);
  }

  if (flag.pos.roomName == creep.room.name) {
    return build(creep);
  }

  if (flags[creep.memory.step].pos.roomName == creep.room.name) {
    creep.memory.step += 1;
    delete creep.memory.route;
    delete creep.memory.nextExit;
  }

  if (typeof(creep.memory.route) == 'undefined') {
    creep.memory.route = Game.map.findRoute(creep.room, flags[creep.memory.step].pos.roomName);
  }

  if (creep.memory.route.length === 0) {
    creep.memory.step = 3;
    delete creep.memory.route;
    return;
  }
  if (creep.room.name == creep.memory.route[0].room) {
    creep.memory.route.splice(0, 1);
  }
  if (typeof(creep.memory.nextExit) == 'undefined') {
    creep.memory.nextExit = creep.pos.findClosestByPath(creep.memory.route[0].exit, {
      ignoreCreeps: true
    });
  }




  creep.moveTo(creep.memory.nextExit.x, creep.memory.nextExit.y, {
    reusePath: 50,
    ignoreCreeps: true,
    costCallback: helper.getAvoids(creep.room)
  });
  var range = creep.pos.getRangeTo(creep.memory.nextExit.x, creep.memory.nextExit.y);
  if (range <= 1) {
    delete creep.memory.nextExit;
  }
};
