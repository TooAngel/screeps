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

Room.prototype.reactions = function() {
  if (!this.memory.reaction) {
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
  }

  if (this.getResourceAmountWithNextTiers(this.memory.reaction.result.result) > config.mineral.minAmount &&
    (this.terminal.store[this.memory.reaction.result.result] > config.mineral.minAmount)) {
    if (config.debug.mineral) {
      this.log('Done with reaction:' + this.memory.reaction.result.result);
    }
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

Room.prototype.orderMinerals = function() {
  if (this.executeEveryTicks(20)) {
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

    const room = this;

    for (const mineral of baseMinerals) {
      if (!this.terminal.store[mineral] || this.terminal.store[mineral] < 1000) {
        const roomsOther = findMyRoomsSortByDistance(this.name);

        for (const roomOtherName of roomsOther) {
          if (roomOtherName === this.name) {
            continue;
          }
          const roomOther = Game.rooms[roomOtherName];
          if (!roomOther || roomOther === null) {
            continue;
          }
          if (!roomOther.terminal || !roomOther.terminal.store[mineral] || roomOther.terminal.store[mineral] < 2000) {
            continue;
          }
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
