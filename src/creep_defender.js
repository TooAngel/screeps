'use strict';

var helper = require('helper');

module.exports.boostActions = ['rangedAttack', 'heal'];

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, RANGED_ATTACK, MOVE, HEAL];
  return room.get_part_config(energy, parts).sort().reverse();
};

module.exports.energyRequired = function(room) {
  if (room.controller.level == 8) {
    return Math.min(room.energyCapacityAvailable, 6200);
  }
  return Math.min(room.energyCapacityAvailable, 1000);
};

module.exports.energyBuild = function(room, energy) {
  if (room.controller.level == 8) {
    return Math.max(2000, Math.min(room.energyCapacityAvailable, 6200));
  }
  return Math.min(room.energyCapacityAvailable, 1000);
};


function fightRampart(creep) {
  let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: helper.find_attack_creep
  });
  if (hostile === null) {
    return false;
  }

  let hostiles = creep.pos.findInRange(FIND_HOSTILE_CREEPS);
  if (hostiles.length > 1) {
    creep.rangedMassAttack();

  } else {
    creep.rangedAttack(hostile);
  }

  let rampart = hostile.pos.findInRange(FIND_MY_STRUCTURES, 3, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_RAMPART) {
        return true;
      }
    }
  });
  if (rampart.length === 0) {
    return false;
  }
  creep.moveTo(rampart[0]);
  return true;
}

function attack(creep) {
  if (fightRampart(creep)) {
    return true;
  }

  var range;
  var hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: helper.find_attack_creep
  });
  if (hostile === null) {
    var my_creeps = creep.room.find(FIND_MY_CREEPS, {
      filter: function(object) {
        if (object.hits < object.hitsMax) {
          return true;
        }
        return false;
      }
    });
    if (my_creeps.length > 0) {
      creep.moveTo(my_creeps[0]);
      range = creep.pos.getRangeTo(my_creeps[0]);
      if (range <= 1) {
        creep.heal(my_creeps[0]);
      } else {
        creep.rangedHeal(my_creeps[0]);
      }
      return true;
    }


    let friends = [];
    try {
      friends = require('friends');
    } catch (error) {

    }

    var allyCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        if (object.hits == object.hitsMax) {
          return false;
        }
        if (friends.indexOf(object.owner.username) > -1) {
          return true;
        }
        return false;
      }
    });
    if (allyCreeps.length > 0) {
      creep.say('heal', true);
      creep.moveTo(allyCreeps[0]);
      range = creep.pos.getRangeTo(my_creeps[0]);
      if (range <= 1) {
        creep.heal(allyCreeps[0]);
      } else {
        creep.rangedHeal(allyCreeps[0]);
      }
      return true;
    }


    // TODO disabled for nextroom defender
    //    creep.say('reverse');
    //    creep.memory.reverse = true;
    //    let exitDir = creep.room.findExitTo(creep.memory.base);
    //    let returnCode = creep.moveTo(new RoomPosition(25, 25, creep.memory.base));
    //    if (returnCode != OK) {
    //      creep.log('No target, reverse: ' + returnCode);
    //    }

    let constructionSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
      filter: function(object) {
        if (!object.owner) {
          return false;
        }
        if (object.owner.username == 'TooAngel') {
          return false;
        }
        return true;
      }
    });
    if (constructionSite !== null) {
      creep.say('kcs');
      creep.log('Kill constructionSite: ' + JSON.stringify(constructionSite));
      creep.moveTo(constructionSite);
      return true;
    }

    creep.moveRandom();
    return true;
  }

  if (creep.hits < 0.5 * creep.hitsMax) {
    let direction = creep.pos.getDirectionTo(hostile);
    creep.rangedAttack(hostile);
    direction = (direction + 3) % 8 + 1;
    let pos = creep.pos.getAdjacentPosition(direction);
    let terrain = pos.lookFor(LOOK_TERRAIN)[0];
    if (terrain == 'wall') {
      direction = (Math.random() * 8) + 1;
    }
    creep.move(direction);
    return true;
  }

  range = creep.pos.getRangeTo(hostile);
  if (range > 3) {
    creep.moveTo(hostile);
  }
  if (range === 0) {
    creep.log('Range: ' + range);
  }
  if (range < 3) {
    var direction = creep.pos.getDirectionTo(hostile);
    direction = (direction + 3) % 8 + 1;
    if (!direction || direction === null || creep.pos.x === 0 || creep.pos.x == 49 || creep.pos.y === 0 || creep.pos.y == 49) {
      creep.moveTo(25, 25);
      return true;
    }
    var pos = creep.pos.getAdjacentPosition(direction);
    var field = pos.lookFor(LOOK_TERRAIN)[0];
    if (field == 'wall') {
      direction = Math.floor((Math.random() * 8) + 1);
    }
    let creeps = pos.lookFor('creep');
    if (creeps.length > 0) {
      direction = Math.floor((Math.random() * 8) + 1);
    }
    creep.move(direction);
  }
  creep.rangedAttack(hostile);
  return true;
}


module.exports.action = function(creep) {
  if (creep.room.name == creep.memory.base && creep.memory.reverse) {
    return Creep.recycleCreep(creep);
  }
  // TODO Better in premove
  if (creep.room.name != creep.memory.base) {
    let walls = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: function(object) {
        if (object.structureType == STRUCTURE_WALL) {
          return true;
        }
        if (object.structureType == STRUCTURE_RAMPART) {
          return true;
        }
        return false;
      }
    });
    if (walls.length > 0) {
      if (!creep.room.controller || !creep.room.controller.my) {
        creep.rangedAttack(walls[0]);
      }
    }
  }

  creep.heal(creep);
  var room = Game.rooms[creep.room.name];
  if (room.memory.hostile) {
    attack(creep);
    return true;
  }

  attack(creep);
  return true;
};

module.exports.preMove = function(creep, directions) {
  creep.heal(creep);
  let target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: helper.find_attack_creep
  });
  if (target !== null) {
    attack(creep);
    return true;
  }

};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
