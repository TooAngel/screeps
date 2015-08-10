'use strict';

var actions = require('actions');
var helper = require('helper');

module.exports.get_part_config = function(room, energy, heal, target) {
  var parts = [MOVE, WORK, MOVE, CARRY];
  var config = room.get_part_config(energy, parts);
  return config;
};

module.exports.energyRequired = function(room) {
  return Math.min(700, room.energyCapacityAvailable - 50);
};

module.exports.energyBuild = function(room, energy) {
  return Math.min(3150, energy);
};

module.exports.preMove = function(creep, directions) {
  if (!directions) {
    return false;
  }
  let posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
  let structures = posForward.lookFor(LOOK_STRUCTURES);
  for (let structure of structures) {
    if (structure.structureType == STRUCTURE_ROAD) {
      continue;
    }
    if (structure.structureType == STRUCTURE_RAMPART && structure.my) {
      continue;
    }

    var crl = creep.room.controller;
    if (crl) {
      var own = crl.owner ? crl.owner.username : '';
      var rsv = crl.reservation ? crl.reservation.username : '';
      if (own + rsv == 'AzuraStar') {
        creep.say('Not dismantle', true);
        break;
      }
    }

    creep.dismantle(structure);
    creep.say('dismantle');
    break;
  }
};

function checkForRampart(coods) {
  let pos = new RoomPosition(coods.x, coods.y, coods.roomName);
  let structures = pos.lookFor('structure');
  for (let structuresId in structures) {
    let structure = structures[structuresId];
    if (structure.structureType == STRUCTURE_RAMPART) {
      return structure;
    }
  }
  return;
}

function buildRamparts(creep) {
  let ramparts = creep.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: {
      structureType: STRUCTURE_RAMPART
    }
  });

  creep.say('checkRamparts');
  let posRampart = checkForRampart(creep.pos);
  if (posRampart) {
    if (posRampart.hits < 100000) {
      creep.repair(posRampart);
      return true;
    }
  } else {
    creep.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_RAMPART);
    return true;
  }

  let room = Game.rooms[creep.room.name];
  let linkPosMem = room.memory.position.structure.link[0];
  if (creep.pos.getRangeTo(linkPosMem.x, linkPosMem.y) > 1) {
    linkPosMem = room.memory.position.structure.link[1];
  }
  creep.say('cr');
  let towerRampart = checkForRampart(linkPosMem);
  if (towerRampart) {
    creep.say('tr');
    if (towerRampart.hits < 100000) {
      creep.repair(towerRampart);
      return true;
    }
  } else {
    creep.room.createConstructionSite(linkPosMem.x, linkPosMem.y, STRUCTURE_RAMPART);
    return true;
  }

  return false;
}

function defendTower(creep, source) {
  let room = Game.rooms[creep.room.name];

  let constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
  if (constructionSites.length > 0) {
    for (let constructionSiteId in constructionSites) {
      creep.build(constructionSites[constructionSiteId]);
    }
    return true;
  }

  let towers = creep.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: {
      structureType: STRUCTURE_TOWER
    }
  });
  if (towers.length > 0) {
    if (buildRamparts(creep)) {
      return true;
    }
    for (let towerId in towers) {
      let tower = towers[towerId];
      if (tower.energy == tower.energyCapacity) {
        room.memory.underSiege = false;
        return false;
      } else {
        let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
        if (returnCode == OK) {
          return true;
        }
        if (returnCode == ERR_FULL) {}
        // Don't know what to do
        creep.say(returnCode);
        return true;
      }
    }
    return buildRamparts(creep);
  } else {
    if (buildRamparts(creep)) {
      return true;
    }
  }

  let linkPosMem = room.memory.position.structure.link[0];
  if (creep.pos.getRangeTo(linkPosMem.x, linkPosMem.y) > 1) {
    linkPosMem = room.memory.position.structure.link[1];
  }
  let linkPos = new RoomPosition(linkPosMem.x, linkPosMem.y, linkPosMem.roomName);
  let returnCode = linkPos.createConstructionSite(STRUCTURE_TOWER);
  if (returnCode == ERR_RCL_NOT_ENOUGH) {
    delete room.memory.underSiege;
  }
  creep.log('Build tower: ' + returnCode);

}

function stayAtSource(creep, source) {
  if (creep.carry.energy < creep.carryCapacity - 30) {
    let returnCode = creep.harvest(source);
    if (returnCode == OK) {
      if (creep.carry.energy >= 0) {
        var creep_without_energy = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
          filter: function(object) {
            return object.carry.energy === 0 && object.id != creep.id;
          }
        });
        let range = creep.pos.getRangeTo(creep_without_energy);

        if (range == 1) {
          creep.transfer(creep_without_energy, RESOURCE_ENERGY);
        }
      }
      return true;
    }
  }
  if (defendTower(creep, source)) {
    return true;
  }
  return false;
}

function underSiege(creep) {
  let room = Game.rooms[creep.room.name];
  if (creep.memory.targetId) {
    let sourcerPosMem = room.memory.position.creep[creep.memory.targetId];
    let source = Game.getObjectById(creep.memory.targetId);
    if (creep.pos.isEqualTo(sourcerPosMem.x, sourcerPosMem.y)) {
      return stayAtSource(creep, source);
    }
    delete creep.memory.targetId;

  }

  let sources = room.find(FIND_SOURCES);
  for (var sourceId in sources) {
    let source = sources[sourceId];
    let sourcerPosMem = room.memory.position.creep[source.id];
    let sourcerPos = new RoomPosition(sourcerPosMem.x, sourcerPosMem.y, sourcerPosMem.roomName);

    if (creep.pos.isEqualTo(sourcerPos.x, sourcerPos.y)) {
      creep.memory.targetId = source.id;
      return stayAtSource(creep, source);
    }

    let creeps = sourcerPos.lookFor('creep');
    if (creeps.length > 0) {
      continue;
    }
    creep.moveTo(sourcerPos.x, sourcerPos.y);
    return true;
  }


  return false;
}

function settle(creep) {
  let room = Game.rooms[creep.room.name];
  let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
  if (hostileCreeps.length > 0) {
    room.memory.underSiege = true;

    // TODO adapt to room controller level
    if (creep.room.controller.ticksToDowngrade < 5000) {
      let methods = [actions.getEnergy];
      methods.push(actions.upgradeController);
      return actions.execute(creep, methods);
    }

  }

  room.memory.wayBlocked = false;
  if (room.memory.underSiege && room.controller && room.controller.level >= 3) {
    creep.log('underSiege');
    if (underSiege(creep)) {
      return true;
    }
  }

  if (creep.carry.energy > 0) {
    var towers = creep.room.find(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.structureType != STRUCTURE_TOWER) {
          return false;
        }
        if (object.energy < 10) {
          return true;
        }
        return false;
      }
    });
    if (towers.length > 0) {
      creep.moveTo(towers[0]);
      creep.transfer(towers[0], RESOURCE_ENERGY);
      return true;
    }
  }


  if (_.sum(creep.carry) === 0) {
    let hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES);
    hostileStructures = _.sortBy(hostileStructures, function(object) {
      if (object.structureType == STRUCTURE_STORAGE) {
        return 2;
      }
      return 1;
    });
    if (hostileStructures.length > 0) {
      let structure = hostileStructures[0];
      if (structure.structureType == STRUCTURE_STORAGE) {
        if (structure.store.energy === 0) {
          structure.destroy();
          return true;
        }
      } else {
        if (structure.energy === 0) {
          structure.destroy();
          return true;
        }
      }
      creep.say('hostile');
      creep.moveTo(structure);
      creep.withdraw(structure, RESOURCE_ENERGY);
      return true;
    }
  }

  if (creep.room.energyCapacityAvailable < 300) {
    let constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
      filter: function(object) {
        if (object.structureType == STRUCTURE_LAB) {
          return true;
        }
        if (object.structureType == STRUCTURE_NUKER) {
          return true;
        }
        if (object.structureType == STRUCTURE_TERMINAL) {
          return true;
        }
        return false;
      }
    });
    for (let cs of constructionSites) {
      cs.remove();
    }
  }


  let methods = [actions.getEnergy];
  if (creep.room.controller && creep.room.controller.level >= 5 && creep.room.storage && creep.room.storage.store.energy > 100) {
    methods = [actions.getEnergyFromStorage];
  }
  if (creep.room.controller.ticksToDowngrade < 1500) {
    methods.push(actions.upgradeController);
  }
  let structures = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_RAMPART) {
        return false;
      }
      if (object.structureType == STRUCTURE_CONTROLLER) {
        return false;
      }
      return true;
    }
  });

  if (creep.room.controller.level >= 3 && structures.length > 0) {
    methods.push(actions.construct);
  }
  if (creep.room.controller.level < 8) {
    methods.push(actions.upgradeController);
  }
  methods.push(actions.transferEnergy);
  return actions.execute(creep, methods);
}

module.exports.action = function(creep) {
  // TODO when does this happen?
  if (creep.room.name != creep.memory.routing.targetRoom) {
    delete creep.memory.routing.reached;
    return false;
  }

  // TODO ugly fix cause, target gets deleted
  creep.memory.targetBackup = creep.memory.targetBackup || creep.memory.target;
  if (creep.room.name == creep.memory.targetBackup) {
    return settle(creep);
  }
  return settle(creep);
};

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
};
