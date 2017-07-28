'use strict';

/*
 * Harvesting sources is done by sourcer
 *
 * Moves to the source and gets energy
 * In external rooms builds a container
 * In internal rooms transfers to the link
 *
 * If 'threshold' energy is in the container or on the ground
 * a carry is called
 */

roles.sourcer = {};

roles.sourcer.settings = {
  param: ['energyCapacityAvailable'],
  prefixString: {
    300: 'MW',
    600: 'MWC'
  },
  layoutString: {
    300: 'W',
    650: 'MW'
  },
  amount: {
    300: [1],
    350: [2],
    450: [3],
    550: [4],
    650: [1, 4],
    700: [2, 4]
  },
  maxLayoutAmount: {
    300: 4,
    650: 1
  }
};

roles.sourcer.buildRoad = true;
roles.sourcer.killPrevious = true;

// TODO should be true, but flee must be fixed before 2016-10-13
roles.sourcer.flee = false;

roles.sourcer.preMove = function(creep, directions) {
  // Misplaced spawn
  if (creep.inBase() && (creep.room.memory.misplacedSpawn || creep.room.controller.level < 3)) {
    //creep.say('smis', true);
    let targetId = creep.memory.routing.targetId;

    var source = creep.room.memory.position.creep[targetId];
    // TODO better the position from the room memory
    creep.moveTo(source, {
      ignoreCreeps: true
    });
    if (creep.pos.getRangeTo(source) > 1) {
      return true;
    }
  }

  if (!creep.room.controller) {
    var target = creep.findClosestSourceKeeper();
    if (target !== null) {
      let range = creep.pos.getRangeTo(target);
      if (range > 6) {
        creep.memory.routing.reverse = false;
      }
      if (range < 6) {
        creep.memory.routing.reverse = true;
      }
    }
  }

  // TODO Check if this is working
  if (directions) {
    let pos = creep.pos.getAdjacentPosition(directions.direction);
    creep.moveCreep(pos, (directions.direction + 3) % 8 + 1);
  }

  // TODO copied from nextroomer, should be extracted to a method or a creep flag
  // Remove structures in front
  if (!directions) {
    return false;
  }
  // TODO when is the forwardDirection missing?
  if (directions.forwardDirection) {
    let posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
    let structures = posForward.lookFor(LOOK_STRUCTURES);
    for (let structure of structures) {
      if (structure.structureType === STRUCTURE_ROAD) {
        continue;
      }
      if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
        continue;
      }
      if (structure.structureType === STRUCTURE_SPAWN && structure.my) {
        continue;
      }
      creep.dismantle(structure);
      creep.say('dismantle', true);
      break;
    }
  }
};

roles.sourcer.died = function(name, memory) {
  //console.log(name, 'died', JSON.stringify(memory));
  delete Memory.creeps[name];
};

roles.sourcer.action = function(creep) {
  // TODO check source keeper structure for ticksToSpawn
  if (!creep.room.controller) {
    var target = creep.findClosestSourceKeeper();
    if (target !== null) {
      let range = creep.pos.getRangeTo(target);
      if (range < 5) {
        delete creep.memory.routing.reached;
        creep.memory.routing.reverse = true;
      }
    }
  }

  creep.handleSourcer();
  return true;
};

roles.sourcer.execute = function(creep) {
  creep.log('Execute!!!');
  creep.memory.routing.targetReached = true;
  creep.handleSourcer();
  //  throw new Error();
};
