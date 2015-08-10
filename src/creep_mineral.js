'use strict';

var helper = require('helper');
var config = require('config');

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

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY];
  return room.get_part_config(energy, parts);
};

module.exports.energyBuild = function(room, energy, source, heal) {
  var max = 1000;
  energy = Math.max(250, Math.min(max, room.energyCapacityAvailable));
  return energy;
};

function nextState(creep) {
  creep.memory.state = (creep.memory.state + 1) % states.length;
}

function moveTo(creep, target) {
  let search = PathFinder.search(
    creep.pos, {
      pos: target.pos,
      range: 1
    }, {
      roomCallback: helper.getAvoids(creep.room, {}, true),
    }
  );
  let returnCode = creep.move(creep.pos.getDirectionTo(search.path[0]));
}

function get(creep, target, resource) {
  if (_.sum(creep.carry) == creep.carryCapacity) {
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
  if (returnCode == OK || returnCode == ERR_FULL || returnCode == ERR_NOT_ENOUGH_RESOURCES) {
    //creep.log('next state transfer ok: ' + returnCode + ' ' + target);
    nextState(creep);
    return true;
  }
  if (returnCode == ERR_NOT_IN_RANGE) {
    return true;
  }
  if (returnCode == ERR_INVALID_ARGS) {
    delete creep.room.memory.reaction;
    return false;
  }
  creep.log('get: ' + returnCode + ' target: ' + target + ' resource: ' + resource + ' amount: ' + amount);
  creep.log(target.mineralAmount + ' ' + (creep.carryCapacity - _.sum(creep.carry)));
  creep.log(JSON.stringify(target.pos));
}

function cleanUpLabs(creep) {
  creep.say('cleanup');
  if (_.sum(creep.carry) > 0) {
    creep.moveTo(creep.room.terminal, {
      ignoreCreeps: true,
      costCallback: helper.getAvoids(creep.room)
    });
    for (let resource in creep.carry) {
      if (creep.carry[resource] === 0) {
        continue;
      }
      let returnCode = creep.transfer(creep.room.terminal, resource);
      //      creep.log(returnCode + ' ' + resource + ' ' + JSON.stringify(resource));
      break;
    }
  } else {
    let lab = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.structureType != STRUCTURE_LAB) {
          return false;
        }
        if (object.mineralAmount > 0) {
          return true;
        }
        return false;
      }
    });
    if (lab === null) {
      // Nothing to do?
      creep.moveRandom();
      return false;
    }
    creep.moveTo(lab, {
      ignoreCreeps: true,
      costCallback: helper.getAvoids(creep.room)
    });
    let returnCode = creep.withdraw(lab, lab.mineralType);
    //    creep.log(returnCode + ' ' + lab.mineralType + ' ' + JSON.stringify(lab));

  }
}

function transfer(creep, target, resource) {
  if (target instanceof StructureTerminal) {
    for (let carryResource in creep.carry) {
      if (carryResource == resource) {
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
  if (returnCode == OK) {
    nextState(creep);
    return;
  }
  if (returnCode == ERR_FULL) {
    nextState(creep);
    return;
  }
  if (returnCode == ERR_NOT_IN_RANGE) {
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
  let labForMineral = function(object) {
    if (object.structureType != STRUCTURE_LAB) {
      return false;
    }
    if (object.mineralType == mineral) {
      return true;
    }
    return false;
  };
  let labEmpty = function(object) {
    if (object.structureType != STRUCTURE_LAB) {
      return false;
    }
    if (!object.mineralType || object.mineralType === null) {
      return true;
    }
    return false;
  };

  for (mineral in room.memory.boosting) {
    let labs = room.find(FIND_STRUCTURES, {
      filter: labForMineral
    });
    if (labs.length > 0) {
      if (labs[0].mineralAmount == labs[0].mineralsCapacity) {
        if (labs[0].energy == labs[0].energyCapacity) {
          continue;
        }
      }
      creep.memory.boostAction = {
        mineral: mineral,
        lab: labs[0].id
      };
      return true;
    }

    labs = room.find(FIND_STRUCTURES, {
      filter: labEmpty
    });
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

  //  creep.log('aa: ' + JSON.stringify(creep.memory.boostAction));
  let lab = Game.getObjectById(creep.memory.boostAction.lab);
  if (!lab) {
    return false;
  }
  if (lab.energy < lab.energyCapacity) {
    creep.say('boost');
    if (creep.carry.energy > 0) {
      creep.moveTo(lab, {
        ignoreCreeps: true,
        costCallback: helper.getAvoids(creep.room)
      });
      creep.transfer(lab, RESOURCE_ENERGY);
      return true;
    } else {
      creep.moveTo(creep.room.storage, {
        ignoreCreeps: true,
        costCallback: helper.getAvoids(creep.room)
      });
      if (_.sum(creep.carry) > 0) {
        for (let resource in creep.carry) {
          creep.transfer(creep.room.storage, resource);
        }
      }
      let returnCode = creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
      return true;
    }
  }

  if (lab.mineralAmount < lab.mineralCapacity) {
    creep.say('mineral');
    if (creep.carry[creep.memory.boostAction.mineral] > 0) {
      creep.moveTo(lab, {
        ignoreCreeps: true,
        costCallback: helper.getAvoids(creep.room)
      });
      creep.transfer(lab, creep.memory.boostAction.mineral);
      return true;
    } else {
      if (!creep.room.terminal.store[creep.memory.boostAction.mineral]) {
        //        creep.log('For boosting ' + creep.memory.boostAction.mineral + ' not available');
        return false;
      }
      creep.moveTo(creep.room.terminal, {
        ignoreCreeps: true,
        costCallback: helper.getAvoids(creep.room)
      });
      creep.withdraw(creep.room.terminal, creep.memory.boostAction.mineral);
      return true;
    }
  }
  creep.say('delete');
  delete creep.memory.boostAction;
  return false;
}

function checkTerminal(creep) {
  if (creep.room.terminal.store.energy + creep.carry.energy < 100000) {
    return false;
  }

  // TODO Transfer to structures

  if (creep.carry.energy === 0) {
    creep.moveTo(creep.room.terminal.pos, {
      ignoreCreeps: true,
      costCallback: helper.getAvoids(creep.room)
    });
    for (let resource in creep.carry) {
      creep.transfer(creep.room.terminal, resource);
    }
    creep.withdraw(creep.room.terminal, RESOURCE_ENERGY);
    return true;
  }

  creep.moveTo(creep.room.storage.pos, {
    ignoreCreeps: true,
    costCallback: helper.getAvoids(creep.room)
  });
  creep.transfer(creep.room.storage, RESOURCE_ENERGY);
  return true;
}

function checkStorage(creep) {
  let resource;
  for (resource in creep.room.storage.store) {
    if (resource == 'energy' || resource == 'power') {
      resource = undefined;
      continue;
    }
    break;
  }

  if (!resource) {
    return false;
  }
  creep.say('checkStorage');

  if (_.sum(creep.carry) > 0) {
    creep.moveTo(creep.room.terminal.pos, {
      ignoreCreeps: true,
      costCallback: helper.getAvoids(creep.room)
    });
    for (let transfer in creep.carry) {
      let returnCode = creep.transfer(creep.room.terminal, transfer);
      if (returnCode == OK || returnCode == ERR_NOT_IN_RANGE) {
        continue;
      }
      //      creep.log('checkStorage.transferto terminal: ' + transfer + ' returnCode: ' + returnCode);
    }
    return true;
  }

  creep.moveTo(creep.room.storage.pos, {
    ignoreCreeps: true,
    costCallback: helper.getAvoids(creep.room)
  });
  creep.withdraw(creep.room.storage, resource);
  return true;
}

function checkNuke(creep) {
  if (creep.room.terminal.store[RESOURCE_GHODIUM] > 500 || creep.carry[RESOURCE_GHODIUM]) {
    let nukers = creep.room.find(FIND_STRUCTURES, {
      filter: {
        structureType: STRUCTURE_NUKER
      }
    });
    if (nukers.length > 0) {
      let nuker = nukers[0];
      if (nuker.ghodium < nuker.ghodiumCapacity) {
        if (creep.carry[RESOURCE_GHODIUM] > 0) {
          creep.moveTo(nuker, {
            ignoreCreeps: true,
            costCallback: helper.getAvoids(creep.room)
          });
          creep.transfer(nuker, RESOURCE_GHODIUM);
        } else {
          creep.moveTo(creep.room.terminal, {
            ignoreCreeps: true,
            costCallback: helper.getAvoids(creep.room)
          });
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

  }

  if (room.memory.boosting && Object.keys(room.memory.boosting).length > 0) {
    if (prepareBoost(creep)) {
      return true;
    }
  }

  if (checkNuke(creep)) {
    return true;
  }

  if (checkTerminal(creep)) {
    return true;
  }

  if (checkStorage(creep)) {
    return true;
  }

  creep.say('A1');

  if (room.memory.terminalTooLessEnergy) {
    if (_.sum(creep.carry) - creep.carry.energy > 0) {
      creep.moveTo(room.terminal, {
        ignoreCreeps: true,
        costCallback: helper.getAvoids(creep.room)
      });
      for (let resource in creep.carry) {
        creep.transfer(room.terminal, resource);
      }
      return true;
    }

    creep.say('TEnergy');
    if (creep.carry.energy > 0) {
      creep.moveTo(room.terminal, {
        ignoreCreeps: true,
        costCallback: helper.getAvoids(creep.room)
      });
      creep.transfer(room.terminal, RESOURCE_ENERGY);
    } else {
      creep.moveTo(room.storage, {
        ignoreCreeps: true,
        costCallback: helper.getAvoids(creep.room)
      });
      creep.withdraw(room.storage, RESOURCE_ENERGY);
    }
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
  if (state.destination == STRUCTURE_LAB) {
    target = Game.getObjectById(room.memory.reaction.labs[state.lab]);
  } else if (state.destination == STRUCTURE_STORAGE) {
    target = creep.room.storage;
  }
  moveTo(creep, target, {
    ignoreCreeps: true,
    costCallback: helper.getAvoids(creep.room)
  });

  let resource = RESOURCE_ENERGY;
  if (state.resouce != 'energy') {
    resource = room.memory.reaction.result[state.resource];
  }

  state.action(creep, target, resource);

  return true;
};

module.exports.action = function(creep) {
  return execute(creep);
};

module.exports.execute = function(creep) {
  return execute(creep);
};
