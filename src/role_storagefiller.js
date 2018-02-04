'use strict';

/*
 * storagefiller should be present on RCL > 4
 *
 * Normal:
 * Gets the energy from the link and transfers it to the tower of storage
 *
 * Under attack:
 * Gets the energy from the storage and transfers it to the link
 */

roles.storagefiller = {};
roles.storagefiller.killPrevious = true;

roles.storagefiller.settings = {
  layoutString: 'MC',
  amount: [1, 4],
  maxLayoutAmount: 1,
};

roles.storagefiller.checkEnergyStore = function(creep, withdraw = false) {
  if (!creep.room.terminal) {
    return STRUCTURE_STORAGE;
  }
  if (creep.room.storage.store.energy < config.terminal.storageMinEnergyAmount) {
    return STRUCTURE_STORAGE;
  }
  if (creep.room.terminal.store.energy > config.terminal.maxEnergyAmount) {
    return STRUCTURE_STORAGE;
  }
  if (creep.room.terminal.store.energy < config.terminal.minEnergyAmount) {
    if (withdraw && creep.room.storage.store.energy - creep.carryCapacity < config.terminal.storageMinEnergyAmount) {
      return;
    }
    return STRUCTURE_TERMINAL;
  }
  if (!withdraw) {
    return STRUCTURE_STORAGE;
  }
};

roles.storagefiller.checkResourceStore = function(creep, resourceType, withdraw = false) {
  if (!creep.room.terminal) {
    return STRUCTURE_STORAGE;
  }
  if (creep.pos.getRangeTo(creep.room.terminal.pos) > 1) {
    return STRUCTURE_STORAGE;
  }
  if (resourceType === RESOURCE_ENERGY) {
    return roles.storagefiller.checkEnergyStore(creep, withdraw);
  }
  if (resourceType === RESOURCE_POWER) {
    return STRUCTURE_STORAGE;
  }
  if (creep.room.getMineralType() === resourceType) {
    return STRUCTURE_TERMINAL;
  }

  if (!creep.room.terminal.store[resourceType]) {
    return STRUCTURE_TERMINAL;
  }

  if (creep.room.terminal.store[resourceType] < config.mineral.minAmount) {
    return STRUCTURE_TERMINAL;
  }

  if (creep.room.terminal.store[resourceType] > config.mineral.minAmount * 2 + withdraw * creep.carryCapacity) {
    return STRUCTURE_STORAGE;
  }

  const terminalFreeSpace = creep.room.terminal.storeCapacity - _.sum(creep.room.terminal.store) - Math.max(0, config.terminal.storageMinEnergyAmount - creep.room.terminal.store.energy);
  if (creep.room.terminal.store[resourceType] < terminalFreeSpace - config.mineral.minAmount) {
    if (withdraw && creep.room.terminal.store[resourceType] + creep.carryCapacity > config.mineral.minAmount * 2) {
      return;
    }
    return STRUCTURE_TERMINAL;
  }

  if (!withdraw) {
    return STRUCTURE_STORAGE;
  }
};

// todo-msc can we simplyfy this? check both resources (power, energy) and termiinal and storage
roles.storagefiller.movePowerAndEnergy = function(creep) {
  const powerSpawn = Game.getObjectById(creep.room.memory.constants.powerSpawn);
  if (powerSpawn && creep.room.terminal && creep.room.storage) {
    // todo-msc do we have power at all
    const power = 0 + (creep.room.terminal.store.power || 0) + (creep.room.storage.store.power || 0) + (powerSpawn.power || 0);
    if ((power > 0) &&
      (creep.pos.getRangeTo(powerSpawn.pos) === 1) &&
      (creep.pos.getRangeTo(creep.room.terminal.pos) === 1)
    ) {
      // todo-msc determine what to do
      const option = {
        need: {
          power: powerSpawn.power < 50,
          energy: powerSpawn.energy < 2500,
        },
        carry: {
          sum: _.sum(creep.carry),
          power: creep.carry.power > 0,
          energy: creep.carry.energy > 0,
        },
      };

      if (!option.need.energy && !option.need.power) {
        if (creep.carry.power > 0) {
          creep.transfer(creep.room.storage, RESOURCE_POWER);
          return true;
        }
        return false;
      }
      let returnCode = false;
      let resource;
      let strucktur;
      // put
      if (option.carry.sum > 0) {
        if (option.carry.energy > 0) {
          resource = RESOURCE_ENERGY;
        } else if (option.carry.power > 0) {
          resource = RESOURCE_POWER;
        }
        returnCode = creep.transfer(powerSpawn, resource);
      } else { // pickup
        if (option.need.energy) {
          resource = RESOURCE_ENERGY;
        } else if (option.need.power) {
          resource = RESOURCE_POWER;
        }
        if (creep.room.terminal.store[resource] > 0) {
          strucktur = STRUCTURE_TERMINAL;
        } else if (creep.room.storage.store[resource] > 0) {
          strucktur = STRUCTURE_STORAGE;
        }
        returnCode = creep.withdraw(creep.room[strucktur], resource);
      }

      if (returnCode === OK) {
        return true;
      }
    }
  }

  return false;
};

roles.storagefiller.action = function(creep) {
  if (!creep.memory.routing.targetId && creep.memory.routing.reached) {
    creep.memory.routing.reached = false;
    creep.memory.routing.targetId = 'filler';
  }
  if (creep.memory.routing.reached && creep.memory.routing.pathPos === 0) {
    creep.memory.routing.reached = false;
  }

  creep.setNextSpawn();
  creep.spawnReplacement(1);
  creep.pickupEnergy();

  // todo-msc move power and energy to power spawn
  if (roles.storagefiller.movePowerAndEnergy(creep)) {
    return true;
  }


  for (const resourceType of Object.keys(creep.carry)) {
    if (resourceType !== RESOURCE_ENERGY && resourceType !== RESOURCE_POWER) {
      const structureToStore = roles.storagefiller.checkResourceStore(creep, resourceType);
      const returnCode = creep.transfer(creep.room[structureToStore], resourceType);
      if (returnCode === OK) {
        return true;
      }
    }
  }

  const towers = creep.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 1, 'structureType', [STRUCTURE_TOWER], {
    filter: (tower) => tower.energy <= 0.5 * tower.energyCapacity,
  });

  if (creep.room.controller.level === 4) {
    if (towers.length > 0) {
      if (creep.carry.energy === 0) {
        creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
      } else {
        creep.transfer(towers[0], RESOURCE_ENERGY);
      }
    }
  }

  if (!creep.memory.link) {
    const links = creep.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 1, 'structureType', [STRUCTURE_LINK]);
    if (links.length === 0) {
      return true;
    }
    creep.memory.link = links[0].id;
  }

  const storage = creep.room.storage;
  const link = Game.getObjectById(creep.memory.link);
  if (link === null) {
    delete creep.memory.link;
    return true;
  }

  const room = Game.rooms[creep.room.name];
  if (room.memory.attackTimer > 50 && room.controller.level > 6) {
    creep.withdraw(storage, RESOURCE_ENERGY);
    for (const tower of towers) {
      const returnCode = creep.transfer(tower, RESOURCE_ENERGY);
      if (returnCode === OK) {
        return true;
      }
    }
    creep.transfer(link, RESOURCE_ENERGY);
    return true;
  }

  if (creep.withdraw(link, RESOURCE_ENERGY) === OK) {
    return true;
  }

  for (const tower of towers) {
    const returnCode = creep.transfer(tower, RESOURCE_ENERGY);
    if (returnCode === OK) {
      return true;
    }
  }

  const resources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
  if (resources.length > 0) {
    const returnCode = creep.pickup(resources[0]);
    if (returnCode === OK) {
      return true;
    }
  }

  for (const resourceType of Object.keys(creep.carry)) {
    const structureToStore = roles.storagefiller.checkResourceStore(creep, resourceType);
    const returnCode = creep.transfer(creep.room[structureToStore], resourceType);
    if (returnCode === OK) {
      return true;
    }
  }

  if (creep.room.terminal &&
    (creep.room.storage.store.energy < 20000) &&
    (creep.room.storage.store.energy < creep.room.terminal.store.energy)
  ) {
    if (creep.carry.energy === 0) {
      creep.withdraw(creep.room[STRUCTURE_TERMINAL], RESOURCE_ENERGY);
    } else {
      creep.transfer(creep.room[STRUCTURE_STORAGE], RESOURCE_ENERGY);
    }
  }

  // todo-msc if (creep.room.storage.store.energy < creep.room.terminal.store.energy) then
  // todo-msc move energy from terminal to storage
  if (creep.room.terminal && (
    (creep.room.storage.store.energy < creep.room.terminal.store.energy) ||
    (creep.pos.getRangeTo(creep.room.terminal.pos) > 1))
  ) {
    if (creep.room.storage) {
      for (const resourceType of Object.keys(creep.room[STRUCTURE_STORAGE].store).reverse()) {
        const structureToMove = roles.storagefiller.checkResourceStore(creep, resourceType, true);
        if (structureToMove && structureToMove !== STRUCTURE_STORAGE) {
          const returnCode = creep.withdraw(creep.room[STRUCTURE_STORAGE], resourceType);
          if (returnCode === OK) {
            return true;
          }
        }
      }
    }

    if (creep.room[STRUCTURE_TERMINAL]) {
      for (const resourceType of Object.keys(creep.room[STRUCTURE_TERMINAL].store)) {
        const structureToMove = roles.storagefiller.checkResourceStore(creep, resourceType, true);
        if (structureToMove && structureToMove !== STRUCTURE_TERMINAL) {
          const returnCode = creep.withdraw(creep.room[STRUCTURE_TERMINAL], resourceType);
          if (returnCode === OK) {
            return true;
          }
        }
      }
    }
  }

  return true;
};

roles.storagefiller.execute = function(creep) {
  //  creep.log('Execute called, why?');
  //  creep.log(new Error().stack);
};
