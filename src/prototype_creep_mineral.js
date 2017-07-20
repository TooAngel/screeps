'use strict';

Creep.prototype.checkStorageMinerals = function() {
  let resourceInStorage = false;
  for (let resource in this.room.storage.store) {
    if (resource === 'energy' || resource === 'power') {
      continue;
    }
    resourceInStorage = true;
    break;
  }

  if (!resourceInStorage) {
    return false;
  }
  this.say('checkStorage');

  if (_.sum(this.carry) > 0) {
    this.moveToMy(this.room.terminal.pos);

    for (let transfer in this.carry) {
      let resource = this.transfer(this.room.terminal, transfer);
    }
    return true;
  }
  this.moveToMy(this.room.storage.pos);
  for (let resource in this.room.storage.store) {
    if (resource === 'energy' || resource === 'power') {
      continue;
    }
    this.withdraw(this.room.storage, resource);
  }
  return true;
};

Creep.prototype.checkTerminalEnergy = function() {
  if (this.room.storage.store.energy + _.sum(this.carry) < config.terminal.storageMinEnergyAmount) {
    return false;
  }
  if (this.room.terminal.store.energy + _.sum(this.carry) > config.terminal.energyAmount) {
    return false;
  }

  this.say('terminal', true);

  if (_.sum(this.carry) > 0) {
    this.moveToMy(this.room.terminal.pos);
    for (let resource in this.carry) {
      this.transfer(this.room.terminal, resource);
    }
    return true;
  }
  this.moveToMy(this.room.storage.pos);
  this.withdraw(this.room.storage, RESOURCE_ENERGY);
  return true;
};

// TODO totally ugly copy&paste from creep_mineral to migrate to role_mineral
Creep.prototype.handleMineralCreep = function() {
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

  function nextState(creep) {
    creep.memory.state = (creep.memory.state + 1) % states.length;
  }

  function get(creep, target, resource) {
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
  }

  function cleanUpLabs(creep) {
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
  }

  function transfer(creep, target, resource) {
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
  }

  function checkBoostAction(creep) {
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
  }

  function prepareBoost(creep) {
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
  }

  function checkNuke(creep) {
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
  }

  let execute = function(creep) {
    if (!creep.room.terminal) {
      creep.suicide();
      return true;
    }

    if (creep.checkTerminalEnergy()) {
      return true;
    }

    if (creep.checkStorageMinerals()) {
      return true;
    }

    let room = Game.rooms[creep.room.name];

    let lab0;
    let lab1;
    let lab2;
    if (room.memory.reaction) {
      lab0 = Game.getObjectById(room.memory.reaction.labs[0]);
      lab1 = Game.getObjectById(room.memory.reaction.labs[1]);
      lab2 = Game.getObjectById(room.memory.reaction.labs[2]);

      if (lab0 === null || lab1 === null || lab2 === null) {
        delete creep.room.memory.reaction;
      } else {
        if (lab0.cooldown === 0) {
          lab0.runReaction(lab1, lab2);
        }

      }
      if (lab0.mineralAmount > lab0.mineralCapacity - 100 && creep.room.memory.reaction) {
        creep.room.memory.fullLab = 1;
      }

      if (lab0.mineralAmount < 100) {
        creep.room.memory.fullLab = 0;
      }
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

    if (room.memory.terminalTooLessEnergy) {
      if (_.sum(creep.carry) - creep.carry.energy > 0) {
        let returnCode = creep.moveToMy(creep.room.terminal.pos);

        for (let resource in creep.carry) {
          creep.transfer(room.terminal, resource);
        }
        return true;
      }

      creep.say('TEnergy');
      let target = creep.room.storage;
      if (creep.carry.energy > 0) {
        target = creep.room.terminal;
      }
      let returnCode = creep.moveToMy(target.pos);
      creep.transfer(target, RESOURCE_ENERGY);
      return true;
    }

    creep.say(creep.memory.state);

    creep.memory.state = creep.memory.state || 0;

    if (!room.memory.reaction) {
      cleanUpLabs(creep);
      //    creep.log('No reactions?');
      return true;
    }

    let state = states[creep.memory.state];

    let target = creep.room.terminal;
    if (state.destination === STRUCTURE_LAB) {
      target = Game.getObjectById(room.memory.reaction.labs[state.lab]);
    } else if (state.destination === STRUCTURE_STORAGE) {
      target = creep.room.storage;
    }

    creep.moveToMy(target.pos);

    let resource = RESOURCE_ENERGY;
    if (state.resouce != 'energy') {
      resource = room.memory.reaction.result[state.resource];
    }

    state.action(creep, target, resource);

    return true;
  };

  execute(this);
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
