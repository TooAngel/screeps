'use strict';

/*
 * mineral manages the mineral distributions
 *
 * Checks for room reactions and transfers mineral to the associated labs
 * Checks for boost request and transfers mineral to the associated labs
 * Fills the labs with energy
 */

// TODO rename to `distributor` or something like that
roles.mineral = {};
roles.mineral.settings = {
  layoutString: 'MC',
  amount: [2, 2],
  maxLayoutAmount: 10,

};


const states = [{
  name: 'storage result',
  destination: STRUCTURE_TERMINAL,
  action: transfer,
  resource: 'result',
}, {
  name: 'terminal 0',
  destination: STRUCTURE_TERMINAL,
  action: get,
  resource: 'first',
}, {
  name: 'terminal 1',
  destination: STRUCTURE_TERMINAL,
  action: get,
  resource: 'second',
}, {
  name: 'lab 1',
  destination: STRUCTURE_LAB,
  lab: 1,
  action: transfer,
  resource: 'first',
}, {
  name: 'lab 2',
  destination: STRUCTURE_LAB,
  lab: 2,
  action: transfer,
  resource: 'second',
}, {
  name: 'storage energy',
  destination: STRUCTURE_TERMINAL,
  action: get,
  resource: 'energy',
}, {
  name: 'lab 1',
  destination: STRUCTURE_LAB,
  lab: 1,
  action: transfer,
  resource: 'energy',
}, {
  name: 'lab 2',
  destination: STRUCTURE_LAB,
  lab: 2,
  action: transfer,
  resource: 'energy',
}, {
  name: 'lab result1',
  destination: STRUCTURE_LAB,
  lab: 0,
  action: get,
  resource: 'result',
}];

/**
 * Increases the state
 *
 * @param {object} creep - the creep to increase the state
 */
function nextState(creep) {
  creep.memory.state = (creep.memory.state + 1) % states.length;
}


/**
 * getFullCapacity - Transfers on full energy
 *
 * @param {object} creep - The creep to interact with.
 * @param {object} target - The target to get the resource from.
 * @param {string} resource - The resource to get.
 * @return {boolean} If it was an success
 */
function getFullCapacity(creep, target, resource) {
  if (_.sum(creep.carry) === creep.carryCapacity) {
    if (target instanceof StructureTerminal) {
      if (creep.pos.isNearTo(target)) {
        for (const res of Object.keys(creep.carry)) {
          if (res !== resource) {
            creep.transfer(target, res);
          }
        }
      }
    } else {
      if (config.debug.mineral) {
        creep.log('next state no capacity' + target);
      }
      nextState(creep);
    }
    return true;
  }
}

const getAmount = function(creep, target, resource) {
  let amount = 0;
  if (target instanceof StructureTerminal) {
    if (resource === 'energy') {
      amount = Math.min(target.store[resource], creep.carryCapacity - _.sum(creep.carry));
    } else {
      amount = Math.min(target.store[resource], creep.carryCapacity / 2);
    }
  }

  if (target instanceof StructureLab) {
    amount = Math.min(target.mineralAmount, creep.carryCapacity - _.sum(creep.carry));
  }
  return amount;
};

const handleWithdrawResponse = function(creep, target, resource, amount, returnCode) {
  if (target instanceof StructureStorage) {
    if (config.debug.mineral) {
      creep.log('creep.Withdraw: ' + returnCode + ' ' + target + ' ' + resource + ' ' + amount);
    }
  }
  if (returnCode === OK || returnCode === ERR_FULL || returnCode === ERR_NOT_ENOUGH_RESOURCES) {
    if (config.debug.mineral) {
      creep.log('next state transfer ok: ' + returnCode + ' ' + target);
    }
    nextState(creep);
    return true;
  }
  if (returnCode === ERR_NOT_IN_RANGE) {
    return true;
  }
  if (returnCode === ERR_INVALID_ARGS) {
    delete creep.room.memory.reaction;
    return false;
  }
  creep.log('get: ' + returnCode + ' target: ' + target + ' resource: ' + resource + ' amount: ' + amount);
  creep.log(target.mineralAmount + ' ' + (creep.carryCapacity - _.sum(creep.carry)));
  delete creep.data.mode;
  delete creep.data.state;
  return false;
};


/**
 * Get a resource from a target
 *
 * @param {object} creep - The creep to interact with.
 * @param {object} target - The target to get the resource from.
 * @param {string} resource - The resource to get.
 * @return {boolean} If it was an success
 */
function get(creep, target, resource) {
  if (getFullCapacity(creep, target, resource)) {
    return false;
  }

  if (creep.carry[resource]) {
    if (config.debug.mineral) {
      creep.log('next state already carrying' + target);
    }
    nextState(creep);
    return false;
  }

  if (target instanceof StructureTerminal && !target.store[resource]) {
    if (config.debug.mineral) {
      creep.log('next state terminal no resource' + target);
    }
    nextState(creep);
    return false;
  }

  if (target instanceof StructureLab && target.mineralAmount === 0) {
    if (config.debug.mineral) {
      creep.log('next state lab no mineral' + target);
    }
    nextState(creep);
    return false;
  }

  const amount = getAmount(creep, target, resource);

  if (amount === 0) {
    if (config.debug.mineral) {
      creep.log('next state no amount' + target);
    }
    nextState(creep);
    return false;
  }

  const returnCode = creep.withdraw(target, resource, amount);
  return handleWithdrawResponse(creep, target, resource, amount, returnCode);
}


/**
 * Transfers a resource to a target
 *
 * @param {object} creep - The creep to interact with.
 * @param {object} target - The target to transfer the resource to.
 * @param {string} resource - The resource to transfer.
 * @return {boolean} If it was an success
 */
function transfer(creep, target, resource) {
  if (target instanceof StructureTerminal) {
    for (const carryResource in creep.carry) {
      if (carryResource === resource) {
        continue;
      }
      if (creep.carry[carryResource] > 0) {
        creep.transfer(target, carryResource);
        return true;
      }
    }
  }

  if (!creep.carry[resource]) {
    nextState(creep);
    return false;
  }

  const returnCode = creep.transfer(target, resource);
  if (returnCode === OK) {
    nextState(creep);
    return false;
  }
  if (returnCode === ERR_FULL) {
    nextState(creep);
    return false;
  }
  if (returnCode === ERR_NOT_IN_RANGE) {
    return false;
  }
  creep.log('Transfer to: ' + target + 'failed with: ' + returnCode);
  if (returnCode === ERR_INVALID_TARGET) {
    delete creep.data.mode;
    delete creep.data.state;
  }
  return false;
}


/**
 * checkForRecycle
 *
 * @param {object} creep
 * @return {boolean}
 */
function checkForRecycle(creep) {
  if (!creep.room.terminal) {
    creep.memory.recycle = true;
    return true;
  }
  if (creep.ticksToLive < 50 && _.sum(creep.carry) === 0) {
    // early suicide to not waste minerals
    creep.memory.recycle = true;
    return true;
  }
  return false;
}

/**
 * Find lab to cleanup mineral
 *
 * @param {object} creep - The creep to handle.
 * @return {boolean} If a lab was found.
 */
roles.mineral.cleanUpLabs = function(creep) {
  creep.say('cleanup');
  creep.memory.cleanup = creep.memory.cleanup || 0;
  // if 2 / 3 of the creep live time is cleanup stop spawning them for 10000 ticks
  if (creep.memory.cleanup++ > 1000) {
    creep.room.memory.cleanup = creep.room.memory.cleanup || 0;
    creep.room.memory.cleanup += 1;
  }
  if (creep.memory.cleanup > 1100) {
    creep.memory.recycle = true;
  }
  if (_.sum(creep.carry) > 0) {
    creep.moveToMy(creep.room.terminal.pos);

    for (const resource in creep.carry) {
      if (creep.carry[resource] === 0) {
        continue;
      }
      creep.transfer(creep.room.terminal, resource);
      break;
    }
  } else {
    const lab = creep.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], {
      filter: (lab) => lab.mineralAmount > 0,
    });
    if (lab === null) {
      // Nothing to do?
      creep.moveRandom();
      return false;
    }
    creep.moveToMy(lab.pos);
    creep.withdraw(lab, lab.mineralType);
  }
};

/**
 * updateStateWithFullLab
 *
 * When fullLab equals 1
 * update creep state based on carrying resources
 * @param {object} creep
 */
function updateStateWithFullLab(creep) {
  if (creep.room.memory.fullLab === 1) {
    if (_.sum(creep.carry) > 0) {
      creep.memory.state = 0;
    }
    if (_.sum(creep.carry) === 0) {
      creep.memory.state = 8;
    }
  }
}

/**
 * Check if a lab needs to be prepared for boosting
 *
 * @param {object} creep - The creep to interact with.
 * @return {boolean} If a boost action is necessary
 */
function checkBoostAction(creep) {
  if (creep.memory.boostAction) {
    return true;
  }
  const room = Game.rooms[creep.room.name];
  let mineral;
  const labForMineral = (lab) => lab.mineralType === mineral;
  const labEmpty = (object) => !object.mineralType || object.mineralType === null;

  for (mineral of Object.keys(room.memory.boosting)) {
    let labs = room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], {
      filter: labForMineral,
    });
    if (labs.length > 0) {
      if (labs[0].mineralAmount === labs[0].mineralsCapacity) {
        if (labs[0].energy === labs[0].energyCapacity) {
          continue;
        }
      }
      creep.memory.boostAction = {mineral: mineral, lab: labs[0].id};
      return true;
    }

    labs = room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], {
      filter: labEmpty,
    });
    if (labs.length > 0) {
      creep.memory.boostAction = {
        mineral: mineral,
        lab: labs[0].id,
      };
      return true;
    }
    if (config.debug.mineral) {
      creep.log('No free labs');
    }
  }
  return false;
}


/**
 * Prepare a lab for boosting
 *
 * @param {object} creep - The creep to interact withdraw.
 * @return {boolean} If the creep can work on the boosting.
 */
function prepareBoost(creep) {
  if (!checkBoostAction(creep)) {
    return false;
  }

  creep.say('A3');

  const lab = Game.getObjectById(creep.memory.boostAction.lab);
  if (!lab) {
    return false;
  }
  if (lab.energy < lab.energyCapacity) {
    creep.say('boost');
    if (creep.carry.energy > 0) {
      creep.moveToMy(lab.pos);
      creep.transfer(lab, RESOURCE_ENERGY);
      return true;
    } else {
      creep.moveToMy(creep.room.storage.pos);

      if (_.sum(creep.carry) > 0) {
        for (const resource of Object.keys(creep.carry)) {
          creep.transfer(creep.room.storage, resource);
        }
      }
      creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
      return true;
    }
  }

  if (lab.mineralAmount < lab.mineralCapacity) {
    creep.say('mineral');
    if (creep.carry[creep.memory.boostAction.mineral] > 0) {
      creep.moveToMy(lab.pos);

      creep.transfer(lab, creep.memory.boostAction.mineral);
      return true;
    } else {
      if (!creep.room.terminal.store[creep.memory.boostAction.mineral]) {
        if (config.debug.mineral) {
          creep.log('For boosting ' + creep.memory.boostAction.mineral + ' not available');
        }
        return false;
      }

      creep.moveToMy(creep.room.terminal.pos);

      creep.withdraw(creep.room.terminal, creep.memory.boostAction.mineral);
      return true;
    }
  }
  creep.say('delete');
  delete creep.memory.boostAction;
  return false;
}

/**
 * Check if ghodium can be transferred to a nuker
 *
 * @param {object} creep - The creep to fill the nuker
 * @return {boolean} If the resource and nuker are available
 */
function checkNuke(creep) {
  if (creep.room.terminal.store[RESOURCE_GHODIUM] > 500 || creep.carry[RESOURCE_GHODIUM]) {
    const nukers = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_NUKER]);
    if (nukers.length > 0) {
      const nuker = nukers[0];
      if (nuker.ghodium < nuker.ghodiumCapacity) {
        if (creep.carry[RESOURCE_GHODIUM] > 0) {
          creep.moveToMy(nuker.pos);
          creep.transfer(nuker, RESOURCE_GHODIUM);
        } else {
          creep.moveToMy(creep.room.terminal.pos);

          creep.withdraw(creep.room.terminal, RESOURCE_GHODIUM);
        }
        return true;
      }
    }
  }
  return false;
}

const execute = function(creep) {
  if (checkForRecycle(creep)) {
    return false;
  }

  const room = Game.rooms[creep.room.name];

  updateStateWithFullLab(creep);

  if (room.memory.boosting && Object.keys(room.memory.boosting).length > 0) {
    if (prepareBoost(creep)) {
      return true;
    }
  }

  if (checkNuke(creep)) {
    return true;
  }

  creep.memory.state = creep.memory.state || 0;

  if (!room.memory.reaction) {
    creep.say('cleanUpLabs');
    roles.mineral.cleanUpLabs(creep);
    creep.room.reactionsWithoutReaction();
    return true;
  }

  const state = states[creep.memory.state];

  let target = creep.room.terminal;
  if (state.destination === STRUCTURE_LAB) {
    target = Game.getObjectById(room.memory.reaction.labs[state.lab]);
  } else if (state.destination === STRUCTURE_STORAGE) {
    target = creep.room.storage;
  }
  creep.creepLog('target', target, target.structureType);
  creep.moveToMy(target.pos);

  let resource = RESOURCE_ENERGY;
  if (state.resouce !== 'energy') {
    resource = room.memory.reaction.result[state.resource];
  }

  state.action(creep, target, resource);
  creep.room.memory.cleanup = 0;

  return true;
};

// ---------------------- NEW -------------------------

/**
 * setStateFillTowers
 *
 * @param {object} creep
 * @return {boolean}
 */
function setStateFillTowers(creep) {
  const towers = creep.room.findTowers();
  const fillableTower = towers.find((tower) => tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
  if (!fillableTower) {
    return false;
  }
  creep.data.state = {
    name: 'FillTowers',
    getResource: () => RESOURCE_ENERGY,
    source: creep.room.storage.id,
    target: fillableTower.id,
    action: 'transfer',
  };
  return true;
}

/**
 * setStateFillTerminalEnergy
 *
 * @param {object} creep
 * @return {boolean}
 */
function setStateFillTerminalEnergy(creep) {
  if (creep.room.terminal && creep.room.terminal.store.energy > config.terminal.minEnergyAmount) {
    return false;
  }
  creep.data.state = {
    name: 'FillTerminalNrg',
    getResource: () => RESOURCE_ENERGY,
    source: creep.room.storage.id,
    target: creep.room.terminal.id,
    action: 'transfer',
  };
  return true;
}

/**
 * setStateGetEnergyFromTerminal
 *
 * @param {object} creep
 * @return {boolean}
 */
function setStateGetEnergyFromTerminal(creep) {
  if (creep.room.terminal.store.energy < config.terminal.maxEnergyAmount) {
    return false;
  }
  creep.data.state = {
    name: 'NrgFromTerminal',
    getResource: () => RESOURCE_ENERGY,
    source: creep.room.terminal.id,
    target: creep.room.storage.id,
    action: 'transfer',
  };
  return true;
}


/**
 * setStateEmptyCreepStore
 *
 * @param {object} creep
 * @return {boolean}
 */
function setStateEmptyCreepStore(creep) {
  if (creep.store.getUsedCapacity() === 0) {
    return false;
  }
  const targetId = _.sum(creep.room.terminal.store) > _.sum(creep.room.storage.store) ? creep.room.storage.id : creep.room.terminal.id;
  creep.data.state = {
    name: 'EmptyCreepStore',
    getResource: () => RESOURCE_ENERGY,
    source: creep.id,
    target: targetId,
    action: 'transfer',
  };
  return true;
}

/**
 * setStateFillLabsWithEnergy
 *
 * @param {object} creep
 * @return {boolean}
 */
function setStateFillLabsWithEnergy(creep) {
  const labs = creep.room.findLabs();
  const fillableLab = labs.find((lab) => lab.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
  if (!fillableLab) {
    return false;
  }
  creep.data.state = {
    name: 'FillLabsWithNrg',
    getResource: () => RESOURCE_ENERGY,
    source: creep.room.storage.id,
    target: fillableLab.id,
    action: 'transfer',
  };
  return true;
}

/**
 * setStateTransferResourcesToTerminal
 *
 * @param {object} creep
 * @return {boolean}
 */
function setStateTransferResourcesToTerminal(creep) {
  if (!Object.keys(creep.room.storage.store).find((resource) => resource !== RESOURCE_ENERGY)) {
    return false;
  }
  creep.data.state = {
    name: 'TransResourcesToTerminal',
    getResource: (storage) => Object.keys(storage.store).find((resource) => resource !== RESOURCE_ENERGY),
    source: creep.room.storage.id,
    target: creep.room.terminal.id,
    action: 'transfer',
  };
  return true;
}

/**
 * setStateClearLabs
 *
 * @param {object} creep
 * @param {boolean} all clear all labs
 * @return {boolean}
 */
function setStateClearLabs(creep, all = true) {
  const labs = creep.room.findLabs();
  let fillableLab;
  if (all) {
    fillableLab = labs.find((s) => _.sum(s.store) > 0 && Object.keys(s.store).find((resource) => resource !== RESOURCE_ENERGY));
  } else {
    let input1 = RESOURCE_ENERGY;
    let input2 = RESOURCE_ENERGY;
    if (creep.room.memory.reaction && creep.room.memory.reaction.result) {
      input1 = creep.room.memory.reaction.result.first || RESOURCE_ENERGY;
      input2 = creep.room.memory.reaction.result.second || RESOURCE_ENERGY;
    }
    const filterNonNeededResourcesInLab = (lab) => Object.keys(lab.store).find((resource) => resource !== RESOURCE_ENERGY && resource !== input1 && resource !== input2);
    fillableLab = labs.find(filterNonNeededResourcesInLab);
  }
  if (!fillableLab) {
    return false;
  }

  creep.data.state = {
    name: 'ClearLabs',
    getResource: (lab) => Object.keys(lab.store).find((resource) => resource !== RESOURCE_ENERGY),
    source: fillableLab.id,
    target: creep.room.terminal.id,
    action: 'transfer',
  };
  return true;
}

/**
 * setState
 * todo: add actions form old exec
 *
 * @param {object} creep
 * @return {boolean}
 */
function setState(creep) {
  if (setStateEmptyCreepStore(creep)) {
    return true;
  }
  if (setStateFillTowers(creep)) {
    return true;
  }
  if (setStateFillTerminalEnergy(creep)) {
    return true;
  }
  if (setStateFillLabsWithEnergy(creep)) {
    return true;
  }
  if (setStateGetEnergyFromTerminal(creep)) {
    return true;
  }
  if (setStateTransferResourcesToTerminal(creep)) {
    return true;
  }
  if (setStateClearLabs(creep)) {
    return true;
  }
  return false;
}

/**
 * handleState
 *
 * @param {object} creep
 * @return {boolean}
 */
function handleState(creep) {
  if (!creep.data.state) {
    if (!setState(creep)) {
      return false;
    }
    creep.log(`Set state: ${JSON.stringify(creep.data.state)}`);
  }

  if (creep.data.state.action === 'transfer') {
    if (creep.store.getUsedCapacity() > 0) {
      const target = Game.getObjectById(creep.data.state.target);
      creep.moveToMy(target.pos);
      const response = creep.transfer(target, Object.keys(creep.store)[0]);
      if (response === OK) {
        delete creep.data.state;
      }
    } else {
      const source = Game.getObjectById(creep.data.state.source);
      creep.moveToMy(source.pos);
      const resource = creep.data.state.getResource(source);
      if (resource) {
        creep.withdraw(source, resource);
      } else if (typeof resource === 'undefined') {
        delete creep.data.state;
      }
    }
  }
  if (creep.data.state && creep.data.state.name) {
    creep.say(creep.data.state.name);
  }
  return true;
}

roles.mineral.preMove = function(creep) {
  creep.pickupWhileMoving();
};

roles.mineral.action = function(creep) {
  if (!creep.room.isRoomReadyForMineralHandling()) {
    creep.memory.recycle = true;
    creep.room.data.mineralLastRecyled = Game.time;
  }

  if (creep.ticksToLive < 50) {
    creep.memory.recycle = true;
    creep.room.data.mineralLastRecyled = Game.time;
  }

  if (typeof creep.data.mode === 'undefined') {
    creep.data.mode = true;
  }

  if (creep.data.mode) {
    if (handleState(creep)) {
      return true;
    } else {
      creep.data.mode = false;
      return true;
    }
  } else {
    creep.say('old exec');
    const execRes = execute(creep);
    if (!execRes) {
      creep.data.mode = true;
      return false;
    }
    return true;
  }
};
