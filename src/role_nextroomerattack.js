'use strict';

/*
 * nextroomerattack is called if the route to the room to revive is blocked
 *
 * Attacks hostile everything
 */

roles.nextroomerattack = {};

roles.nextroomerattack.settings = {
  layoutString: 'MA',
  amount: [5, 5]
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
  const spawn = creep.pos.findClosestByRangePropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);

  if (spawn === null) {
    const hostileCreep = creep.pos.findClosestEnemy();
    if (hostileCreep !== null) {
      creep.moveTo(hostileCreep);
      creep.attack(hostileCreep);
    }
    return true;
  }
  const path = creep.pos.findPathTo(spawn, {
    ignoreDestructibleStructures: true
  });
  creep.attack(spawn);
  const return_code = creep.moveByPath(path);
  return true;
};

roles.nextroomerattack.execute = function(creep) {
  creep.log('Execute!!!');
};
