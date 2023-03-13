'use strict';


const {isFriend} = require('./brain_squadmanager');

/*
 * nextroomer is used to build up rooms
 *
 * Bring the controller to level 3 after that build constructionSites
 * and continue upgrading.
 *
 * If the room is 'underSiege', build a tower next to a source, build ramparts
 * and fill the tower.
 */

roles.nextroomer = {};
roles.builder.boostActions = ['build', 'capacity'];
roles.nextroomer.settings = {
  layoutString: 'MWC',
  amount: [6, 3, 3],
};

roles.nextroomer.checkForRampart = function(coords) {
  const pos = new RoomPosition(coords.x, coords.y, coords.roomName);
  const structures = pos.lookFor('structure');
  return _.find(structures, (s) => s.structureType === STRUCTURE_RAMPART);
};

roles.nextroomer.buildRamparts = function(creep) {
  // TODO Guess roles.nextroomer should be higher
  const rampartMinHits = 10000;

  creep.say('checkRamparts');
  const posRampart = roles.nextroomer.checkForRampart(creep.pos);
  if (posRampart) {
    if (posRampart.hits < rampartMinHits) {
      creep.repair(posRampart);
      return true;
    }
  } else {
    creep.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_RAMPART);
    return true;
  }

  const room = Game.rooms[creep.room.name];
  let linkPosMem = room.memory.position.structure.link[1];
  if (creep.pos.getRangeTo(linkPosMem.x, linkPosMem.y) > 1) {
    linkPosMem = room.memory.position.structure.link[2];
  }

  const links = creep.pos.findInRangeLinks(1);

  if (links.length) {
    creep.say('dismantle');
    creep.dismantle(links[0]);
    return true;
  }

  creep.say('cr');
  const towerRampart = roles.nextroomer.checkForRampart(linkPosMem);
  if (towerRampart) {
    creep.say('tr');
    if (towerRampart.hits < rampartMinHits) {
      creep.repair(towerRampart);
      return true;
    }
  } else {
    const returnCode = creep.room.createConstructionSite(linkPosMem.x, linkPosMem.y, STRUCTURE_RAMPART);
    creep.log('Build tower rampart: ' + returnCode);
    return true;
  }
  return false;
};


roles.nextroomer.defendTower = function(creep) {
  const room = Game.rooms[creep.room.name];
  const constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
  if (constructionSites.length > 0) {
    creep.build(constructionSites[0]);
    return true;
  }

  const towers = creep.pos.findInRangeTowers(1);

  if (towers.length > 0) {
    if (roles.nextroomer.buildRamparts(creep)) {
      return true;
    }

    const towerId = Object.keys(towers)[0];
    if (towerId) {
      const tower = towers[towerId];
      if (tower.energy === tower.energyCapacity) {
        room.memory.underSiege = false;
        return false;
      } else {
        const returnCode = creep.transfer(tower, RESOURCE_ENERGY);
        if (returnCode === OK) {
          return true;
        }

        // if (returnCode === ERR_FULL) {}
        // Don't know what to do
        creep.say(returnCode);
        return true;
      }
    }
    return roles.nextroomer.buildRamparts(creep);
  } else if (roles.nextroomer.buildRamparts(creep)) {
    return true;
  }

  let linkPosMem = room.memory.position.structure.link[1];

  if (creep.pos.getRangeTo(linkPosMem.x, linkPosMem.y) > 2) {
    linkPosMem = room.memory.position.structure.link[2];
  }
  const linkPos = new RoomPosition(linkPosMem.x, linkPosMem.y, linkPosMem.roomName);
  const returnCode = linkPos.createConstructionSite(STRUCTURE_TOWER);
  if (returnCode === ERR_RCL_NOT_ENOUGH) {
    delete room.memory.underSiege;
  }
  creep.log('Build tower: ' + returnCode);
};

roles.nextroomer.stayAtSource = function(creep, source) {
  if (creep.carry.energy < creep.carryCapacity - 30) {
    const returnCode = creep.harvest(source);
    if (returnCode === OK) {
      if (creep.carry.energy >= 0) {
        const creepWithoutEnergy = creep.pos.findClosestByRangeCreepWithoutEnergy();
        const range = creep.pos.getRangeTo(creepWithoutEnergy);

        if (range === 1) {
          creep.transfer(creepWithoutEnergy, RESOURCE_ENERGY);
        }
      }
      return true;
    }
  }
  return roles.nextroomer.defendTower(creep, source);
};

roles.nextroomer.underSiege = function(creep) {
  if (creep.memory.targetId) {
    const sourcerPosMem = creep.room.data.positions.creep[creep.memory.targetId][0];
    const source = Game.getObjectById(creep.memory.targetId);
    if (creep.pos.isEqualTo(sourcerPosMem.x, sourcerPosMem.y)) {
      return roles.nextroomer.stayAtSource(creep, source);
    } else {
      delete creep.memory.targetId;
    }
  }
  const sources = creep.room.findSources();
  console.log(sources);
  for (const source of sources) {
    const sourcerPosMem = creep.room.data.positions.creep[source.id][0];
    const sourcerPos = new RoomPosition(sourcerPosMem.x, sourcerPosMem.y, creep.room.name);
    if (creep.pos.isEqualTo(sourcerPos)) {
      creep.memory.targetId = source.id;
      return roles.nextroomer.stayAtSource(creep, source);
    }

    const creeps = sourcerPos.lookFor('creep');
    if (creeps.length === 0) {
      creep.moveTo(sourcerPos);
      return true;
    }
  }
  return false;
};

const getMethods = function(creep) {
  if (creep.store.getFreeCapacity() === 0 && creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    const resourceToDrop = Object.keys(creep.store)[0];
    creep.drop(resourceToDrop, creep.store[resourceToDrop]);
  }
  const methods = [Creep.getEnergy];
  if (creep.room.controller.ticksToDowngrade < 1500 || creep.room.controller.progress > creep.room.controller.progressTotal) {
    methods.push(Creep.upgradeControllerTask);
  }

  const spawnCSs = creep.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_SPAWN]);
  const spawns = creep.room.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (spawns.length === 0 && spawnCSs.length > 0) {
    methods.push(Creep.constructTask);
  }

  const structures = creep.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_CONTROLLER], {inverse: true});
  if (creep.room.controller.level >= 3 && structures.length > 0) {
    methods.push(Creep.constructTask);
  }

  if (creep.room.controller.level < 8) {
    methods.push(Creep.upgradeControllerTask);
  }
  return methods;
};

const handleTower = function(creep) {
  if (creep.carry.energy > 0) {
    const towers = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_TOWER], {
      filter: (object) => object.energy < 10,
    });
    if (towers.length) {
      creep.moveTo(towers[0]);
      creep.transfer(towers[0], RESOURCE_ENERGY);
      return true;
    }
  }
};


/**
 * handleHostile
 *
 * @param {object} creep
 * @param {object} room
 * @return {boolean}
 */
function handleHostile(creep, room) {
  const hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {
    filter: (creep) => (!room.controller.safeMode || creep.ticksToLive > room.controller.safeMode) && !isFriend(creep.owner.username),
  });
  if (!hostileCreeps.length) {
    return;
  }
  room.memory.underSiege = true;
  if (creep.room.controller.level === 1 ||
    creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level] / 10 ||
    (creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level] && creep.pos.getRangeTo(creep.room.controller.pos) <= 3)
  ) {
    const methods = [Creep.getEnergy, Creep.upgradeControllerTask];
    return Creep.execute(creep, methods);
  }
}

roles.nextroomer.settle = function(creep) {
  creep.creepLog('settle');
  const room = Game.rooms[creep.room.name];

  const handledHostiles = handleHostile(creep, room);
  if (handledHostiles) {
    return handledHostiles;
  }

  room.memory.wayBlocked = false;
  if (room.memory.underSiege && room.controller && room.controller.level >= 3) {
    creep.log('underSiege: ' + room.memory.attackTimer);
    return roles.nextroomer.underSiege(creep);
  }

  if (handleTower(creep)) {
    return true;
  }

  if ((creep.room.energyCapacityAvailable < 300) && (creep.room.executeEveryTicks(50))) {
    const constructionSites = creep.room.findPropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_LAB, STRUCTURE_NUKER, STRUCTURE_TERMINAL]);
    for (const cs of constructionSites) {
      cs.remove();
    }
  }

  const methods = getMethods(creep);
  methods.push(Creep.transferEnergy);
  creep.creepLog(`Creep execute`);
  return Creep.execute(creep, methods);
};

roles.nextroomer.preMove = function(creep, directions) {
  if (!directions) {
    return false;
  }
  if (!directions.forwardDirection) {
    return false;
  }
  const posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
  const structures = posForward.lookFor(LOOK_STRUCTURES);
  for (const structure of structures) {
    if (structure.structureType === STRUCTURE_ROAD) {
      continue;
    }
    if (structure.structureType === STRUCTURE_RAMPART && structure.my) {
      continue;
    }

    creep.dismantle(structure);
    creep.say('dismantle');
    break;
  }
};

roles.nextroomer.action = function(creep) {
  // TODO when does this happen?
  if (creep.room.name !== creep.memory.routing.targetRoom) {
    delete creep.memory.routing.reached;
    return false;
  }

  // TODO ugly fix cause, target gets deleted
  creep.memory.targetBackup = creep.memory.targetBackup || creep.memory.target;
  if (creep.room.name === creep.memory.targetBackup) {
    return roles.nextroomer.settle(creep);
  }
  return roles.nextroomer.settle(creep);
};
