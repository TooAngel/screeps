'use strict';

/*
 * squadsiege is part of a squad to attack a room
 *
 * Heals creeps
 */

roles.squadheal = {};

roles.squadheal.settings = {
  layoutString: 'MH',
  amount: [17, 17]
};

roles.squadheal.preMove = function(creep, directions) {
  if (creep.hits < creep.hitsMax) {
    console.log('preMove heal');
    creep.heal(creep);
    creep.memory.routing.reverse = true;
    if (directions) {
      directions.direction = directions.backwardDirection;
    }
    return false;
  } else {
    creep.memory.routing.reverse = false;
  }

  var myCreeps = creep.room.find(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.hits < object.hitsMax) {
        return true;
      }
      return false;
    }
  });
  if (myCreeps.length > 0) {
    creep.say('heal', true);
    creep.moveTo(myCreeps[0]);
    let range = creep.pos.getRangeTo(myCreeps[0]);
    if (range <= 1) {
      creep.heal(myCreeps[0]);
    } else {
      creep.rangedHeal(myCreeps[0]);
    }
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
      if (creep.room.name === squad.moveTarget) {
        let nextExits = creep.room.find(creep.memory.route[creep.memory.routePos].exit);
        let nextExit = nextExits[Math.floor(nextExits.length / 2)];
        let range = creep.pos.getRangeTo(nextExit.x, nextExit.y);
        if (range < 4) {
          Memory.squads[creep.memory.squad].heal[creep.id].waiting = true;
          //        if (Math.random() > 0.5 * (range - 2)) {
          //          reverse = true;
          //        }
        }
      }
    }
  }
};

// TODO need to check if it works
roles.squadheal.action = function(creep) {
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
  //  creep.log('Execute!!!');
};
