'use strict';

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
 * Check is a given lab as enough mineral for reaction
 *
 * @param {object} lab - The lab to check.
 * @param {string} mineralType - The mineral type to check.
 * @return {boolean} if the lab has enough of the mineral
 */
Creep.prototype.checkLabEnoughMineral = function(lab, mineralType) {
  if (lab.mineralAmount < LAB_REACTION_AMOUNT && !this.room.terminal.store[mineralType] && !this.carry[mineralType]) {
    if (config.debug.mineral) {
      this.log('Not enough', mineralType, 'stop reaction');
    }
    delete this.room.memory.reaction;
    return false;
  }
  return true;
};

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
      creep.log('creep.withdray: ' + returnCode + ' ' + target + ' ' + resource + ' ' + amount);
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
    return;
  }

  if (creep.carry[resource]) {
    if (config.debug.mineral) {
      creep.log('next state already carrying' + target);
    }
    nextState(creep);
    return;
  }

  if (target instanceof StructureTerminal && !target.store[resource]) {
    if (config.debug.mineral) {
      creep.log('next state terminal no resource' + target);
    }
    nextState(creep);
    return;
  }

  if (target instanceof StructureLab && target.mineralAmount === 0) {
    if (config.debug.mineral) {
      creep.log('next state lab no mineral' + target);
    }
    nextState(creep);
    return;
  }

  const amount = getAmount(creep, target, resource);

  if (amount === 0) {
    if (config.debug.mineral) {
      creep.log('next state no amount' + target);
    }
    nextState(creep);
    return;
  }

  const returnCode = creep.withdraw(target, resource, amount);
  return handleWithdrawResponse(creep, target, resource, amount, returnCode);
}

/**
 * Find lab to cleanup mineral
 *
 * @param {object} creep - The creep to handle.
 * @return {boolean} If a lab was found.
 */
function cleanUpLabs(creep) {
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
    return;
  }

  const returnCode = creep.transfer(target, resource);
  if (returnCode === OK) {
    nextState(creep);
    return;
  }
  if (returnCode === ERR_FULL) {
    nextState(creep);
    return;
  }
  if (returnCode === ERR_NOT_IN_RANGE) {
    return;
  }
  creep.log('Transfer to: ' + target + 'failed with: ' + returnCode);
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

const handleReactions = function(creep, room) {
  const lab0 = Game.getObjectById(room.memory.reaction.labs[0]);
  const lab1 = Game.getObjectById(room.memory.reaction.labs[1]);
  const lab2 = Game.getObjectById(room.memory.reaction.labs[2]);

  if (lab0 === null || lab1 === null || lab2 === null) {
    delete creep.room.memory.reaction;
  } else {
    if (lab0.cooldown === 0) {
      const returnCode = lab0.runReaction(lab1, lab2);
      if (returnCode === ERR_NOT_ENOUGH_RESOURCES) {
        if (!creep.checkLabEnoughMineral(lab1, room.memory.reaction.result.first) || !creep.checkLabEnoughMineral(lab2, room.memory.reaction.result.second)) {
          cleanUpLabs(creep);
        }
      }
    }
  }
  if (lab0.mineralAmount > lab0.mineralCapacity - 100 && creep.room.memory.reaction) {
    creep.room.memory.fullLab = 1;
  }

  if (lab0.mineralAmount < 100) {
    creep.room.memory.fullLab = 0;
  }
};

const execute = function(creep) {
  if (!creep.room.terminal) {
    creep.suicide();
    return true;
  }
  if (creep.ticksToLive < 50 && _.sum(creep.carry) === 0) {
    // early suicide to not waste minerals
    creep.suicide();
    return true;
  }

  const room = Game.rooms[creep.room.name];

  if (room.memory.reaction) {
    handleReactions(creep, room);
  }

  if (creep.room.memory.fullLab === 1) {
    if (_.sum(creep.carry) > 0) {
      creep.memory.state = 0;
    }
    if (_.sum(creep.carry) === 0) {
      creep.memory.state = 8;
    }
  }
  if (room.memory.boosting && Object.keys(room.memory.boosting).length > 0) {
    if (prepareBoost(creep)) {
      return true;
    }
  }

  if (checkNuke(creep)) {
    return true;
  }

  creep.say('A1');

  creep.memory.state = creep.memory.state || 0;

  if (!room.memory.reaction) {
    cleanUpLabs(creep);
    if (config.debug.mineral) {
      creep.log('No reactions?');
    }
    return true;
  }

  const state = states[creep.memory.state];
  creep.say(state.name);

  let target = creep.room.terminal;
  if (state.destination === STRUCTURE_LAB) {
    target = Game.getObjectById(room.memory.reaction.labs[state.lab]);
  } else if (state.destination === STRUCTURE_STORAGE) {
    target = creep.room.storage;
  }

  creep.moveToMy(target.pos);

  let resource = RESOURCE_ENERGY;
  if (state.resouce !== 'energy') {
    resource = room.memory.reaction.result[state.resource];
  }

  state.action(creep, target, resource);
  creep.room.memory.cleanup = 0;

  return true;
};

/*
 * Check resources in the terminal
 *
 * energy in terminal should be between `config.terminal.minEnergyAmount`
 * and `config.terminal.maxEnergyAmount`
 */
Creep.prototype.checkTerminal = function() {
  if (!this.room.terminal) {
    this.creepLog('Killing myself, no terminal');
    this.suicide();
    return;
  }
  if (this.room.terminal.store.energy + this.carry.energy > config.terminal.maxEnergyAmount) {
    if (_.sum(this.carry) > 0) {
      this.creepLog('Transfer energy to terminal');
      this.moveToMy(this.room.storage.pos);
      for (const resource of Object.keys(this.carry)) {
        this.creepLog('transfer', resource);
        this.transfer(this.room.storage, resource);
      }
    } else {
      this.creepLog('Get energy from terminal');
      this.moveToMy(this.room.terminal.pos);
      this.withdraw(this.room.terminal, RESOURCE_ENERGY);
    }
    return true;
  }
  return false;
};

/**
 * check storage for resouces which don't belong there
 * returns true if if so
 *
 * @return {boolean}
 */
Creep.prototype.transferAllResourcesToTerminal = function() {
  let foundResources = false;

  for (const resource in this.room.storage.store) {
    if (resource !== RESOURCE_ENERGY) {
      foundResources = true;
    }
  }

  if (foundResources) {
    if (_.sum(this.carry) > 0) {
      for (const resource in this.carry) {
        if (resource !== RESOURCE_ENERGY) {
          this.moveToMy(this.room.terminal.pos);
          this.transfer(this.room.terminal, resource);
        }
      }
    } else {
      for (const resource in this.room.storage.store) {
        if (resource !== RESOURCE_ENERGY) {
          this.withdraw(this.room.storage, resource);
          this.moveToMy(this.room.storage.pos);
        }
      }
    }
  }
  return foundResources;
};

// TODO totally ugly copy&paste from creep_mineral to migrate to role_mineral
Creep.prototype.handleMineralCreep = function() {
  if (this.checkTerminal()) {
    return true;
  }
  if (this.transferAllResourcesToTerminal()) {
    return true;
  }

  return execute(this);
};

Creep.prototype.getBoostParts = function() {
  const parts = {};
  for (const part of this.body) {
    if (part.boost) {
      return false;
    }
    parts[part.type] = true;
  }
  return parts;
};

Creep.prototype.boost = function() {
  if (!this.room.terminal || !this.room.terminal.my) {
    this.memory.boosted = true;
    return false;
  }

  const unit = roles[this.memory.role];
  if (!unit.boostActions) {
    return false;
  }

  const parts = this.getBoostParts();

  let boost;
  const findLabs = (lab) => lab.mineralType === boost && lab.mineralAmount > 30 && lab.energy > 20;
  // TODO boosting disabled, too many room.finds
  // eslint-disable-next-line no-constant-condition
  if (true) {
    return false;
  }
  for (const part of Object.keys(parts)) {
    for (boost of Object.keys(BOOSTS[part])) {
      for (const action of Object.keys(BOOSTS[part][boost])) {
        this.log('boost: ' + part + ' ' + boost + ' ' + action);
        if (unit.boostActions.indexOf(action) > -1) {
          const labs = this.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], {
            filter: findLabs,
          });
          if (this.room.terminal.store[boost] || labs.length > 0) {
            const room = Game.rooms[this.room.name];
            room.memory.boosting = room.memory.boosting || {};
            room.memory.boosting[boost] = room.memory.boosting[boost] || {};
            room.memory.boosting[boost][this.id] = true;

            if (labs.length > 0) {
              let returnCode = this.moveToMy(labs[0].pos, 1);
              returnCode = labs[0].boostCreep(this);
              if (returnCode === OK) {
                const room = Game.rooms[this.room.name];
                delete room.memory.boosting[boost][this.id];
              }
              if (returnCode === ERR_NOT_IN_RANGE) {
                return true;
              }
              this.log('Boost returnCode: ' + returnCode + ' lab: ' + labs[0].pos);
              return true;
            }

            return false;
          }
        }
      }
    }
  }

  return false;
};
