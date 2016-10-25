'use strict';

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.get_part_config(energy, parts).sort().reverse();
};

module.exports.energyRequired = function(room) {
  return Math.min(room.energyCapacityAvailable - 300, 3250);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(room.energyCapacityAvailable - 300, 3250);
};

module.exports.died = function(name, memory) {
  console.log('--->', name, 'Died naturally?');
  delete Memory.creeps[name];
};

module.exports.preMove = function(creep) {
  //  creep.log('!!!!!!!!!!!!!!!! Autoattacking');
};

function attack(creep) {
  if (!creep.memory.notified) {
    creep.log('Attacking');
    Game.notify(Game.time + ' ' + creep.room.name + ' Attacking');
    creep.memory.notified = true;
  }
  var spawn = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == 'spawn') {
        return true;
      }
      return false;
    }
  });

  if (spawn === null) {
    var hostile_creep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: creep.room.findAttackCreeps
    });
    if (hostile_creep === null) {
      var structures = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);

      if (structures === null) {
        var constructionSites = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        creep.moveTo(constructionSites);
        return true;
      }

      creep.moveTo(structures);
      creep.attack(structures);
      return true;
    }
    creep.moveTo(hostile_creep);
    creep.attack(hostile_creep);
    return true;
  }
  //  var path = creep.pos.findPathTo(spawn, {
  //    ignoreDestructibleStructures: true
  //  });
  //  
  let search = PathFinder.search(
    creep.pos, {
      pos: spawn.pos,
      range: 1
    }, {
      maxRooms: 1
    }
  );
  creep.move(creep.pos.getDirectionTo(search.path[0]));
  creep.attack(spawn);
  return true;
}

module.exports.action = function(creep) {
  attack(creep);
  return true;
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
