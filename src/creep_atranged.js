'use strict';

var helper = require('helper');

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL];
  return room.get_part_config(energy, parts);
};

module.exports.energyRequired = function(room) {
  return 4000;
};

module.exports.energyBuild = function(room) {
  return 4000;
};

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
    return true;
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
  // return false;
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
  if (ranged_attack(creep, target)) {
    return true;
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
      // creep.attack(target);
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
          // target = structures[i];
          break;
        }
      }
    }
    creep.attack(target);
    creep.rangedMassAttack();
  }
  return true;
}

function attack(creep) {
  var range;
  var structures;
  var i;
  var target;

  if (attack_attack_creep(creep)) {
    return true;
  }

  if (creep.hits < creep.hitsMax) {
    creep.heal(creep);
  } else {
    target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: function(object) {
        return object.hits < object.hitsMax;
      }
    });
    if (target !== null) {
      creep.rangedHeal(target);
    }

  }

  var flag = Game.flags.at;

  if (typeof(flag) != 'undefined' && creep.room.name == flag.roomName) {
    range = creep.pos.getRangeTo(flag);
    if (range == 1) {
      structures = flag.pos.lookFor('structure');
      for (i = 0; i < structures.length; i++) {
        if (structures[i].structureType == 'constructedWall') {
          creep.rangedAttack(structures[i]);
          return true;
        }
        if (structures[i].structureType == 'rampart') {
          creep.rangedMassAttack();
          return true;
        }
        creep.rangedAttack(structures[0]);
        return true;
      }
    } else {
      structures = flag.pos.lookFor('structure');
      for (i = 0; i < structures.length; i++) {
        if (structures[i].structureType == 'constructedWall') {
          creep.rangedAttack(structures[i]);
        } else {
          creep.rangedMassAttack();
        }
        creep.moveTo(flag);
        return true;
      }
      creep.rangedMassAttack();
      creep.moveTo(structures[0]);
    }
    Game.notify('No structure @ at flag');
  }

  target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return true;
    }
  });

  if (target !== null) {
    range = creep.pos.getRangeTo(target);
    if (range < 10) {

      if (range > 1) {
        if (range <= 3) {
          creep.rangedAttack(target);
        }
        var return_code = creep.moveTo(target);
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

  if (Game.flags.at && Game.flags.at.roomName != creep.room.name) {
    return false;
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
      creep.rangedMassAttack();
      return true;
    }
    if (range <= 3) {
      creep.rangedAttack(target);
    }
    creep.moveTo(target);
    return true;
  }
  target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == 'rampart') {
        return true;
      }
      return false;
    }
  });

  if (target === null) {
    return false;
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
  var flags = [Game.flags[creep.memory.base + '-1'], Game.flags[creep.memory.base + '-2'], Game.flags[creep.memory.base + '-3'], Game.flags[creep.memory.base + '-4']];

  if (creep.memory.step >= 5) {
    creep.memory.step = 5;
  }

  if (creep.memory.step >= 4) {
    if (attack(creep)) {
      return true;
    }
  }
  creep.heal(creep);


  creep.moveTo(flags[creep.memory.step], {
    reusePath: 5
  });

  if (typeof(flags[creep.memory.step]) == 'undefined' || flags[creep.memory.step].roomName == creep.room.name) {
    creep.memory.step += 1;
  }

};
