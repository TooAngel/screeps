'use strict';

Creep.execute = function(creep, methods) {
  for (const method of methods) {
    if (method(creep)) {
      return true;
    }
  }
};

Creep.upgradeControllerTask = function(creep) {
  creep.creepLog('upgradeControllerTask');
  if (creep.carry.energy === 0) {
    return false;
  }

  const range = creep.pos.getRangeTo(creep.room.controller);
  if (range <= 3) {
    const resources = creep.pos.findInRangePropertyFilter(FIND_DROPPED_RESOURCES, 10, 'resourceType', [RESOURCE_ENERGY]);
    let resource = false;
    if (resources.length > 0) {
      resource = resources[0];
      creep.pickup(resource);
    }
    const returnCode = creep.upgradeController(creep.room.controller);
    if (returnCode !== OK) {
      creep.log('upgradeController: ' + returnCode);
    } else {
      creep.upgraderUpdateStats();
    }
    if (resource) {
      creep.moveRandomWithin(creep.room.controller.pos, 3, resource);
    } else {
      creep.moveRandomWithin(creep.room.controller.pos);
    }
    return true;
  } else {
    creep.moveToMy(creep.room.controller.pos, 3);
  }
  return true;
};

Creep.constructTask = function(creep) {
  creep.creepLog('construct');
  return creep.construct();
};

Creep.transferEnergy = function(creep) {
  return creep.transferEnergy();
};

Creep.buildRoads = function(creep) {
  const room = Game.rooms[creep.room.name];

  // TODO extract to roomposition
  /**
   * checkForRoad Check if road is on position
   *
   * @param {object} pos - The position
   * @return {boolean} - road is on position
   */
  function checkForRoad(pos) {
    const structures = pos.lookFor('structure');
    for (const structuresIndex in structures) {
      if (structures[structuresIndex].structureType === STRUCTURE_ROAD) {
        return true;
      }
    }
    return false;
  }

  for (const pathName of Object.keys(room.getMemoryPaths())) {
    const path = room.getMemoryPath(pathName);
    for (const pathIndex of Object.keys(path)) {
      const pos = new RoomPosition(
        path[pathIndex].x,
        path[pathIndex].y,
        creep.room.name,
      );
      if (checkForRoad(pos)) {
        continue;
      }

      const returnCode = pos.createConstructionSite(STRUCTURE_ROAD);
      if (returnCode === OK) {
        return true;
      }
      if (returnCode === ERR_FULL) {
        return true;
      }
      if (returnCode === ERR_INVALID_TARGET) {
        // FIXME Creep is standing on constructionSite, need to check why it is not building
        creep.moveRandom();
        continue;
      }
      creep.log('buildRoads: ' + returnCode + ' pos: ' + JSON.stringify(pos));
      return true;
    }
  }
  return false;
};

Creep.recycleCreep = function(creep) {
  if (creep.memory.role === 'planer') {
    creep.room.buildStructures();
  }

  let spawn = creep.pos.findClosestByRangePropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (!spawn) {
    spawn = Game.rooms[creep.memory.base].findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN])[0];
  }
  if (spawn) {
    if (creep.room === spawn.room) {
      creep.moveToMy(spawn.pos);
    } else {
      // TODO make use of the proper routing logic
      creep.moveTo(spawn);
    }
    creep.say('recycle');
    spawn.recycleCreep(creep);
  }
  return true;
};

Creep.getEnergy = function(creep) {
  return creep.getEnergy();
};

Creep.repairStructure = function(creep) {
  return creep.repairStructure();
};

Creep.prototype.getEnergyFromHostileStructures = function() {
  let hostileStructures = this.room.findPropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_EXTRACTOR, STRUCTURE_OBSERVER], {
    inverse: true,
    filter: Room.structureHasEnergy,
  });
  if (this.carry.energy || !hostileStructures.length) {
    return false;
  }
  // Get energy from the structure with lowest amount first, so we can safely remove it
  const getEnergy = (object) => object.energy || object.store.energy;
  hostileStructures = _.sortBy(hostileStructures, [getEnergy, (object) => object.pos.getRangeTo(this)]);

  const structure = hostileStructures[0];
  const range = this.pos.getRangeTo(structure);
  if (range > 1) {
    this.moveToMy(structure.pos);
  } else {
    const resCode = this.withdraw(structure, RESOURCE_ENERGY);
    if (resCode === OK && getEnergy(structure) <= this.carryCapacity) {
      structure.destroy();
    } else {
      this.log(Game.time, 'withdraw from hostile ' + resCode);
    }
  }
  return true;
};

Creep.prototype.getEnergyFromStorage = function() {
  if (this.room.isStruggeling()) {
    return false;
  }

  if (this.carry.energy) {
    return false;
  }

  const range = this.pos.getRangeTo(this.room.storage);
  if (range === 1) {
    this.withdraw(this.room.storage, RESOURCE_ENERGY);
  } else {
    this.moveToMy(this.room.storage.pos, 1);
  }
  return true;
};

Creep.prototype.actuallyRepairStructure = function(toRepair) {
  this.creepLog('actuallyRepairStructure');
  const range = this.pos.getRangeTo(toRepair);
  if (range <= 3) {
    this.creepLog(`actuallyRepairStructure - within range ${range}`);
    this.repair(toRepair);
    this.moveRandomWithin(toRepair);

    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? moveRandomWithin`);
    }
    return true;
  }

  if (this.fatigue > 0) {
    return true;
  }

  const returnCode = this.moveToMy(toRepair.pos, 3);
  if (returnCode === true) {
    this.creepLog('actuallyRepairStructure - moveToMy');
    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? moveToMy`);
    }
    return true;
  }
  this.log('config_creep_resources.repairStructure moveByPath.returnCode: ' + returnCode);
  return true;
};

Creep.prototype.repairStructureWithIncomingNuke = function() {
  const nukes = this.room.findNukes();
  if (nukes.length === 0) {
    return false;
  }
  console.log('repairing because of nuke');
  const spawns = this.room.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (spawns.length === 0) {
    return false;
  }

  for (const spawn of spawns) {
    let found = false;
    let rampart;
    const structures = spawn.pos.lookFor(LOOK_STRUCTURES);
    for (const structure of structures) {
      // TODO this can be extracted to Structure.prototype.isRampart()
      if (structure.structureType === STRUCTURE_RAMPART) {
        if (structure.hits < 1100000) {
          found = true;
          rampart = structure;
          break;
        }
      }
    }
    if (found) {
      this.memory.target = rampart.id;
      this.memory.step = 1200000;
      return true;
    }
  }
};

Creep.prototype.repairStructureGetTarget = function() {
  const toRepair = Game.getObjectById(this.memory.routing.targetId);
  if (!toRepair || toRepair === null) {
    this.say('No target');
    delete this.memory.routing.targetId;
    return false;
  }
  return toRepair;
};

Creep.prototype.repairKnownTarget = function() {
  if (!this.memory.routing.targetId) {
    return false;
  }

  const toRepair = this.repairStructureGetTarget();
  if (!toRepair) {
    return false;
  }

  if (toRepair instanceof ConstructionSite) {
    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? moveToAndBuildConstructionSite`);
    }
    return this.moveToAndBuildConstructionSite(toRepair);
  }

  if (toRepair.hits < toRepair.hitsMax && (toRepair.hits < 10000 || toRepair.hits < this.memory.step + 10000)) {
    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? actuallyRepairStructure`);
    }
    return this.actuallyRepairStructure(toRepair);
  }

  delete this.memory.routing.targetId;
  return false;
};

Creep.prototype.repairStructure = function() {
  this.creepLog('repairStructure');
  if (this.repairKnownTarget()) {
    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? repairKnownTarget`);
    }
    return true;
  }
  this.creepLog('repairStructure - no target');

  if (this.repairStructureWithIncomingNuke()) {
    return true;
  }
  this.creepLog('repairStructure - no nuke');

  // Repair low ramparts
  const lowRamparts = this.pos.findInRangePropertyFilter(FIND_STRUCTURES, 4, 'structureType', [STRUCTURE_RAMPART], {
    filter: (rampart) => rampart.hits < 10000,
  });

  if (lowRamparts.length > 0) {
    this.memory.routing.targetId = lowRamparts[0].id;
    this.repairKnownTarget();
    return true;
  }

  // Build construction sites
  const target = this.pos.findClosestByRangePropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL]);
  if (target) {
    this.memory.step = 0;
    this.memory.routing.targetId = target.id;
    this.repairKnownTarget();
    return true;
  }

  // Repair roads
  const road = this.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_ROAD], {
    filter: (object) => object.hits < 0.5 * object.hitsMax,
  });
  if (road) {
    this.memory.routing.targetId = road.id;
    this.repairKnownTarget();
    return true;
  }

  // Repair ramparts and walls
  const step = this.memory.step;
  const structure = this.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL], {
    // Newbie zone walls have no hits
    filter: (object) => object.hits && object.hits < Math.min(step, object.hitsMax),
  });
  if (structure) {
    this.memory.routing.targetId = structure.id;
    this.repairKnownTarget();
    return true;
  }

  if (this.memory.step === 0) {
    this.memory.step = this.room.controller.level * 10000;
  }
  this.memory.step = (this.memory.step * 1.1) + 1;
  return false;
};

/**
 *
 * @param {Resource} target Resource object to pick up
 * @return {number} total received resources amount
 */
Creep.prototype.pickupOrWithdrawFromSourcer = function(target) {
  const creepFreeSpace = this.carryCapacity - _.sum(this.carry);
  let pickedUp = 0;
  // this.log('pickupOrWithdrawFromSourcer free '+creepFreeSpace+' '+target+' '+target.amount)
  if (target.amount < creepFreeSpace) {
    const container = target.pos.lookFor(LOOK_STRUCTURES)
      .find((structure) => structure.structureType === STRUCTURE_CONTAINER && structure.store[target.resourceType] > 0 && _.sum(structure.store) === structure.storeCapacity);
    if (container) {
      const toWithdraw = Math.min(creepFreeSpace - target.amount, container.store[target.resourceType]);
      this.withdraw(container, target.resourceType, toWithdraw);
      pickedUp += toWithdraw;
    } else {
      const sourcer = target.pos.lookFor(LOOK_CREEPS)
        .find((creep) => creep.memory && creep.memory.role === 'sourcer' && creep.carry[target.resourceType] > 0 && _.sum(creep.carry) === creep.carryCapacity);
      if (sourcer) {
        const toWithdraw = Math.min(creepFreeSpace - target.amount, sourcer.carry[target.resourceType]);
        sourcer.transfer(this, target.resourceType, toWithdraw);
        pickedUp += toWithdraw;
      }
    }
  }
  this.pickup(target);
  pickedUp += target.amount;
  return Math.min(pickedUp, creepFreeSpace);
};
