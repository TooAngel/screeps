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

const transferOrWithdraw = function(creep, option, powerSpawn) {
  let returnCode = false;
  let resource;
  let structur;

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
      structur = STRUCTURE_TERMINAL;
    } else if (creep.room.storage.store[resource] > 0) {
      structur = STRUCTURE_STORAGE;
    }
    returnCode = creep.withdraw(creep.room[structur], resource);
  }
  return returnCode;
};

// todo-msc can we simplyfy this? check both resources (power, energy) and termiinal and storage
roles.storagefiller.movePowerAndEnergy = function(creep) {
  if (!creep.room.memory.constants) {
    // After deleting room memory this fails
    return false;
  }
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
      const returnCode = transferOrWithdraw(creep, option, powerSpawn);

      if (returnCode === OK) {
        return true;
      }
    }
  }

  return false;
};

roles.storagefiller.memoryCleanup = function(creep) {
  if (!creep.memory.routing.targetId && creep.memory.routing.reached) {
    creep.log('role_storagefiller.memoryCleanup - targetId is missing and target is reached, why?');
    creep.memory.routing.reached = false;
    creep.memory.routing.targetId = 'filler';
  }
  if (creep.memory.routing.reached && creep.memory.routing.pathPos === 0) {
    creep.log('role_storagefiller.memoryCleanup - reached but pathPos === 0, why? why is this a problem?');
    creep.memory.routing.reached = false;
  }
};

/**
 * transferMinerals - transfers non energy or power resources
 *
 * @param {object} creep - The creep
 * @return {boolean} If this was successful
 **/
function transferMinerals(creep) {
  for (const resourceType of Object.keys(creep.carry)) {
    if (resourceType !== RESOURCE_ENERGY && resourceType !== RESOURCE_POWER) {
      const structureToStore = roles.storagefiller.checkResourceStore(creep, resourceType);
      const returnCode = creep.transfer(creep.room[structureToStore], resourceType);
      if (returnCode === OK) {
        return true;
      }
    }
  }
  return false;
}

/**
 * transferEnergyToTower - transfers energy to the tower
 *
 * @param {object} creep - The creep
 * @param {list} towers - The towers
 * @return {void}
 **/
function transferEnergyToTower(creep, towers) {
  for (const tower of towers) {
    const returnCode = creep.transfer(tower, RESOURCE_ENERGY);
    if (returnCode === OK) {
      return true;
    }
  }
}

/**
 * checkForLink - Checks if there is a link close by
 *
 * @param {object} creep - The creep
 * @return {boolean} - If no link was found
 **/
function checkForLink(creep) {
  if (!creep.memory.link) {
    const links = creep.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 1, 'structureType', [STRUCTURE_LINK]);
    if (links.length === 0) {
      return true;
    }
    creep.memory.link = links[0].id;
  }
}


/**
 * underAttack - If the room is under attack fill the tower
 *
 * @param {object} creep - The creep
 * @param {list} towers - The towers
 * @param {object} storage - The storage
 * @param {object} link - The link
 * @return {void}
 **/
function underAttackFillTower(creep, towers, storage) {
  const room = Game.rooms[creep.room.name];
  if (room.memory.attackTimer > 50) {
    creep.creepLog(`underAttackFillTower ${room.memory.attackTimer}`);
    // TODO could also make sense from the link, if available
    creep.withdraw(storage, RESOURCE_ENERGY);
    for (const tower of towers) {
      const returnCode = creep.transfer(tower, RESOURCE_ENERGY);
      if (returnCode === OK) {
        return true;
      }
    }
  }
  return false;
}

/**
 * pickupDroppedResources - Picks up dropped resources
 *
 * @param {object} creep - The creep
 * @return {boolean} - Resources were picked up
 **/
function pickupDroppedResources(creep) {
  const resources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
  if (resources.length > 0) {
    const returnCode = creep.pickup(resources[0]);
    if (returnCode === OK) {
      return true;
    }
  }
}

/**
 * getEnergyFromTerminal - Withdraws energy from terminal
 *
 * @param {object} creep - The creep
 * @return {void}
 **/
function getEnergyFromTerminal(creep) {
  if (creep.room.terminal &&
    ((creep.room.terminal.store.energy > config.terminal.minEnergyAmount + creep.carryCapacity) ||
    (creep.room.storage.store.energy < creep.room.terminal.store.energy))
  ) {
    if (creep.carry.energy === 0) {
      creep.withdraw(creep.room[STRUCTURE_TERMINAL], RESOURCE_ENERGY);
    } else {
      creep.transfer(creep.room[STRUCTURE_STORAGE], RESOURCE_ENERGY);
    }
  }
}

/**
 * withDrawFromStorageOrTerminal - Withdraws energy from storage or terminal
 *
 * @param {object} creep - The creep
 * @return {boolean} - Success
 **/
function withDrawFromStorageOrTerminal(creep) {
  // todo-msc if (creep.room.storage.store.energy < creep.room.terminal.store.energy) then
  // todo-msc move energy from terminal to storage
  if (creep.room.terminal && (
    (creep.room.storage.store.energy < creep.room.terminal.store.energy) ||
    (creep.pos.getRangeTo(creep.room.terminal.pos) > 1))
  ) {
    if (creep.room.storage) {
      for (const resourceType of creep.room.getResourcesFrom(STRUCTURE_STORAGE).reverse()) {
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
      for (const resourceType of creep.room.getResourcesFrom(STRUCTURE_TERMINAL)) {
        const structureToMove = roles.storagefiller.checkResourceStore(creep, resourceType, true);
        if (structureToMove && structureToMove !== STRUCTURE_TERMINAL && resourceType !== RESOURCE_POWER && creep.room[STRUCTURE_TERMINAL].store[RESOURCE_POWER] > 200) {
          const returnCode = creep.withdraw(creep.room[STRUCTURE_TERMINAL], resourceType);
          if (returnCode === OK) {
            return true;
          }
        }
      }
    }
  }
}

roles.storagefiller.action = function(creep) {
  roles.storagefiller.memoryCleanup(creep);

  creep.setNextSpawn();
  creep.spawnReplacement(1);
  creep.pickupEnergy();

  // todo-msc move power and energy to power spawn
  if (roles.storagefiller.movePowerAndEnergy(creep)) {
    return true;
  }

  if (transferMinerals(creep)) {
    return true;
  }

  const towers = creep.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 1, 'structureType', [STRUCTURE_TOWER], {
    filter: (tower) => tower.energy <= 0.5 * tower.energyCapacity,
  });

  const storage = creep.room.storage;
  if (underAttackFillTower(creep, towers, storage)) {
    return true;
  }

  if (checkForLink(creep)) {
    return true;
  }

  const link = Game.getObjectById(creep.memory.link);
  if (link === null) {
    delete creep.memory.link;
    return true;
  }

  const room = Game.rooms[creep.room.name];
  if (room.memory.attackTimer > 50) {
    creep.transfer(link, RESOURCE_ENERGY);
  }

  if (creep.withdraw(link, RESOURCE_ENERGY) === OK) {
    return true;
  }

  if (transferEnergyToTower(creep, towers)) {
    return true;
  }

  if (pickupDroppedResources(creep)) {
    return true;
  }

  for (const resourceType of Object.keys(creep.carry)) {
    const structureToStore = roles.storagefiller.checkResourceStore(creep, resourceType);
    const returnCode = creep.transfer(creep.room[structureToStore], resourceType);
    if (returnCode === OK) {
      return true;
    }
  }

  getEnergyFromTerminal(creep);

  withDrawFromStorageOrTerminal(creep);

  return true;
};
