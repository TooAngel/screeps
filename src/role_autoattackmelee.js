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
  fillTough: true,
};

roles.autoattackmelee.died = function(name) {
  brain.main.cleanUpDyingCreep(name);
};

roles.autoattackmelee.preMove = function() {
  //  creep.log('!!!!!!!!!!!!!!!! Autoattacking');
};

roles.autoattackmelee.action = function(creep) {
  if (config.autoattack.notify && !creep.memory.notified) {
    creep.log('Attacking');
    Game.notify(Game.time + ' ' + creep.room.name + ' Attacking');
    creep.memory.notified = true;
  }

  if (creep.room.name !== creep.memory.routing.targetRoom) {
    creep.memory.routing.reached = false;
    return true;
  }

  if (creep.room.controller.safeMode) {
    const constructionSites = creep.room.findConstructionSites();
    creep.moveTo(constructionSites[0]);
    return true;
  }

  const spawn = creep.pos.findClosestByRangePropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);

  if (spawn === null) {
    const hostileCreep = creep.findClosestEnemy();
    if (hostileCreep === null) {
      const structures = creep.pos.findClosestByRangePropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER], {inverse: true});

      if (structures === null) {
        const constructionSites = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
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
  const search = PathFinder.search(
    creep.pos, {
      pos: spawn.pos,
      range: 1,
    }, {
      maxRooms: 1,
    },
  );
  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }
  creep.move(creep.pos.getDirectionTo(search.path[0]));
  if (creep.pos.getRangeTo(spawn.pos) <= 1) {
    creep.attack(spawn);
  } else {
    const structures = creep.pos.findInRange(FIND_STRUCTURES, 1);
    creep.cancelOrder('attack');
    creep.attack(structures[0]);
  }
  return true;
};
