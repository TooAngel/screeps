'use strict';

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

roles.nextroomer.died = function(name, creepMemory) {
  if (!creepMemory || !creepMemory.routing || !creepMemory.routing.route || !creepMemory.routing.routePos) {
    console.log('DIED', name, 'routing not in memory');
    return true;
  }
  let roomName = creepMemory.routing.route[creepMemory.routing.routePos].room;
  let message = `${name} ${roomName} ${JSON.stringify(creepMemory)}`;
  if (roomName === creepMemory.routing.targetRoom) {
    // TODO make underSiege to a counter
  }
  // Works but was annoying due to suppen
  console.log('DIED:', message);
  return true;
};

roles.nextroomer.settings = {
  layoutString: 'MWC',
  amount: [6, 3, 3]
};

roles.nextroomer.checkForRampart = function(coords) {
  let pos = new RoomPosition(coords.x, coords.y, coords.roomName);
  let structures = pos.lookFor('structure');
  return _.find(structures, (s) => s.structureType === STRUCTURE_RAMPART);
};

roles.nextroomer.buildRamparts = function(creep) {
  let ramparts = creep.pos.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_RAMPART]);

  // TODO Guess roles.nextroomer should be higher
  let rampartMinHits = 10000;

  creep.say('checkRamparts');
  let posRampart = roles.nextroomer.checkForRampart(creep.pos);
  if (posRampart) {
    if (posRampart.hits < rampartMinHits) {
      creep.repair(posRampart);
      return true;
    }
  } else {
    creep.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_RAMPART);
    return true;
  }

  let room = Game.rooms[creep.room.name];
  let linkPosMem = room.memory.position.structure.link[1];
  if (creep.pos.getRangeTo(linkPosMem.x, linkPosMem.y) > 1) {
    linkPosMem = room.memory.position.structure.link[2];
  }

  let links = creep.pos.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_LINK]);
  if (links.length) {
    creep.say('dismantle');
    creep.log(JSON.stringify(links));
    creep.dismantle(links[0]);
    return true;
  }

  creep.say('cr');
  let towerRampart = roles.nextroomer.checkForRampart(linkPosMem);
  if (towerRampart) {
    creep.say('tr');
    if (towerRampart.hits < rampartMinHits) {
      creep.repair(towerRampart);
      return true;
    }
  } else {
    let returnCode = creep.room.createConstructionSite(linkPosMem.x, linkPosMem.y, STRUCTURE_RAMPART);
    creep.log('Build tower rampart: ' + returnCode);
    return true;
  }
  return false;
};

roles.nextroomer.defendTower = function(creep, source) {
  let room = Game.rooms[creep.room.name];
  let constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
  if (constructionSites.length > 0) {
    for (let constructionSiteId in constructionSites) {
      creep.build(constructionSites[constructionSiteId]);
    }
    return true;
  }

  let towers = creep.pos.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_TOWER]);

  if (towers.length > 0) {
    if (roles.nextroomer.buildRamparts(creep)) {
      return true;
    }

    for (let towerId in towers) {
      let tower = towers[towerId];
      if (tower.energy === tower.energyCapacity) {
        room.memory.underSiege = false;
        return false;
      } else {
        let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
        if (returnCode === OK) {
          return true;
        }

        //if (returnCode === ERR_FULL) {}
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
  let linkPos = new RoomPosition(linkPosMem.x, linkPosMem.y, linkPosMem.roomName);
  let returnCode = linkPos.createConstructionSite(STRUCTURE_TOWER);
  if (returnCode === ERR_RCL_NOT_ENOUGH) {
    delete room.memory.underSiege;
  }
  creep.log('Build tower: ' + returnCode);
};

roles.nextroomer.stayAtSource = function(creep, source) {
  if (creep.carry.energy < creep.carryCapacity - 30) {
    let returnCode = creep.harvest(source);
    if (returnCode === OK) {
      if (creep.carry.energy >= 0) {
        const creepWithoutEnergy = creep.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'carry.energy', [0]);
        let range = creep.pos.getRangeTo(creepWithoutEnergy);

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
  let room = Game.rooms[creep.room.name];
  if (creep.memory.targetId) {
    let sourcerPosMem = room.memory.position.creep[creep.memory.targetId];
    let source = Game.getObjectById(creep.memory.targetId);
    if (creep.pos.isEqualTo(sourcerPosMem.x, sourcerPosMem.y)) {
      return roles.nextroomer.stayAtSource(creep, source);
    } else {
      delete creep.memory.targetId;
    }
  }
  let sources = room.find(FIND_SOURCES);
  for (var sourceId in sources) {
    let source = sources[sourceId];
    let sourcerPosMem = room.memory.position.creep[source.id];
    let sourcerPos = new RoomPosition(sourcerPosMem.x, sourcerPosMem.y, sourcerPosMem.roomName);

    if (creep.pos.isEqualTo(sourcerPos)) {
      creep.memory.targetId = source.id;
      return roles.nextroomer.stayAtSource(creep, source);
    }

    let creeps = sourcerPos.lookFor('creep');
    if (creeps.length === 0) {
      creep.moveTo(sourcerPos.x, sourcerPos.y);
      return true;
    }
  }
  return false;
};

roles.nextroomer.settle = function(creep) {
  let room = Game.rooms[creep.room.name];
  let hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {
    filter: creep => (!room.controller.safeMode || creep.ticksToLive > room.controller.safeMode) && !brain.isFriend(creep.owner.username)
  });
  if (hostileCreeps.length) {
    room.memory.underSiege = true;
    if (creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level] / 10 || creep.room.controller.level === 1) {
      let methods = [Creep.getEnergy, Creep.upgradeControllerTask];
      return Creep.execute(creep, methods);
    }
  }
  room.memory.wayBlocked = false;
  if (room.memory.underSiege && room.controller && room.controller.level >= 3) {
    creep.log('underSiege: ' + room.memory.attackTimer);
    return roles.nextroomer.underSiege(creep);
  }

  if (creep.carry.energy > 0) {
    const towers = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_TOWER], false, {
      filter: object => object.energy < 10
    });
    if (towers.length) {
      creep.moveTo(towers[0]);
      creep.transfer(towers[0], RESOURCE_ENERGY);
      return true;
    }
  }

  if (creep.room.energyCapacityAvailable < 300) {
    let constructionSites = creep.room.findPropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_LAB, STRUCTURE_NUKER, STRUCTURE_TERMINAL]);
    for (let cs of constructionSites) {
      cs.remove();
    }
  }

  let methods = [Creep.getEnergy];
  if (creep.room.controller.ticksToDowngrade < 1500 || creep.room.controller.progress > creep.room.controller.progressTotal) {
    methods.push(Creep.upgradeControllerTask);
  }

  let spawnCSs = creep.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_SPAWN]);
  let spawns = creep.room.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (spawns.length === 0 && spawnCSs.length > 0) {
    methods.push(Creep.constructTask);
  }

  let structures = creep.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_CONTROLLER], true);
  if (creep.room.controller.level >= 3 && structures.length > 0) {
    methods.push(Creep.constructTask);
  }

  if (creep.room.controller.level < 8) {
    methods.push(Creep.upgradeControllerTask);
  }

  methods.push(Creep.transferEnergy);
  return Creep.execute(creep, methods);
};

roles.nextroomer.preMove = function(creep, directions) {
  if (!directions) {
    return false;
  }
  let posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
  let structures = posForward.lookFor(LOOK_STRUCTURES);
  for (let structure of structures) {
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
  if (creep.room.name != creep.memory.routing.targetRoom) {
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

roles.nextroomer.execute = function(creep) {
  creep.log('Execute!!!');
  //creep.moveTo(25, 25);
};
