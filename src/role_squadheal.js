'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Heals creeps
 */

roles.squadheal = {};

roles.squadheal.settings = {
  layoutString: 'MH',
  amount: [1, 1]
};

roles.squadheal.healClosestCreep = function(creep) {
  var myCreep = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.hits < object.hitsMax) {
        return true;
      }
      return false;
    }
  });
  if (myCreep !== null) {
    creep.say('heal', true);
    let range = creep.pos.getRangeTo(myCreep);
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
    var squad = Memory.squads[creep.memory.squad];
    if (!creep.memory.initialized) {
      squad.heal[creep.id] = {};
      creep.memory.initialized = true;
    }
    let reverse = false;
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

  if (creep.room.name != creep.memory.routing.targetRoom) {
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
      let exit = creep.pos.findClosestByRange(FIND_EXIT);
      creep.moveTo(exit);
    } else {
      creep.log('mrandom');
      creep.moveRandom();
      creep.squadHeal();
    }
  }

  if (true) {
    return true;
  }
  if (creep.hits < creep.hitsMax) {
    creep.log('action heal');
    creep.heal(creep);
    creep.say('exit');
    let exit = creep.pos.findClosestByRange(FIND_EXIT);
    creep.cancelOrder('move');
    creep.cancelOrder('moveTo');

    if (creep.pos.x === 0 || creep.pos.y === 0 || creep.pos.x === 49 || creep.pos.y === 49) {
      return true;
    }

    let search = PathFinder.search(
      creep.pos, {
        pos: exit,
        range: 0
      }, {
        roomCallback: creep.room.getCostMatrixCallback(exit),
        maxRooms: 1
      }
    );

    if (config.visualizer.enabled && config.visualizer.showPathSearches) {
      visualizer.showSearch(search);
    }

    if (search.incomplete) {
      creep.say('incomplete');
      creep.log(creep.pos.getDirectionTo(exit.x, exit.y));
      let returnCode = creep.move(creep.pos.getDirectionTo(exit.x, exit.y));
      creep.log('rc: ' + returnCode);
      return true;
    }
    let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
    delete creep.memory.routing.reached;
    return true;
  }

  creep.squadHeal();
  return true;
};

roles.squadheal.execute = function(creep) {
  creep.log('Execute!!!');
  creep.heal(creep);
  creep.moveRandom();
};
