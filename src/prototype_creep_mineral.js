'use strict';

Creep.prototype.transferAllMineralsToTerminal = function() {
  this.moveToMy(this.room.terminal.pos);
  for (let transfer of Object.keys(this.carry)) {
    let resource = this.transfer(this.room.terminal, transfer);
  }
};

Creep.prototype.withdrawAllMineralsFromStorage = function() {
  this.moveToMy(this.room.storage.pos);
  for (let resource in this.room.storage.store) {
    if (resource === RESOURCE_ENERGY || resource === RESOURCE_POWER) {
      continue;
    }
    this.withdraw(this.room.storage, resource);
  }
};

Creep.prototype.checkStorageMinerals = function() {
  if (!this.room.isMineralInStorage()) {
    return false;
  }
  this.say('checkStorage');

  if (_.sum(this.carry) > 0) {
    this.transferAllMineralsToTerminal();
    return true;
  }

  this.withdrawAllMineralsFromStorage();
  return true;
};

Creep.prototype.checkEnergyThreshold = function(structure, value, below = false) {
  if (below) {
    return this.room[structure].store.energy + _.sum(this.carry) < value;
  }
  return this.room[structure].store.energy + _.sum(this.carry) > value;
};

Creep.prototype.checkTerminalEnergy = function() {
  if (this.checkEnergyThreshold(STRUCTURE_STORAGE, config.terminal.storageMinEnergyAmount, true) ||
    (this.checkEnergyThreshold(STRUCTURE_TERMINAL, config.terminal.minEnergyAmount) &&
      this.checkEnergyThreshold(STRUCTURE_TERMINAL, config.terminal.maxEnergyAmount, true))) {
    return false;
  }

  this.say('terminal', true);
  let from = this.room.storage;
  let to = this.room.terminal;
  if (this.checkEnergyThreshold(STRUCTURE_TERMINAL, config.terminal.maxEnergyAmount)) {
    from = this.room.terminal;
    to = this.room.storage;
  }

  if (_.sum(this.carry) > 0) {
    this.moveToMy(to.pos);
    for (let resource of Object.keys(this.carry)) {
      this.transfer(to, resource);
    }
    return true;
  }
  this.moveToMy(from.pos);
  this.withdraw(from, RESOURCE_ENERGY);
  return true;
};

let nextState = function(creep) {
  creep.memory.state = (creep.memory.state + 1) % states.length;
};

let get = function(creep, target, resource) {
  if (_.sum(creep.carry) === creep.carryCapacity) {
    //    creep.log('next state no capacity' + target);
    nextState(creep);
    return;
  }

  if (creep.carry[resource]) {
    //    creep.log('next state already carrying' + target);
    nextState(creep);
    return;
  }

  if (target instanceof StructureTerminal && !target.store[resource]) {
    //    creep.log('next state terminal no resource' + target);
    nextState(creep);
    return;
  }

  if (target instanceof StructureLab && target.mineralAmount === 0) {
    //    creep.log('next state lab no mineral' + target);
    nextState(creep);
    return;
  }

  let amount = 0;
  if (target instanceof StructureTerminal) {
    amount = Math.min(target.store[resource], creep.carryCapacity / 2);
  }

  if (target instanceof StructureLab) {
    amount = Math.min(target.mineralAmount, creep.carryCapacity - _.sum(creep.carry));
    //    if (target.mineral != resource) {
    //      delete creep.room.memory.reaction;
    //    }
  }

  if (target instanceof StructureStorage) {
    resource = 'energy';
    amount = Math.min(target.store[resource], creep.carryCapacity - _.sum(creep.carry));
  }

  if (amount === 0) {
    //creep.log('next state no amount' + target);
    nextState(creep);
    return;
  }

  let returnCode = creep.withdraw(target, resource, amount);
  //  if (target instanceof StructureStorage) {
  //    creep.log('creep.withdray: ' + returnCode + ' ' + target + ' ' + resource + ' ' + amount);
  //  }
  if (returnCode === OK || returnCode === ERR_FULL || returnCode === ERR_NOT_ENOUGH_RESOURCES) {
    //creep.log('next state transfer ok: ' + returnCode + ' ' + target);
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

let cleanUpLabs = function(creep) {
  creep.say('cleanup');
  if (_.sum(creep.carry) > 0) {

    let returnCode = creep.moveToMy(creep.room.terminal.pos);

    for (let resource in creep.carry) {
      if (creep.carry[resource] === 0) {
        continue;
      }
      let returnCode = creep.transfer(creep.room.terminal, resource);
      //      creep.log(returnCode + ' ' + resource + ' ' + JSON.stringify(resource));
      break;
    }
  } else {
    const lab = creep.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], false, {
      filter: lab => lab.mineralAmount > 0
    });
    if (lab === null) {
      // Nothing to do?
      creep.moveRandom();
      return false;
    }
    let returnCode = creep.moveToMy(lab.pos);

    returnCode = creep.withdraw(lab, lab.mineralType);
    //    creep.log(returnCode + ' ' + lab.mineralType + ' ' + JSON.stringify(lab));
  }
};

let transfer = function(creep, target, resource) {
  if (target instanceof StructureTerminal) {
    for (let carryResource in creep.carry) {
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

  let returnCode = creep.transfer(target, resource);
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
};

let checkBoostAction = function(creep) {
  if (creep.memory.boostAction) {
    return true;
  }
  let room = Game.rooms[creep.room.name];
  let mineral;
  let labForMineral = lab => lab.mineralType === mineral;
  let labEmpty = object => !object.mineralType || object.mineralType === null;

  for (mineral in room.memory.boosting) {
    let labs = room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], false, { filter: labForMineral });
    if (labs.length > 0) {
      if (labs[0].mineralAmount === labs[0].mineralsCapacity) {
        if (labs[0].energy === labs[0].energyCapacity) {
          continue;
        }
      }
      creep.memory.boostAction = {
        mineral: mineral,
        lab: labs[0].id
      };
      return true;
    }

    labs = room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], false, { filter: labEmpty });
    if (labs.length > 0) {
      creep.memory.boostAction = {
        mineral: mineral,
        lab: labs[0].id
      };
      return true;
    }
    //    creep.log('No free labs');
  }
  return false;
};

let prepareBoost = function(creep) {
  if (!checkBoostAction(creep)) {
    return false;
  }

  creep.say('A3');

  let lab = Game.getObjectById(creep.memory.boostAction.lab);
  if (!lab) {
    return false;
  }
  if (lab.energy < lab.energyCapacity) {
    creep.say('boost');
    if (creep.carry.energy > 0) {
      let returnCode = creep.moveToMy(lab.pos);
      creep.transfer(lab, RESOURCE_ENERGY);
      return true;
    } else {
      let returnCode = creep.moveToMy(creep.room.storage.pos);

      if (_.sum(creep.carry) > 0) {
        for (let resource in creep.carry) {
          creep.transfer(creep.room.storage, resource);
        }
      }
      returnCode = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
      return true;
    }
  }

  if (lab.mineralAmount < lab.mineralCapacity) {
    creep.say('mineral');
    if (creep.carry[creep.memory.boostAction.mineral] > 0) {
      let returnCode = creep.moveToMy(lab.pos);

      creep.transfer(lab, creep.memory.boostAction.mineral);
      return true;
    } else {
      if (!creep.room.terminal.store[creep.memory.boostAction.mineral]) {
        //        creep.log('For boosting ' + creep.memory.boostAction.mineral + ' not available');
        return false;
      }

      let returnCode = creep.moveToMy(creep.room.terminal.pos);

      creep.withdraw(creep.room.terminal, creep.memory.boostAction.mineral);
      return true;
    }
  }
  creep.say('delete');
  delete creep.memory.boostAction;
  return false;
};

let checkNuke = function(creep) {
  if (creep.room.terminal.store[RESOURCE_GHODIUM] > 500 || creep.carry[RESOURCE_GHODIUM]) {
    let nukers = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_NUKER]);
    if (nukers.length > 0) {
      let nuker = nukers[0];
      if (nuker.ghodium < nuker.ghodiumCapacity) {
        if (creep.carry[RESOURCE_GHODIUM] > 0) {
          let returnCode = creep.moveToMy(nuker.pos);
          creep.transfer(nuker, RESOURCE_GHODIUM);
        } else {
          let returnCode = creep.moveToMy(creep.room.terminal.pos);

          creep.withdraw(creep.room.terminal, RESOURCE_GHODIUM);
        }
        return true;
      }
    }
  }
  return false;
};

let states = [{
  name: 'storage result',
  destination: STRUCTURE_TERMINAL,
  action: transfer,
  resource: 'result'
}, {
  name: 'terminal 0',
  destination: STRUCTURE_TERMINAL,
  action: get,
  resource: 'first'
}, {
  name: 'terminal 1',
  destination: STRUCTURE_TERMINAL,
  action: get,
  resource: 'second'
}, {
  name: 'lab 1',
  destination: STRUCTURE_LAB,
  lab: 1,
  action: transfer,
  resource: 'first'
}, {
  name: 'lab 2',
  destination: STRUCTURE_LAB,
  lab: 2,
  action: transfer,
  resource: 'second'
}, {
  name: 'storage energy',
  destination: STRUCTURE_STORAGE,
  action: get,
  resource: 'energy'
}, {
  name: 'lab 1',
  destination: STRUCTURE_LAB,
  lab: 1,
  action: transfer,
  resource: 'energy'
}, {
  name: 'lab 2',
  destination: STRUCTURE_LAB,
  lab: 2,
  action: transfer,
  resource: 'energy'
}, {
  name: 'lab result1',
  destination: STRUCTURE_LAB,
  lab: 0,
  action: get,
  resource: 'result'
}];

// TODO totally ugly copy&paste from creep_mineral to migrate to role_mineral
Creep.prototype.handleMineralCreep = function() {
  if (!this.room.terminal) {
    this.suicide();
    return true;
  }

  if (this.checkTerminalEnergy()) {
    return true;
  }

  if (this.checkStorageMinerals()) {
    return true;
  }

  let room = Game.rooms[this.room.name];

  let lab0;
  let lab1;
  let lab2;
  if (room.memory.reaction) {
    lab0 = Game.getObjectById(room.memory.reaction.labs[0]);
    lab1 = Game.getObjectById(room.memory.reaction.labs[1]);
    lab2 = Game.getObjectById(room.memory.reaction.labs[2]);

    if (lab0 === null || lab1 === null || lab2 === null) {
      delete this.room.memory.reaction;
    } else {
      if (lab0.cooldown === 0) {
        lab0.runReaction(lab1, lab2);
      }

    }
    if (lab0.mineralAmount > lab0.mineralCapacity - 100 && this.room.memory.reaction) {
      this.room.memory.fullLab = 1;
    }

    if (lab0.mineralAmount < 100) {
      this.room.memory.fullLab = 0;
    }
  }

  if (this.room.memory.fullLab === 1) {
    if (_.sum(this.carry) > 0) {
      this.memory.state = 0;
    }
    if (_.sum(this.carry) === 0) {
      this.memory.state = 8;
    }
  }
  if (room.memory.boosting && Object.keys(room.memory.boosting).length > 0) {
    if (prepareBoost(this)) {
      return true;
    }
  }

  if (checkNuke(this)) {
    return true;
  }

  this.say('A1');

  if (room.memory.terminalTooLessEnergy) {
    if (_.sum(this.carry) - this.carry.energy > 0) {
      let returnCode = this.moveToMy(this.room.terminal.pos);

      for (let resource in this.carry) {
        this.transfer(room.terminal, resource);
      }
      return true;
    }

    this.say('TEnergy');
    let target = this.room.storage;
    if (this.carry.energy > 0) {
      target = this.room.terminal;
    }
    let returnCode = this.moveToMy(target.pos);
    this.transfer(target, RESOURCE_ENERGY);
    return true;
  }

  this.say(this.memory.state);

  this.memory.state = this.memory.state || 0;

  if (!room.memory.reaction) {
    cleanUpLabs(this);
    //    creep.log('No reactions?');
    return true;
  }

  let state = states[this.memory.state];

  let target = this.room.terminal;
  if (state.destination === STRUCTURE_LAB) {
    target = Game.getObjectById(room.memory.reaction.labs[state.lab]);
  } else if (state.destination === STRUCTURE_STORAGE) {
    target = this.room.storage;
  }

  this.moveToMy(target.pos);

  let resource = RESOURCE_ENERGY;
  if (state.resouce != 'energy') {
    resource = room.memory.reaction.result[state.resource];
  }

  state.action(this, target, resource);

  return true;
};

Creep.prototype.boost = function() {
  if (!this.room.terminal || !this.room.terminal.my) {
    this.memory.boosted = true;
    return false;
  }

  let unit = roles[this.memory.role];
  if (!unit.boostActions) {
    return false;
  }

  let parts = {};
  for (let part of this.body) {
    if (part.boost) {
      return false;
    }
    parts[part.type] = true;
  }

  let boost;
  let findLabs = lab => lab.mineralType === boost && lab.mineralAmount > 30 && lab.energy > 20;
  // TODO boosting disabled, too many room.finds
  if (true) {
    return false;
  }
  for (let part in parts) {
    for (boost in BOOSTS[part]) {
      for (let action in BOOSTS[part][boost]) {
        this.log('boost: ' + part + ' ' + boost + ' ' + action);
        if (unit.boostActions.indexOf(action) > -1) {
          const labs = this.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], false, { filter: findLabs });
          if (this.room.terminal.store[boost] || labs.length > 0) {
            //            this.log('Could boost with: ' + part + ' ' + boost + ' ' + action + ' terminal: ' + this.room.terminal.store[boost] + ' lab: ' + JSON.stringify(labs));
            let room = Game.rooms[this.room.name];
            room.memory.boosting = room.memory.boosting || {};
            room.memory.boosting[boost] = room.memory.boosting[boost] || {};
            room.memory.boosting[boost][this.id] = true;

            if (labs.length > 0) {
              let returnCode = this.moveToMy(labs[0].pos, 1);
              returnCode = labs[0].boostCreep(this);
              if (returnCode === OK) {
                let room = Game.rooms[this.room.name];
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
