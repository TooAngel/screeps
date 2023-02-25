'use strict';

const {findMyRoomsSortByDistance} = require('./helper_findMyRooms');

Room.prototype.getResourceAmountWithNextTiers = function(resource) {
  const resultOH = REACTIONS[RESOURCE_HYDROXIDE][resource];
  const resultXOH = REACTIONS[RESOURCE_CATALYST][resultOH];
  const resultX = REACTIONS[RESOURCE_CATALYST][resource];
  let amount = this.terminal.store[resource] || 0;
  amount += this.terminal.store[resultOH] || 0;
  amount += this.terminal.store[resultXOH] || 0;
  amount += this.terminal.store[resultX] || 0;
  return amount;
};

Room.prototype.getNextReaction = function() {
  for (const mineralFirst in this.terminal.store) {
    if (!REACTIONS[mineralFirst] || this.terminal.store[mineralFirst] < LAB_REACTION_AMOUNT) {
      continue;
    }
    for (const mineralSecond in this.terminal.store) {
      if (!REACTIONS[mineralFirst][mineralSecond] || this.terminal.store[mineralSecond] < LAB_REACTION_AMOUNT) {
        continue;
      }
      const result = REACTIONS[mineralFirst][mineralSecond];
      const amount = this.getResourceAmountWithNextTiers(result);
      if (amount > config.mineral.minAmount && this.terminal.store[result] > config.mineral.minAmount) {
        continue;
      }
      if (config.debug.mineral) {
        this.log('Could build: ' + mineralFirst + ' ' + mineralSecond + ' ' + result, amount);
      }
      delete this.memory.cleanup;
      return {
        result: result,
        first: mineralFirst,
        second: mineralSecond,
      };
    }
  }
  return false;
};

Room.prototype.reactionsWithoutReaction = function() {
  const result = this.getNextReaction();
  if (!result) {
    return;
  }

  const labsAll = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_LAB], {
    filter: (object) => !object.mineralType || object.mineralType === result.result,
  });

  let lab;
  const labs = [];
  const getNearLabs = function(object) {
    if (object.id === lab.id) {
      return false;
    }
    if (!object.mineralType) {
      return true;
    }
    if (object.mineralType === result.first) {
      return true;
    }
    if (object.mineralType === result.second) {
      return true;
    }
    return false;
  };

  for (lab of labsAll) {
    const labsNear = lab.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 2, 'structureType', [STRUCTURE_LAB], {
      filter: getNearLabs,
    });

    if (labsNear.length >= 2) {
      labs.push(lab.id);
      //        console.log(lab.mineralType, result.result);

      for (const labNear of labsNear) {
        if (!labNear.mineralType || labNear.mineralType === result.first) {
          //            console.log(labNear.mineralType, result.first);
          labs.push(labNear.id);
          break;
        }
      }
      for (const labNear of labsNear) {
        if (labNear.id === labs[1]) {
          continue;
        }
        if (!labNear.mineralType || labNear.mineralType === result.second) {
          //            console.log(labNear.mineralType, result.second);
          labs.push(labNear.id);
          break;
        }
      }
      break;
    }
  }
  if (labs.length < 3) {
    return false;
  }
  this.memory.reaction = {
    result: result,
    labs: labs,
  };
  //    this.log('Setting reaction: ' + JSON.stringify(this.memory.reaction));
};

Room.prototype.reactions = function() {
  if (!this.memory.reaction) {
    return this.reactionsWithoutReaction();
  }

  if (this.getResourceAmountWithNextTiers(this.memory.reaction.result.result) > config.mineral.minAmount &&
    (this.terminal.store[this.memory.reaction.result.result] > config.mineral.minAmount)) {
    this.debugLog('mineral', 'Done with reaction:' + this.memory.reaction.result.result);
    delete this.memory.reaction;
  }
};

Room.prototype.getMineralType = function() {
  if (this.memory.mineralType === undefined) {
    const minerals = this.findMinerals();
    this.memory.mineralType = minerals.length > 0 ? minerals[0].mineralType : null;
  }
  return this.memory.mineralType;
};

const baseMinerals = [
  RESOURCE_HYDROGEN,
  RESOURCE_OXYGEN,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_ZYNTHIUM,
  RESOURCE_CATALYST,
  RESOURCE_HYDROXIDE,
  RESOURCE_UTRIUM_LEMERGITE,
  RESOURCE_ZYNTHIUM_KEANITE,
  RESOURCE_GHODIUM,
];

/**
 * isOtherRoomReady
 *
 * @param {object} room
 * @param {string} roomOtherName
 * @param {string} mineral
 * @return {boolean}
 */
function isOtherRoomReady(room, roomOtherName, mineral) {
  if (roomOtherName === room.name) {
    return false;
  }
  const roomOther = Game.rooms[roomOtherName];
  if (!roomOther) {
    return false;
  }
  if (!roomOther.terminal || !roomOther.terminal.store[mineral] || roomOther.terminal.store[mineral] < 2000) {
    return false;
  }
  return true;
}

Room.prototype.orderMinerals = function() {
  if (this.executeEveryTicks(20)) {
    const room = this;

    for (const mineral of baseMinerals) {
      if (!this.terminal.store[mineral] || this.terminal.store[mineral] < 1000) {
        const roomsOther = findMyRoomsSortByDistance(this.name);

        for (const roomOtherName of roomsOther) {
          if (!isOtherRoomReady(room, roomOtherName, mineral)) {
            continue;
          }
          const roomOther = Game.rooms[roomOtherName];
          roomOther.memory.mineralOrder = roomOther.memory.mineralOrder || {};
          if (roomOther.memory.mineralOrder[room.name]) {
            break;
          }
          roomOther.memory.mineralOrder[room.name] = {type: mineral, amount: 1000};
          if (config.debug.mineral) {
            room.log('Ordering ' + mineral + ' from ' + roomOther.name);
          }
          break;
        }
      }
    }
  }
};

Room.prototype.handleTerminal = function() {
  if (!this.terminal) {
    return false;
  }

  this.orderMinerals();
  this.reactions();

  if (!this.memory.mineralOrder || Object.keys(this.memory.mineralOrder).length === 0) {
    return false;
  }

  const roomOtherName = Object.keys(this.memory.mineralOrder)[0];
  const order = this.memory.mineralOrder[roomOtherName];
  const linearDistanceBetweenRooms = Game.map.getRoomLinearDistance(this.name, roomOtherName);
  const energy = Math.ceil(0.1 * order.amount * linearDistanceBetweenRooms);

  if (this.terminal.store.energy < energy) {
    // this.log('Terminal not enough energy');
    return false;
  }

  if (this.terminal.store[order.type] < order.amount) {
    return false;
  }
  this.terminal.send(order.type, order.amount, roomOtherName);
  delete this.memory.mineralOrder[roomOtherName];
  return true;
};

Room.prototype.handleReaction = function() {
  if (!this.memory.reaction) {
    return false;
  }

  let labsToReact = this.findStructuresOfStructureType(STRUCTURE_LAB).filter((lab) => {
    if (lab.store[this.memory.reaction.result.first] > 0 || lab.store[this.memory.reaction.result.second] > 0) {
      return false;
    }
    return true;
  });

  if (labsToReact.length === 0) {
    return false;
  }

  const mineralCreep = this.findMyCreepsOfRole('mineral').length ? this.findMyCreepsOfRole('mineral')[0] : false;
  const cleanupNotEnoughResources = () => {
    if (mineralCreep && this.memory.reaction && this.memory.reaction.result) {
      if (!mineralCreep.checkLabEnoughMineral(lab1, this.memory.reaction.result.first) || !mineralCreep.checkLabEnoughMineral(lab2, this.memory.reaction.result.second)) {
        roles.mineral.cleanUpLabs(mineralCreep);
      }
    }
  };

  const lab0 = Game.getObjectById(this.memory.reaction.labs[0]);
  const lab1 = Game.getObjectById(this.memory.reaction.labs[1]);
  const lab2 = Game.getObjectById(this.memory.reaction.labs[2]);
  if (lab0 === null || lab1 === null || lab2 === null) {
    delete this.memory.reaction;
  } else {
    const labsToReactResponse = labsToReact.map((lab0) => {
      const inRange = lab0.pos.getRangeTo(lab1) < 3 && lab0.pos.getRangeTo(lab2) < 3;
      if (lab0.cooldown === 0 && inRange) {
        if (lab0.mineralAmount > lab0.mineralCapacity - 100 && this.memory.reaction) {
          this.memory.fullLab = 1;
          return 'ERR_FULL_LAB';
        }
        if (lab0.mineralAmount < 100) {
          this.memory.fullLab = 0;
        }
        const returnCode = lab0.runReaction(lab1, lab2);
        if (returnCode === ERR_NOT_ENOUGH_RESOURCES) {
          cleanupNotEnoughResources();
          return 'ERR_NOT_ENOUGH_RESOURCES';
        }
        if (returnCode === ERR_NOT_IN_RANGE) {
          return 'ERR_NOT_IN_RANGE';
        }
        if (returnCode === OK) {
          return 'OK';
        }
      } else {
        return false;
      }
    }).reduce((a, t) => a || t, false);

    if (this.memory.reaction && this.memory.reaction.result) {
      labsToReact = labsToReact.filter((s) => s.cooldown === 0 && s.store[this.memory.reaction.result.result]);
      if (config.debug.mineral && typeof labsToReactResponse !== 'undefined' && labsToReactResponse !== false && labsToReact.length > 1) {
        this.log(this.memory.reaction.result.result, labsToReactResponse, labsToReact);
      }
    }

    if (Game.time % 150 && this.isRoomReadyForMineralHandling()) {
      let amount = 1;
      // room has a lot energy in terminal; move energy to storage
      if (this.getEnergy() * 0.7 <= this.terminal.store.getUsedCapacity(RESOURCE_ENERGY)) {
        amount = 2;
      }
      this.checkRoleToSpawn('mineral', amount);
    }
  }
};
