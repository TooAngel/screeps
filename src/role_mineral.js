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

/**
 * fillLabWithEnergy
 *
 * @param {object} creep
 * @param {object} config
 * @return {boolean}
 */
function fillLabWithEnergy(creep, config) {
  const lab = Game.getObjectById(config.lab);
  if (!lab) {
    return false;
  }
  if (lab.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    return false;
  }
  if (creep.carry.energy > 0) {
    creep.moveToMy(lab.pos);
    creep.transfer(lab, RESOURCE_ENERGY);
    return true;
  } else {
    creep.moveToMy(creep.room.storage.pos);
    if (_.sum(creep.store) > 0) {
      for (const resource of Object.keys(creep.store)) {
        creep.transfer(creep.room.storage, resource);
      }
    }
    creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
    return true;
  }
}

/**
 * cleanupLab
 *
 * @param {object} creep
 * @param {object} config
 * @return {boolean}
 */
function cleanupLab(creep, config) {
  const lab = Game.getObjectById(config.lab);
  for (const mineral of Object.keys(lab.store)) {
    if (config.resources.includes(mineral)) {
      continue;
    }
    if (mineral === RESOURCE_ENERGY) {
      continue;
    }
    console.log(mineral, lab.store[mineral], creep.store.getUsedCapacity());
    if (creep.store.getUsedCapacity(mineral) > 0) {
      creep.moveToMy(creep.room.terminal.pos);
      creep.transfer(creep.room.terminal, mineral);
      return true;
    }
    creep.moveToMy(lab.pos);
    creep.withdraw(lab, mineral);
    return true;
  }

  return false;
}

/**
 * bringBoostMineralsToLab
 * @param {object} creep
 * @param {object} config
 * @param {object} lab
 * @return {boolean}
 */
function bringBoostMineralsToLab(creep, config, lab) {
  for (const mineral of Object.keys(creep.store)) {
    if (!config.resources.includes(mineral)) {
      continue;
    }
    if (creep.store.getUsedCapacity() > 0) {
      creep.moveToMy(lab.pos);
      creep.transfer(lab, mineral);
      return true;
    }
  }
}

/**
 * getBoostMineralsFromTerminal
 *
 * @param {object} creep
 * @param {object} config
 * @return {boolean}
 */
function getBoostMineralsFromTerminal(creep, config) {
  for (const mineral of Object.keys(creep.room.terminal.store)) {
    if (!config.resources.includes(mineral)) {
      continue;
    }

    creep.room.debugLog('boosts', `fill with mineral`);
    creep.moveToMy(creep.room.terminal.pos);
    creep.withdraw(creep.room.terminal, mineral);
    return true;
  }
}

/**
 * checkForFullLab
 *
 * @param {object} creep
 * @param {object} config
 * @param {object} lab
 * @return {boolean}
 */
function checkForFullLab(creep, config, lab) {
  if (lab.store.getFreeCapacity() === 0) {
    creep.room.debugLog('boosts', `done`);
    config.done = true;
    return true;
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
  for (const creepName of Object.keys(creep.room.memory.boosts)) {
    const config = creep.room.memory.boosts[creepName];
    if (config.time + 1500 < Game.time) {
      creep.room.debugLog('boosts', `Deleting old config ${JSON.stringify(config)}`);
      delete creep.room.memory.boosts[creepName];
      continue;
    }
    if (config.done) {
      continue;
    }
    if (!config.lab) {
      config.lab = creep.room.findLabs()[0].id;
      creep.room.debugLog('boosts', `Lab choosen`);
    }

    if (cleanupLab(creep, config)) {
      creep.room.debugLog('boosts', `cleanupLab`);
      return true;
    }

    if (fillLabWithEnergy(creep, config)) {
      creep.room.debugLog('boosts', `fillLabWithEnergy`);
      return true;
    }

    const lab = Game.getObjectById(config.lab);
    if (!lab) {
      delete config.lab;
      return false;
    }
    if (checkForFullLab(creep, config, lab)) {
      return false;
    }

    if (bringBoostMineralsToLab(creep, config, lab)) {
      return true;
    }

    if (getBoostMineralsFromTerminal(creep, config)) {
      return true;
    }

    config.done = true;
  }
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

/**
 * setStateFillTowers
 *
 * @param {object} creep
 * @return {bool}
 */
function setStateFillTowers(creep) {
  const towers = creep.room.findTowers();
  const fillableTower = towers.find((tower) => tower.store.getFreeCapacity(RESOURCE_ENERGY) > creep.store.getCapacity());
  if (!fillableTower) {
    return false;
  }
  creep.data.state = {
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
 * @return {bool}
 */
function setStateFillTerminalEnergy(creep) {
  if (creep.room.terminal.store.energy > config.terminal.minEnergyAmount) {
    return false;
  }
  creep.data.state = {
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
 * @return {bool}
 */
function setStateGetEnergyFromTerminal(creep) {
  if (creep.room.terminal.store.energy < config.terminal.maxEnergyAmount) {
    return false;
  }
  creep.data.state = {
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
 * @return {bool}
 */
function setStateEmptyCreepStore(creep) {
  if (creep.store.getUsedCapacity() === 0) {
    return false;
  }
  creep.data.state = {
    action: 'empty',
  };
  return true;
}

/**
 * setStateFillLabsWithEnergy
 *
 * @param {object} creep
 * @return {bool}
 */
function setStateFillLabsWithEnergy(creep) {
  const labs = creep.room.findLabs();
  const fillableLab = labs.find((lab) => lab.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
  if (!fillableLab) {
    return false;
  }
  creep.data.state = {
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
 * @return {bool}
 */
function setStateTransferResourcesToTerminal(creep) {
  if (!Object.keys(creep.room.storage.store).find((resource) => resource !== RESOURCE_ENERGY)) {
    return false;
  }
  creep.data.state = {
    getResource: (storage) => Object.keys(storage.store).find((resource) => resource !== RESOURCE_ENERGY),
    source: creep.room.storage.id,
    target: creep.room.terminal.id,
    action: 'transfer',
  };
  return true;
}

/**
 * setStatePrepareReactionLab1WithResource
 *
 * @param {object} creep
 * @return {bool}
 */
function setStatePrepareReactionLab1WithResource(creep) {
  const reaction = creep.room.memory.reaction;
  if (!reaction) {
    return false;
  }
  const lab = Game.getObjectById(reaction.labs[1]);
  if (lab.store[reaction.result.first] > lab.store.getCapacity(reaction.result.first) / 2) {
    return false;
  }
  creep.data.state = {
    getResource: (object) => Object.keys(object.store).find((resource) => resource === reaction.result.first),
    source: creep.room.terminal.id,
    target: lab.id,
    action: 'transfer',
  };
  creep.log('setStatePrepareReactionLab1WithResource');
  return true;
}


/**
 * setStatePrepareReactionLab2WithResource
 *
 * @param {object} creep
 * @return {bool}
 */
function setStatePrepareReactionLab2WithResource(creep) {
  const reaction = creep.room.memory.reaction;
  if (!reaction) {
    return false;
  }
  const lab = Game.getObjectById(reaction.labs[2]);
  if (lab.store[reaction.result.second] > lab.store.getCapacity(reaction.result.second) / 2) {
    return false;
  }
  creep.data.state = {
    getResource: (object) => Object.keys(object.store).find((resource) => resource === reaction.result.second),
    source: creep.room.terminal.id,
    target: lab.id,
    action: 'transfer',
  };
  creep.log('setStatePrepareReactionLab2WithResource');
  return true;
}

/**
 * setStateEmptyReactionResultLab
 *
 * @param {object} creep
 * @return {bool}
 */
function setStateEmptyReactionResultLab(creep) {
  const reaction = creep.room.memory.reaction;
  if (!reaction) {
    return false;
  }
  const lab = Game.getObjectById(reaction.labs[0]);
  if (lab.mineralAmount < creep.store.getCapacity()) {
    return false;
  }
  creep.data.state = {
    getResource: (object) => Object.keys(object.store).find((resource) => resource !== RESOURCE_ENERGY),
    source: lab.id,
    target: creep.room.terminal.id,
    action: 'transfer',
  };
  creep.log('setStateEmptyReactionResultLab');
  return true;
}

/**
 * setState
 *
 * @param {object} creep
 * @return {bool}
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
  if (setStatePrepareReactionLab1WithResource(creep)) {
    return true;
  }
  if (setStatePrepareReactionLab2WithResource(creep)) {
    return true;
  }
  if (setStateEmptyReactionResultLab(creep)) {
    return true;
  }
  return false;
}

/**
 * handleState
 *
 * @param {object} creep
 * @return {bool}
 */
function handleState(creep) {
  if (!creep.data.state) {
    if (!setState(creep)) {
      return false;
    }
    creep.log(`Set state: ${JSON.stringify(creep.data.state)}`);
  }
  if (creep.data.state.action === 'empty') {
    creep.moveToMy(creep.room.storage.pos);
    creep.transfer(creep.room.storage, Object.keys(creep.store)[0]);
    if (creep.store.getUsedCapacity() === 0) {
      delete creep.data.state;
    }
  } else if (creep.data.state.action === 'transfer') {
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
      creep.withdraw(source, resource);
    }
  }
  creep.say('new state');
  return true;
}

roles.mineral.action = function(creep) {
  creep.say('mineral');
  // creep.log(`mineral: ${JSON.stringify(creep.data.state)}`);

  if (creep.room.memory.boosts && Object.keys(creep.room.memory.boosts).length > 0) {
    if (prepareBoost(creep)) {
      return true;
    }
  }

  if (handleState(creep)) {
    return true;
  }
  if (checkNuke(creep)) {
    return true;
  }
  // creep.log(`End of handling: boosts: ${JSON.stringify(creep.room.memory.boosts)} reaction: ${JSON.stringify(creep.room.memory.reaction)}`);
  // creep.memory.recycle = true;
  // creep.room.data.mineralLastRecyled = Game.time;
  creep.moveRandom();
  return true;
};
