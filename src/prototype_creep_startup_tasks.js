'use strict';

Creep.execute = function(creep, methods) {
  for (let method of methods) {
    if (method(creep)) {
      return true;
    }
  }
};

Creep.upgradeControllerTask = function(creep) {
  if (creep.carry.energy === 0) {
    return false;
  }

  let range = creep.pos.getRangeTo(creep.room.controller);
  if (range <= 3) {
    let returnCode = creep.upgradeController(creep.room.controller);
    if (returnCode != OK) {
      creep.log('upgradeController: ' + returnCode);
    }
    creep.moveRandomWithin(creep.room.controller.pos);
    return true;
  } else {
    creep.moveToMy(creep.room.controller.pos, 3);
  }
  return true;
};

Creep.constructTask = function(creep) {
  //  creep.say('construct', true);
  return creep.construct();
};

Creep.transferEnergy = function(creep) {
  //  creep.say('transferEnergy', true);
  return creep.transferEnergyMy();
};

Creep.buildRoads = function(creep) {
  let room = Game.rooms[creep.room.name];

  // TODO extract to roomposition
  function checkForRoad(pos) {
    let structures = pos.lookFor('structure');
    for (let structuresIndex in structures) {
      if (structures[structuresIndex].structureType === STRUCTURE_ROAD) {
        return true;
      }
    }
    return false;
  }

  // TODO Redo for all path in room
  let path = room.memory.position.path;
  for (let pathIndex in path) {
    let pos = new RoomPosition(
      path[pathIndex].x,
      path[pathIndex].y,
      creep.room.name
    );
    if (checkForRoad(pos)) {
      continue;
    }

    let returnCode = pos.createConstructionSite(STRUCTURE_ROAD);
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
  if (this.carry.energy) {
    return false;
  }
  let hostileStructures = this.room.findPropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_EXTRACTOR, STRUCTURE_OBSERVER], true, {
    filter: Room.structureHasEnergy
  });
  if (!hostileStructures.length) {
    return false;
  }

  this.say('hostile');
  // Get energy from the structure with lowest amount first, so we can safely remove it
  const getEnergy = object => object.energy || object.store.energy;
  hostileStructures = _.sortBy(hostileStructures, [getEnergy, object => object.pos.getRangeTo(this)]);

  let structure = hostileStructures[0];
  let range = this.pos.getRangeTo(structure);
  if (range > 1) {
    this.moveToMy(structure.pos);
  } else {
    const res_code = this.withdraw(structure, RESOURCE_ENERGY);
    if (res_code === OK && getEnergy(structure) <= this.carryCapacity) {
      structure.destroy();
    }
  }
  return true;
};

Creep.prototype.getEnergyFromStorage = function() {
  if (!this.room.storage || !this.room.storage.my || this.room.storage.store.energy < config.creep.energyFromStorageThreshold) {
    return false;
  }

  if (this.carry.energy) {
    return false;
  }

  let range = this.pos.getRangeTo(this.room.storage);
  if (range === 1) {
    this.withdraw(this.room.storage, RESOURCE_ENERGY);
  } else {
    this.moveToMy(this.room.storage.pos, 1);
  }
  return true;
};

Creep.prototype.repairStructure = function() {
  let structure = null;
  let i = null;
  let structures = null;

  if (this.memory.target) {
    let to_repair = Game.getObjectById(this.memory.target);
    if (!to_repair || to_repair === null) {
      this.say('No target');
      delete this.memory.target;
      return false;
    }

    if (to_repair instanceof ConstructionSite) {
      this.build(to_repair);
      this.moveToMy(to_repair.pos, 3);
      return true;
    } else if (to_repair.hits < 10000 || to_repair.hits < this.memory.step + 10000) {
      this.repair(to_repair);
      if (this.fatigue === 0) {
        let range = this.pos.getRangeTo(to_repair);
        if (range <= 3) {
          this.moveRandomWithin(to_repair);
        } else {
          let returnCode = this.moveToMy(to_repair.pos, 3);
          this.memory.lastPosition = this.pos;
          if (returnCode === OK) {
            return true;
          }
          this.log('config_creep_resources.repairStructure moveByPath.returnCode: ' + returnCode);
          return true;
        }
      }
    } else {
      delete this.memory.target;
    }
  }

  let nukes = this.room.find(FIND_NUKES);
  if (nukes.length > 0) {
    let spawns = this.room.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
    if (spawns.length > 0) {
      for (let spawn of spawns) {
        let found = false;
        let rampart;
        structures = spawn.pos.lookFor(LOOK_STRUCTURES);
        for (structure of structures) {
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
    }
  }

  // Repair low ramparts
  const lowRamparts = this.pos.findInRangePropertyFilter(FIND_STRUCTURES, 4, 'structureType', [STRUCTURE_RAMPART], false, {
    filter: rampart => rampart.hits < 10000
  });

  if (lowRamparts.length > 0) {
    let lowRampart = lowRamparts[0];
    let range = this.pos.getRangeTo(lowRampart);
    if (range <= 3) {
      this.repair(lowRampart);
      this.moveRandomWithin(lowRampart);
    } else {
      this.moveToMy(lowRampart.pos, 3);
    }
    return true;
  }

  // Build construction sites
  let target = this.pos.findClosestByRangePropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL]);

  if (target !== null) {
    let range = this.pos.getRangeTo(target);

    if (range <= 3) {
      this.build(target);
      this.memory.step = 0;
      const targetNew = this.pos.findClosestByRangePropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL], false, {
        filter: object => object.id !== target.id
      });
      if (targetNew !== null) {
        target = targetNew;
      }
    }
    let ignoreCreepsSwitch = true;
    let last_pos = this.memory.lastPosition;
    if (this.memory.lastPosition && this.pos.isEqualTo(new RoomPosition(last_pos.x, last_pos.y, this.room.name))) {
      this.memory.move_wait++;
      if (this.memory.move_wait > 5) {
        ignoreCreepsSwitch = false;
      }
    } else {
      this.memory.move_wait = 0;
    }
    this.moveToMy(target.pos, 3);
    this.memory.lastPosition = this.pos;
    this.memory.target = target.id;
    return true;
  }

  let creep = this;
  structure = this.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL], false, {
    // Newbie zone walls have no hits
    filter: object => object.hits && object.hits < Math.min(creep.memory.step, object.hitsMax)
  });
  if (structure && structure !== null) {
    this.memory.target = structure.id;
    return true;
  }

  if (this.memory.step === 0) {
    this.memory.step = this.room.controller.level * 10000;
  }
  this.memory.step = (this.memory.step * 1.1) + 1;

  //   this.log('Nothing found: ' + this.memory.step);
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
    let container = target.pos.lookFor(LOOK_STRUCTURES)
      .find(structure => structure.structureType === STRUCTURE_CONTAINER && structure.store[target.resourceType] > 0 && _.sum(structure.store) === structure.storeCapacity);
    if (container) {
      const toWithdraw = Math.min(creepFreeSpace - target.amount, container.store[target.resourceType]);
      this.withdraw(container, target.resourceType, toWithdraw);
      pickedUp += toWithdraw;
    } else {
      let sourcer = target.pos.lookFor(LOOK_CREEPS)
        .find(creep => creep.memory && creep.memory.role === 'sourcer' && creep.carry[target.resourceType] > 0 && _.sum(creep.carry) === creep.carryCapacity);
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
