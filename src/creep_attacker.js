'use strict';

var helper = require('helper');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 50, 3250);
};

function attack_flag(creep, flag) {
  var structures = flag.pos.lookFor('structure');
  var target;
  var validPath;

  if (structures.length === 0) {
    return false;
  }

  for (let i = 0; i < structures.length; i++) {
    if (structures[i].structureType == 'rampart') {
      target = structures[i];
      break;
    }
    target = structures[i];
  }
  let range = creep.pos.getRangeTo(flag);
  if (range == 1) {
    creep.attack(target);
    creep.rangedMassAttack();
    return true;
  }

  var path = creep.pos.findPathTo(target);

  // Seems like a bug in findPathTo
  validPath = false;
  if (path && path.length > 0) {
    var lastPathPos = path[path.length - 1];
    validPath = lastPathPos.x == target.pos.x && lastPathPos.y == target.pos.y;
  }

  if (!validPath || path.length === 0) {
    path = creep.pos.findPathTo(target, {
      ignoreDestructibleStructures: true
    });
  }

  var return_code = creep.moveByPath(path);
  creep.attack(target);
  if (return_code == ERR_NO_PATH) {
    creep.log(creep.log('No path'));
    var alternate = creep.pos.findClosestByPath(FIND_STRUCTURES);
    creep.log(JSON.stringify(alternate));
    creep.moveTo(alternate);
    creep.attack(alternate);
  }
  return true;
}

function ranged_attack(creep, target) {
  var range = creep.pos.getRangeTo(target);
  if (range == 1) {
    let direction = creep.pos.getDirectionTo(target);
    creep.attack(target);
    creep.rangedMassAttack();
    creep.move((direction + 4) % 8);
    return true;
  }
  if (range <= 3) {
    let direction = creep.pos.getDirectionTo(target);
    creep.rangedMassAttack();
    creep.heal(creep);
    //        creep.rangedAttack(target);
    creep.move((direction + 4) % 8);
    return false;
  }
  if (range == 3) {
    creep.rangedAttack(target);
    return true;
  }
  if (range <= 4) {
    return false;
  }
  creep.moveTo(target);
  return true;
}

function attack_attack_creep(creep) {
  var direction;
  var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: helper.find_attack_creep
  });
  if (target === null) {
    return false;
  }

  let range = creep.pos.getRangeTo(target);

  if (range > 3) {
    return false;
  }

  if (range > 1) {
    if (range <= 3) {
      creep.rangedAttack(target);
      creep.moveTo(target);
      return true;
    }
    var return_code = creep.moveTo(target);
    if (return_code == -2) {
      target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: function(object) {
          return object.structureType == STRUCTURE_RAMPART && object.structureType == STRUCTURE_WALL;
        }
      });
      direction = creep.pos.getDirectionTo(target);
      creep.move((direction + 4) % 8);
    } else {
      creep.rangedAttack(target);
    }
  } else {
    var structures = target.pos.lookFor('structure');

    if (structures.length > 0) {
      for (var i = 0; i < structures.length; i++) {
        if (structures[i].structureType == 'rampart') {
          direction = creep.pos.getDirectionTo(target);
          creep.move((direction + 4) % 8);
          break;
        }
      }
    }
    creep.attack(target);
    creep.rangedMassAttack();
  }
  return true;
}

function kill_spawn(creep) {
  var spawn = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'spawn';
    }
  });

  if (spawn !== null) {
    var path = creep.pos.findPathTo(spawn.pos);
    if (path.length === 0) {
      return false;
    }
    var last_pos = path[path.length - 1];
    if (spawn.pos.isEqualTo(last_pos.x, last_pos.y)) {
      creep.moveTo(spawn);
      creep.attack(spawn);
      return true;
    }
    return false;
  }
  return false;
}

function attack(creep) {
  var range;
  var structures;
  var i;

  if (kill_spawn(creep)) {
    return true;
  }

  var flag = Game.flags[creep.memory.base + '-at'];

  if (typeof(flag) != 'undefined' && creep.room.name == flag.roomName) {
    if (attack_flag(creep, flag)) {
      return true;
    }
  }

  var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return true;
    }
  });

  var return_code;

  if (target !== null) {
    range = creep.pos.getRangeTo(target);
    if (range < 10) {
      if (range > 1) {
        if (range <= 3) {
          creep.rangedAttack(target);
        }
        return_code = creep.moveTo(target);
        if (return_code == -2) {
          target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: function(object) {
              return object.structureType == STRUCTURE_RAMPART;
            }
          });
          creep.attack(target);
          creep.rangedMassAttack();
        } else {
          creep.rangedAttack(target);
        }
      } else {
        structures = target.pos.lookFor('structure');

        if (structures.length > 0) {
          for (i = 0; i < structures.length; i++) {
            if (structures[i].structureType == 'rampart') {
              target = structures[i];
              break;
            }
          }
        }
        creep.attack(target);
        creep.rangedAttack(target);
      }
      return true;
    }
  }

  target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_CONTROLLER) {
        return false;
      }
      if (object.structureType == 'rampart') {
        return false;
      }
      return true;
    }
  });

  if (target !== null) {
    structures = target.pos.lookFor('structure');

    if (structures.length > 0) {
      for (i = 0; i < structures.length; i++) {
        if (structures[i].structureType == 'rampart') {
          target = structures[i];
          break;
        }
      }
    }

    range = creep.pos.getRangeTo(target);
    if (range == 1) {
      creep.attack(target);
      return true;
    }

    var path = creep.pos.findPathTo(target);
    // Seems like a bug in findPathTo
    let validPath = false;
    if (path && path.length > 0) {
      var lastPathPos = path[path.length - 1];
      validPath = lastPathPos.x == target.pos.x && lastPathPos.y == target.pos.y;
    }

    if (!validPath || path.length === 0) {
      path = creep.pos.findPathTo(target, {
        ignoreDestructibleStructures: true
      });
    }

    return_code = creep.moveByPath(path);
    if (return_code == ERR_NO_PATH) {
      creep.log(creep.log('No path'));
      var alternate = creep.pos.findClosestByPath(FIND_STRUCTURES);
      creep.log(JSON.stringify(alternate));
      creep.moveTo(alternate);
      creep.attack(alternate);
    }

    return true;
  }


  if (creep.room.controller && creep.room.controller.my) {
    return false;
  }
  target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_WALL) {
        return true;
      }
      if (object.structureType == 'rampart') {
        return true;
      }
      return false;
    }
  });

  if (target === null) {
    var cs = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    if (cs === null) {
      return false;
    }
    creep.moveTo(cs);
    return true;
  }

  range = creep.pos.getRangeTo(target);
  if (range == 1) {
    creep.attack(target);
    creep.rangedMassAttack();
    return true;
  }
  creep.moveTo(target);
  return true;

}

module.exports.execute = function(creep) {
  //	creep.log('here');
  var flags = [Game.flags[creep.memory.base + '-1'], Game.flags[creep.memory.base + '-2'], Game.flags[creep.memory.base + '-3'], Game.flags[creep.memory.base + '-4']];

  if (creep.memory.step >= flags.length) {
    creep.memory.step = flags.length;
  }


  if (creep.memory.step >= flags.length) {
    if (creep.room.name != flags[flags.length - 1].roomName) {
      return;
    }
    creep.say('attack');
    if (attack(creep)) {
      return true;
    }
  }

  creep.moveTo(flags[creep.memory.step], {
    ignoreCreeps: true,
    costCallback: helper.getAvoids(creep.room)
  });

  if (typeof(flags[creep.memory.step]) == 'undefined' || flags[creep.memory.step].pos.roomName == creep.room.name) {
    creep.memory.step += 1;
  }
};
