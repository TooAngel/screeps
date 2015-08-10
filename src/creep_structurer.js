'use strict';

var actions = require('actions');
var helper = require('helper');

module.exports.boostActions = ['dismantle'];

module.exports.energyRequired = function(room) {
  return 1500;
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(energy, 3750);
};

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, WORK];
  return room.get_part_config(energy, parts);
};

module.exports.preMove = function(creep, directions) {

  if (creep.room.name == creep.memory.routing.targetRoom) {
    creep.log('preMove: ' + creep.memory.routing.targetId);
    let target = Game.getObjectById(creep.memory.routing.targetId);
    creep.log(target);
    if (target === null) {
      creep.log('Invalid target');
      delete creep.memory.routing.targetId;
    }
  }

  // Routing would end within the wall - this is the fix for that
  if (creep.memory.routing.targetId && creep.room.name == creep.memory.routing.targetRoom) {
    let target = Game.getObjectById(creep.memory.routing.targetId);
    if (target === null) {
      delete creep.memory.routing.targetId;
      return true;
    }
    if (creep.pos.getRangeTo(target.pos) <= 1) {
      creep.memory.routing.reached = true;
    }
  }

};

function clean_controller(creep) {
  let search = PathFinder.search(
    creep.pos, {
      pos: creep.room.controller.pos,
      range: 1
    }, {
      maxRooms: 1
    }
  );
  let findStructuresToDismantle = function(object) {
    if (object.ticksToDecay === null) {
      return false;
    }
    if (object.structureType == STRUCTURE_CONTROLLER) {
      return false;
    }
    if (object.structureType == STRUCTURE_ROAD) {
      return false;
    }
    return true;
  };
  for (let pos of search.path) {
    let posObject = new RoomPosition(pos.x, pos.y, creep.room.name);
    var structures = posObject.findInRange(FIND_STRUCTURES, 1, {
      filter: findStructuresToDismantle
    });

    if (structures.length > 0) {
      creep.memory.target_id = structures[0].id;
      creep.log('found on way to controller to dismantle: ' + structures[0].pos);
      return true;
    }
  }
  return false;

}

module.exports.getTargetId = function(creep) {
  handle(creep);
  if (!creep.memory.routing.targetId) {
    // No more to remove, move back and recycle (move back for now)
    creep.log('Move back / suicide');
    creep.memory.routing.reverse = true;
    // Doesn't work, so suicide
    creep.suicide();
  }
  return creep.memory.routing.targetId;
};

function clean_exits(creep) {
  var pos_last;
  let findStructuresToDismantle = function(object) {
    if (object.ticksToDecay === null) {
      return false;
    }
    if (object.structureType == STRUCTURE_CONTROLLER) {
      return false;
    }
    if (object.structureType == STRUCTURE_ROAD) {
      return false;
    }
    return true;
  };
  var exit_dirs = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];
  for (var exit_dirs_i in exit_dirs) {
    var exits = creep.room.find(exit_dirs[exit_dirs_i]);
    if (exits.length === 0) {
      continue;
    }
    var exit = exits[Math.floor(exits.length / 2)];
    var path = creep.pos.findPathTo(exit);
    pos_last = path[path.length - 1];
    if (path.length === 0) {
      continue;
    }
    if (!exit.isEqualTo(pos_last.x, pos_last.y)) {
      var pos = new RoomPosition(pos_last.x, pos_last.y, creep.room.name);
      var structure = pos.findClosestByRange(FIND_STRUCTURES, {
        filter: findStructuresToDismantle
      });

      if (structure !== null) {
        creep.memory.routing.targetId = structure.id;
        creep.log('new memory: ' + structure.id);
        return true;
      }
    }
  }
  return false;
}

function setTargetId(creep) {
  if (creep.room.controller && !creep.room.controller.my) {
    creep.log('no targetId');
    if (clean_controller(creep)) {
      return true;
    }
    if (clean_exits(creep)) {
      creep.log('clean exits');
      return true;
    }
    let structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.ticksToDecay === null) {
          return false;
        }
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
    if (structure !== null) {
      var structures = structure.pos.lookFor('structure');

      if (structures.length > 0) {
        for (var structures_i = 0; structures_i < structures.length; structures_i++) {
          if (structures[structures_i].structureType == 'rampart') {
            structure = structures[structures_i];
            break;
          }
        }
      }

      creep.log('structure: ' + structure.id);
      creep.memory.routing.targetId = structure.id;
      return true;
    }
  }
  creep.say('hia');
  creep.memory.targetReached = true;
  return actions.recycleCreep(creep);
}

function handle(creep) {
  var structure;

  if (!creep.memory.routing.targetId) {
    return setTargetId(creep);
  }

  structure = Game.getObjectById(creep.memory.routing.targetId);
  //  creep.log(JSON.stringify(structure));
  if (structure === null) {
    delete creep.memory.routing.targetId;
    return;
  }

  let search = PathFinder.search(
    creep.pos, {
      pos: structure.pos,
      range: 1
    }, {
      maxRooms: 1
    }
  );

  let pos = search.path[0];
  let returnCode = creep.move(creep.pos.getDirectionTo(pos));

  if (returnCode == ERR_NO_PATH) {
    creep.moveRandom();
    //    delete creep.memory.routing.targetId;
    return true;
  }
  if (returnCode != OK && returnCode != ERR_TIRED) {
    //creep.log('move returnCode: ' + returnCode);
  }
  //  creep.moveByPathMy();

  var return_code = creep.dismantle(structure);
  if (return_code == OK) {
    creep.setNextSpawn();
    creep.spawnCarry();
  }
}

module.exports.action = function(creep) {
  if (!creep.room.controller || !creep.room.controller.my) {
    var structure;
    structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.ticksToDecay === null) {
          return false;
        }
        if (object.structureType == 'controller') {
          return false;
        }
        if (object.structureType == 'road') {
          return false;
        }
        return true;
      }
    });
    creep.dismantle(structure);
  }

  if (!creep.memory.target) {
    creep.log('Suiciding no target');
    creep.suicide();
  }
  creep.spawnReplacement();
  handle(creep);
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
  if (!creep.memory.routing.targetId) {
    return setTargetId(creep);
  }
};
