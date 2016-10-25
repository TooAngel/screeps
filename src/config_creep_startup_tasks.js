'use strict';

Creep.execute = function(creep, methods) {
  for (var method of methods) {
    if (method(creep)) {
      return true;
    }
  }
};

Creep.upgradeControllerTask = function(creep) {
  creep.say('upgradeController', true);
  if (creep.carry.energy === 0) {
    return false;
  }

  var range = creep.pos.getRangeTo(creep.room.controller);
  if (range <= 3) {
    let returnCode = creep.upgradeController(creep.room.controller);
    if (returnCode != OK) {
      creep.log('upgradeController: ' + returnCode);
    }
  }

  if (range > 1) {
    let returnCode = creep.moveTo(creep.room.controller);
  }
  return true;
};

Creep.constructTask = function(creep) {
  creep.say('construct', true);
  return creep.construct();
};

Creep.transferEnergy = function(creep) {
  creep.say('transferEnergy', true);
  return creep.transferEnergyMy();
};

Creep.buildRoads = function(creep) {
  let room = Game.rooms[creep.room.name];

  // TODO extract to roomposition
  function checkForRoad(pos) {
    var structures = pos.lookFor('structure');
    for (let structuresIndex in structures) {
      if (structures[structuresIndex].structureType == STRUCTURE_ROAD) {
        return true;
      }
    }
    return false;
  }


  // TODO Redo for all path in room
  var path = room.memory.position.path;
  for (let pathIndex in path) {
    var pos = new RoomPosition(
      path[pathIndex].x,
      path[pathIndex].y,
      creep.room.name
    );
    if (checkForRoad(pos)) {
      continue;
    }

    let returnCode = pos.createConstructionSite(STRUCTURE_ROAD);
    if (returnCode == OK) {
      return true;
    }
    if (returnCode == ERR_FULL) {
      return true;
    }
    if (returnCode == ERR_INVALID_TARGET) {
      // FIXME Creep is standing on constructionSite, need to check why it is not building
      creep.moveRandom();
      continue;
    }
    creep.log('buildRoads: ' + returnCode + ' pos: ' + JSON.stringify(pos));
    return true;
  }
  return false;
};

Creep.recycleCreep = function(creep) {
  if (creep.memory.role == 'planer') {
    creep.room.buildStructures();
  }

  let spawn = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: {
      structureType: STRUCTURE_SPAWN
    }
  });
  if (spawn !== null) {
    creep.moveTo(spawn, {
      ignoreCreeps: true
    });
    spawn.recycleCreep(creep);
  }
  // TODO move back
  return true;
};

Creep.getEnergy = function(creep) {
  return creep.getEnergy();
};

Creep.repairStructure = function(creep) {
  return creep.repairStructure();
};

Creep.getEnergyFromStorage = function(creep) {
  if (0 < creep.carry.energy) {
    return false;
  }

  var target = creep.pos.findClosestByRange(FIND_DROPPED_ENERGY, {
    filter: function(object) {
      return 0 < object.energy;
    }
  });
  if (target !== null) {
    var energyRange = creep.pos.getRangeTo(target);
    if (energyRange <= 1) {
      creep.pickup(target);
      return false;
    }
    if (300 < target.energy && energyRange < 4) {
      return creep.moveTo(target, {
        reusePath: 5,
        costCallback: creep.room.getAvoids(creep.room)
      }) === 0;
    }
  }

  var storage = creep.room.storage;
  if (!storage) {
    creep.log('No storage');

    let transferablesFull = function(object) {
      if (object.structureType == STRUCTURE_RAMPART) {
        return false;
      }
      if (object.structureType == STRUCTURE_CONTROLLER) {
        return false;
      }
      if (object.structureType == STRUCTURE_EXTENSION) {
        return object.energy > 0;
      }
      if (object.structureType == STRUCTURE_LINK) {
        return object.energy > 0;
      }
      if (object.structureType == STRUCTURE_SPAWN) {
        return object.energy > 0;
      }
      if (object.structureType == STRUCTURE_STORAGE) {
        return object.store.energy > 0;
      }
      if (object.structureType == STRUCTURE_TOWER) {
        return false;
      }
      if (object.structureType == STRUCTURE_POWER_SPAWN) {
        return false;
      }
      if (object.structureType == STRUCTURE_OBSERVER) {
        return false;
      }
      console.log('config_creep_startup_tasks.transferablesFull', object.structureType, JSON.stringify(object));
    };

    storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
      filter: transferablesFull
    });
  } else {
    if (storage.store.energy === 0) {
      return false;
    }
  }

  var range = creep.pos.getRangeTo(storage);

  var returnCode;
  if (range == 1) {
    returnCode = creep.withdraw(storage, RESOURCE_ENERGY);
  } else {
    returnCode = creep.moveTo(storage, {
      reusePath: 15,
      ignoreCreeps: true,
      costCallback: creep.room.getAvoids(creep.room, {}, true)
    });
    if (returnCode == ERR_NO_PATH) {
      creep.moveRandom();
      return true;
    }
    if (returnCode == ERR_TIRED) {
      return true;
    }
    if (returnCode != OK) {
      creep.log(`getEnergyFromStorage: ${returnCode}`);
    }
  }
  return true;
};
