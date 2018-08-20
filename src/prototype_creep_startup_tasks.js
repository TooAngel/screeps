'use strict';

Creep.prototype.upgradeControllerTask = function() {
  this.creepLog('upgradeControllerTask');
  if (this.carry.energy === 0) {
    return false;
  }

  const range = this.pos.getRangeTo(this.room.controller);
  if (range <= 3) {
    const resources = this.pos.findInRangePropertyFilter(FIND_DROPPED_RESOURCES, 10, 'resourceType', [RESOURCE_ENERGY]);
    let resource = false;
    if (resources.length > 0) {
      resource = resources[0];
      this.pickup(resource);
    }
    const returnCode = this.upgradeController(this.room.controller);
    if (returnCode !== OK) {
      this.log('upgradeController: ' + returnCode);
    } else {
      this.upgraderUpdateStats();
    }
    if (resource) {
      this.moveRandomWithin(this.room.controller.pos, 3, resource);
    } else {
      this.moveRandomWithin(this.room.controller.pos);
    }
    return true;
  } else {
    this.moveToMy(this.room.controller.pos, 3);
  }
  return true;
};

Creep.prototype.recycleCreep = function() {
  if (this.memory.role === 'planer') {
    this.room.buildStructures();
  }

  let spawn = this.pos.findClosestByRangePropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (!spawn) {
    spawn = Game.rooms[this.memory.base].findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN])[0];
  }
  if (spawn) {
    if (this.room === spawn.room) {
      this.moveToMy(spawn.pos);
    } else {
      this.moveTo(spawn);
    }
    this.say('recycle');
    spawn.recycleCreep(this);
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
  let hostileStructures = this.room.findPropertyFilter(FIND_HOSTILE_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_RAMPART, STRUCTURE_EXTRACTOR, STRUCTURE_OBSERVER], {
    inverse: true,
    filter: Room.structureHasEnergy,
  });
  if (!hostileStructures.length) {
    return false;
  }

  this.say('hostile');
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

  const range = this.pos.getRangeTo(this.room.storage);
  if (range === 1) {
    this.withdraw(this.room.storage, RESOURCE_ENERGY);
  } else {
    this.moveToMy(this.room.storage.pos, 1);
  }
  return true;
};

Creep.prototype.repairStructure = function() {
  if (this.memory.target) {
    const toRepair = Game.getObjectById(this.memory.target);
    if (!toRepair || toRepair === null) {
      this.say('No target');
      delete this.memory.target;
      return false;
    }

    if (toRepair instanceof ConstructionSite) {
      this.build(toRepair);
      this.moveToMy(toRepair.pos, 3);
      return true;
    } else if (toRepair.hits < 10000 || toRepair.hits < this.memory.step + 10000) {
      this.repair(toRepair);
      if (this.fatigue === 0) {
        const range = this.pos.getRangeTo(toRepair);
        if (range <= 3) {
          this.moveRandomWithin(toRepair);
        } else {
          this.creepLog('repairStructure moveToMy target:', JSON.stringify(toRepair.pos));
          const returnCode = this.moveToMy(toRepair.pos, 3);
          this.memory.lastPosition = this.pos;
          if (returnCode === true) {
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

  const nukes = this.room.find(FIND_NUKES);
  if (nukes.length > 0) {
    const spawns = this.room.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
    if (spawns.length > 0) {
      for (const spawn of spawns) {
        let found = false;
        let rampart;
        const structures = spawn.pos.lookFor(LOOK_STRUCTURES);
        for (const structure of structures) {
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
  const lowRamparts = this.pos.findInRangePropertyFilter(FIND_STRUCTURES, 4, 'structureType', [STRUCTURE_RAMPART], {
    filter: (rampart) => rampart.hits < 10000,
  });

  if (lowRamparts.length > 0) {
    const lowRampart = lowRamparts[0];
    const range = this.pos.getRangeTo(lowRampart);
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
    const range = this.pos.getRangeTo(target);

    if (range <= 3) {
      this.build(target);
      this.memory.step = 0;
      const targetNew = this.pos.findClosestByRangePropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL], {
        filter: (object) => object.id !== target.id,
      });
      if (targetNew !== null) {
        target = targetNew;
      }
    }
    // let ignoreCreepsSwitch = true;
    const lastPos = this.memory.lastPosition;
    if (this.memory.lastPosition && this.pos.isEqualTo(new RoomPosition(lastPos.x, lastPos.y, this.room.name))) {
      this.memory.move_wait++;
      // if (this.memory.move_wait > 5) {
      //   ignoreCreepsSwitch = false;
      // }
    } else {
      this.memory.move_wait = 0;
    }
    this.moveToMy(target.pos, 3);
    this.memory.lastPosition = this.pos;
    this.memory.target = target.id;
    return true;
  }

  const creep = this;
  const structure = this.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL], {
    // Newbie zone walls have no hits
    filter: (object) => object.hits && object.hits < Math.min(creep.memory.step, object.hitsMax),
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
