'use strict';

module.exports.killPrevious = true;
// TODO should be true, but flee must be fixed before 2016-10-13
module.exports.flee = false;

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CLAIM];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return BODYPART_COST[CLAIM] + BODYPART_COST[MOVE];
};

module.exports.energyBuild = function(room, energy, source, heal, level) {
  if (!level) {
    level = 1;
  }

  //  console.log(room.name, 'reserver level: ' + level, level == 5, (BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]) * level, energy, '=', Math.max((BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]) * level, energy));
  if (level == 5) {
    let value = Math.max((BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]) * level, energy);
    let energyLevel = level * (BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]);
    let multiplier = Math.floor(value / energyLevel);
    //    room.log('Build super reserver');
    return multiplier * energyLevel;
  }
  return (BODYPART_COST[CLAIM] + BODYPART_COST[MOVE]) * level;
};

module.exports.action = function(creep) {
  work(creep);
  return true;
};

function check_sourcer_match(sourcers, source_id) {
  for (var sourcer_i in sourcers) {
    var sourcer = sourcers[sourcer_i];
    if (sourcer.memory.target_id == source_id) {
      return true;
    }
  }
  return false;
}

function check_sourcer(creep) {
  var sources = creep.room.find(FIND_SOURCES);
  var sourcer = creep.room.find(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.memory.role == 'sourcer';
    }
  });

  if (sourcer.length < sources.length) {
    for (var sources_id in sources) {
      var path_to_source = creep.pos.findPathTo(sources[sources_id].pos, {
        ignoreCreeps: true
      });
      let last_pos = path_to_source[path_to_source.length - 1];
      if (!sources[sources_id].pos.isEqualTo(last_pos.x, last_pos.y)) {
        // TODO Currently disable cause path finding is somehow broken
        creep.log('DISABLED = Queuing cleaner from reserver <------ ' + creep.memory.base);
        //Game.rooms[creep.memory.base].memory.queue.push({
        //  role: 'cleaner',
        //  target: creep.room.name
        //});
        //        continue;
      }

      if (check_sourcer_match(sourcer, sources[sources_id].pos)) {
        creep.log('Matching sourcer found');
        continue;
      }

      var sourcer_spawn = {
        role: 'sourcer',
        source: sources[sources_id].pos,
        target: sources[sources_id].pos.roomName,
        target_id: sources[sources_id].id
      };

      Game.rooms[creep.memory.base].memory.queue.push(sourcer_spawn);
    }
  }

}

function call_cleaner(creep) {
  if (creep.memory.base == creep.room.name) {
    return false;
  }

  if (!Game.rooms[creep.memory.base].storage) {
    return false;
  }

  if ((Game.time + creep.pos.x + creep.pos.y) % 1000 !== 0) {
    return false;
  }

  if (config.creep.structurer) {

    var structurers = creep.room.find(FIND_MY_CREEPS, {
      filter: function(object) {
        return object.memory.role == 'structurer';
      }
    });
    if (structurers.length > 0) {
      return false;
    }

    var resource_structures = creep.room.find(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.structureType == STRUCTURE_CONTROLLER) {
          return false;
        }
        if (object.structureType == STRUCTURE_ROAD) {
          return false;
        }
        if (object.structureType == STRUCTURE_CONTAINER) {
          return false;
        }
        return true;
      }
    });

    if (resource_structures.length > 0 && !creep.room.controller.my) {
      creep.log('Call structurer from ' + creep.memory.base + ' because of ' + resource_structures[0].structureType);
      Game.rooms[creep.memory.base].memory.queue.push({
        role: 'structurer',
        target: creep.room.name
      });
      return true;
    }
  }
}


function work(creep) {
  if (!creep.memory.target_id) {
    creep.memory.target_id = creep.room.controller.id;
  }

  if (creep.room.name != creep.memory.routing.targetRoom) {
    creep.memory.routing.reached = false;
    return false;
  }

  creep.memory.level = 2;
  if (creep.room.controller.reservation && creep.room.controller.reservation.ticksToEnd > 4500) {
    creep.memory.level = 1;
  }
  if (!creep.room.controller.my && (!creep.room.controller.reservation || creep.room.controller.reservation.username != Memory.username)) {
    creep.memory.level = 5;
  }
  let repairers = creep.room.find(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.memory.role == 'repairer') {
        return true;
      }
      return false;
    }
  });
  if (repairers.length < 2) {
    creep.spawnReplacement();
  }
  call_cleaner(creep);

  if (Game.time % 100 === 0 && creep.room.controller.reservation && creep.room.controller.reservation.username == Memory.username) {
    check_sourcer(creep);
  }

  if (config.creep.reserverDefender) {
    var hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
      filter: creep.room.findAttackCreeps
    });
    if (hostiles.length > 0) {
      //creep.log('Reserver under attack');
      if (!creep.memory.defender_called) {
        Game.rooms[creep.memory.base].memory.queue.push({
          role: 'defender',
          target: creep.room.name
        });
        creep.memory.defender_called = true;
      }
    }
  }

  var method = creep.reserveController;
  var return_code;
  if (creep.room.controller.owner && creep.room.controller.owner != Memory.username) {
    creep.say('attack');
    return_code = creep.attackController(creep.room.controller);
  } else {
    return_code = creep.reserveController(creep.room.controller);
  }

  if (return_code == OK || return_code == ERR_NO_BODYPART) {
    if (creep.room.controller.reservation) {
      creep.room.memory.reservation = {
        base: creep.memory.base,
        tick: Game.time,
        ticksToLive: creep.ticksToLive,
        reservation: creep.room.controller.reservation.ticksToEnd
      };

    }
    creep.memory.targetReached = true;
    creep.setNextSpawn();
    return true;
  }
  if (return_code == ERR_NOT_IN_RANGE) {
    return true;
  }
  if (return_code == ERR_INVALID_TARGET) {
    return true;
  }

  creep.log('reserver: ' + return_code);

  return true;
}

module.exports.action = function(creep) {
  if (!creep.memory.routing.targetId) {
    // TODO check when this happens and fix it
    creep.log('creep_reserver.action No targetId !!!!!!!!!!!' + JSON.stringify(creep.memory));
    if (creep.room.name == creep.memory.routing.targetRoom) {
      creep.memory.routing.targetId = creep.room.controller.id;
    }
  }


  // TODO this should be enabled, because the reserver should flee without being attacked
  creep.notifyWhenAttacked(false);
  if (!creep.memory.target) {
    if (creep.memory.routing.targetRoom) {
      creep.memory.target = creep.memory.routing.targetRoom;
    } else {
      creep.log('No target suiciding: ' + JSON.stringify(creep.memory));
      creep.memory.killed = true;
      creep.suicide();
      return true;
    }
  }

  work(creep);
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
