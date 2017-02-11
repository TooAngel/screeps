'use strict';

/*
 * autoattackmelle is the first wave of autoattacks
 *
 * Kills tower and spawn, hostile creeps and construction sites
 */

roles.autoattackmelee = {};

roles.autoattackmelee.settings = {
  layoutString: 'MA',
  amount: [5, 5],

};

roles.autoattackmelee.died = function(name, memory) {
  console.log('--->', name, 'Died naturally?');
  delete Memory.creeps[name];
};

roles.autoattackmelee.preMove = function(creep) {
  //  creep.log('!!!!!!!!!!!!!!!! Autoattacking');
};

roles.autoattackmelee.action = function(creep) {
  if (config.autoattack.notify && !creep.memory.notified) {
    creep.log('Attacking');
    Game.notify(Game.time + ' ' + creep.room.name + ' Attacking');
    creep.memory.notified = true;
  }

  if (creep.room.name != creep.memory.routing.targetRoom) {
    creep.memory.routing.reached = false;
    return true;
  }

  if (creep.room.controller.safeMode) {
    let constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
    creep.moveTo(constructionSites[0]);
    return true;
  }

  var spawn = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      if (object.structureType === STRUCTURE_SPAWN) {
        return true;
      }
      return false;
    }
  });

  if (spawn === null) {
    var hostileCreep = creep.findClosestEnemy();
    if (hostileCreep === null) {
      let structures = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: function(object) {
          if (object.structureType === STRUCTURE_CONTROLLER) {
            return false;
          }
          return true;
        }
      });

      if (structures === null) {
        var constructionSites = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        creep.moveTo(constructionSites);
        return true;
      }

      creep.moveTo(structures);
      creep.attack(structures);
      return true;
    }
    creep.moveTo(hostileCreep);
    creep.attack(hostileCreep);
    return true;
  }
  //  var path = creep.pos.findPathTo(spawn, {
  //    ignoreDestructibleStructures: true
  //  });
  let search = PathFinder.search(
    creep.pos, {
      pos: spawn.pos,
      range: 1
    }, {
      maxRooms: 1
    }
  );
  creep.move(creep.pos.getDirectionTo(search.path[0]));
  if (creep.pos.getRangeTo(spawn.pos) <= 1) {
    creep.attack(spawn);
  } else {
    let structures = creep.pos.findInRange(FIND_STRUCTURES, 1);
    creep.cancelOrder('attack');
    let returnCode = creep.attack(structures[0]);
  }
  return true;
};

roles.autoattackmelee.execute = function(creep) {
  creep.log('Execute!!!');
};
