'use strict';

/*
 * nextroomerattack is called if the route to the room to revive is blocked
 *
 * Attacks hostile everything
 */

roles.nextroomerattack = {};

roles.nextroomerattack.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, ATTACK];
  return room.getPartConfig(energy, parts).sort().reverse();
};

roles.nextroomerattack.energyRequired = function(room) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.nextroomerattack.energyBuild = function(room, energy) {
  return Math.min(room.getEnergyCapacityAvailable(), 3250);
};

roles.nextroomerattack.died = function(name, memory) {
  console.log('--->', name, 'Died naturally?');
  delete Memory.creeps[name];
};

roles.nextroomerattack.action = function(creep) {
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
    var hostileCreep = creep.pos.findClosestEnemy();
    if (hostileCreep !== null) {
      creep.moveTo(hostileCreep);
      creep.attack(hostileCreep);
    }
    return true;
  }
  var path = creep.pos.findPathTo(spawn, {
    ignoreDestructibleStructures: true
  });
  creep.attack(spawn);
  var return_code = creep.moveByPath(path);
  return true;
};

roles.nextroomerattack.execute = function(creep) {
  creep.log('Execute!!!');
};
