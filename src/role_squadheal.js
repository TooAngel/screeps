'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Heals creeps
 */

roles.squadheal = {};

roles.squadheal.settings = {
  layoutString: 'MH',
  amount: [1, 1],
  fillTough: true,
};

roles.squadheal.preMove = function(creep, directions) {
  creep.creepLog('preMove');
  if (creep.hits < creep.hitsMax) {
    creep.log('preMove heal');
    creep.selfHeal();
    creep.memory.routing.reverse = true;
    if (directions) {
      directions.direction = directions.backwardDirection;
    }
    return false;
  } else {
    creep.memory.routing.reverse = false;
  }

  if (creep.healClosestCreep()) {
    return true;
  }

  if (creep.memory.squad) {
    const squad = Memory.squads[creep.memory.squad];
    if (!squad) {
      creep.log(`There is no squad: ${creep.memory.squad} squads: ${Object.keys(Memory.squads)}`);
      return false;
    }
    if (!creep.memory.initialized) {
      squad.heal[creep.id] = {};
      creep.memory.initialized = true;
    }
    if (squad.action === 'move') {
      if (creep.squadMove(squad, 4, false, 'heal')) {
        return true;
      }
    }
  }
};

// TODO need to check if it works
roles.squadheal.action = function(creep) {
  creep.selfHeal();
  if (creep.room.name !== creep.memory.routing.targetRoom) {
    // creep.log('Not in room');
    if (creep.hits < creep.hitsMax) {
      creep.moveRandom();
    } else {
      // creep.log('delete?');
      delete creep.memory.routing.reached;
    }
    return true;
  } else {
    creep.log('In room');
    // TODO calculate if we would to flip directly back to the previous room
    // get all towers and calculate their potential damage
    // the damage is applied after the first tick
    if (creep.hits < creep.hitsMax) {
      creep.say('exit');
      const exit = creep.pos.findClosestByRange(FIND_EXIT);
      creep.moveTo(exit);
    } else {
      creep.log('mrandom');
      creep.moveRandom();
      creep.squadHeal();
    }
  }

  return true;
};
