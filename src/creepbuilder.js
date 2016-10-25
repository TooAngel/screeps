'use strict';

function createCreep(room, role, target, source, heal, target_id, level, squad, routing) {
  var energy = room.energyAvailable;

  try {
    unit = require('creep_' + role);
  } catch (err) {
    room.log('Can not find role: ' + role + ' creep_' + role + ' ' + err);
    return true;
  }

  var energyNeeded = 50;

  if (unit.energyRequired) {
    energyNeeded = unit.energyRequired(room);
  }

  if (room.energyAvailable < energyNeeded) {
    return false;
  }

  var id = Math.floor((Math.random() * 1000) + 1);
  var name = role + '-' + id;

  if (role == 'sourcer' && !source) {
    if (!room.memory.sources_index) {
      room.memory.sources_index = 0;
    }
    var sources = room.find(FIND_SOURCES);
    source = sources[room.memory.sources_index % sources.length].pos;
    target_id = sources[room.memory.sources_index % sources.length].id;
    target = sources[room.memory.sources_index % sources.length].pos.roomName;
    routing = {
      targetRoom: room.name,
      targetId: sources[room.memory.sources_index % sources.length].id
    };
  }

  var unit = require('creep_' + role);
  if (unit.energyBuild) {
    energy = unit.energyBuild(room, energy, source, heal, level);
  }

  var partConfig = unit.get_part_config(room, energy, heal, target);
  partConfig = partConfig.slice(0, MAX_CREEP_SIZE);
  var spawns = room.find(FIND_MY_SPAWNS);

  for (var spawn_name in spawns) {
    var spawn = spawns[spawn_name];
    var memory = {
      role: role,
      number: id,
      step: 0,
      target: target,
      base: room.name,
      source: source,
      target_id: target_id,
      born: Game.time,
      heal: heal,
      level: level,
      squad: squad,
      // Values from the creep configuration
      killPrevious: unit.killPrevious,
      flee: unit.flee,
      buildRoad: unit.buildRoad,
      routing: routing
    };
    var returnCode = spawn.createCreep(partConfig, name, memory);

    if (returnCode != name) {
      continue;
    }

    //    room.log('Spawned ' + name);

    if (role == 'sourcer') {
      room.memory.sources_index = room.memory.sources_index + 1;
    }

    //if (memory.role == 'reserver') {
    //	room.log('Spawning ' + name.rpad(' ', 20) + ' ' + JSON.stringify(memory));
    //}
    return true;
  }
  return false;
}

module.exports = {

  checkForCreate: function(room, creepsConfig, target) {
    var storages;
    var energyNeeded;
    var unit;

    if (!room.memory.queue) {
      room.memory.queue = [];
    }

    if (room.memory.queue.length > 0 && (creepsConfig.length === 0 || creepsConfig[0] != 'harvester')) {
      var creep = room.memory.queue[0];
      energyNeeded = 50;

      if (createCreep(room, creep.role, creep.target, creep.source, creep.heal, creep.target_id, creep.level, creep.squad, creep.routing)) {
        room.memory.queue.shift();
      } else {
        if (creep.ttl === 0) {
          room.log('TTL reached, skipping: ' + JSON.stringify(creep));
          room.memory.queue.shift();
          return;
        }

        // TODO maybe skip only if there is a spawn which is not spawning
        creep.ttl = creep.ttl || config.creep.queueTtl;
        creep.ttl--;
      }
      // Spawing only one per tick
      return;
    }

    if (creepsConfig.length > 0) {
      return createCreep(room, creepsConfig[0], target);
    }

    return false;
  },

  createCreep: function(room, role, target) {
    createCreep(room, role, target);
  }
};
