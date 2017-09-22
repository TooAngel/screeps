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

roles.squadheal.healClosestCreep = function(creep) {
  const myCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.hits < object.hitsMax) {
        return true;
      }
      return false;
    },
  });
  if (myCreep !== null) {
    creep.say('heal', true);
    const range = creep.pos.getRangeTo(myCreep);
    if (range <= 1) {
      creep.heal(myCreep);
    } else {
      creep.moveTo(myCreep);
      creep.rangedHeal(myCreep);
    }
    return true;
  }
  return false;
};

roles.squadheal.preMove = function(creep, directions) {
  creep.log('preMove');
  if (creep.hits < creep.hitsMax) {
    creep.log('preMove heal');
    creep.heal(creep);
    creep.memory.routing.reverse = true;
    if (directions) {
      directions.direction = directions.backwardDirection;
    }
    return false;
  } else {
    creep.memory.routing.reverse = false;
  }

  if (roles.squadheal.healClosestCreep(creep)) {
    return true;
  }

  if (creep.memory.squad) {
    const squad = Memory.squads[creep.memory.squad];
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
  creep.heal(creep);

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
      creep.log('action heal');
      creep.heal(creep);
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

roles.squadheal.execute = function(creep) {
  creep.log('Execute!!!');
  creep.heal(creep);
  creep.moveRandom();
};
