'use strict';

Room.prototype.isMineralInStorage = function() {
  return Object.keys(this.storage.store).some(resource => resource !== RESOURCE_ENERGY && resource !== RESOURCE_POWER);
};

Room.prototype.getNextReaction = function() {
  for (let mineralFirst in this.terminal.store) {
    if (!REACTIONS[mineralFirst] || this.terminal.store[mineralFirst] < LAB_REACTION_AMOUNT) {
      continue;
    }
    for (let mineralSecond in this.terminal.store) {
      if (!REACTIONS[mineralFirst][mineralSecond] || this.terminal.store[mineralSecond] < LAB_REACTION_AMOUNT) {
        continue;
      }
      const result = REACTIONS[mineralFirst][mineralSecond];
      const resultOH = REACTIONS[RESOURCE_HYDROXIDE][result];
      const resultXOH = REACTIONS[RESOURCE_CATALYST][resultOH];
      const resultX = REACTIONS[RESOURCE_CATALYST][result];
      let amount = this.terminal.store[result];
      amount += this.terminal.store[resultOH] || 0;
      amount += this.terminal.store[resultXOH] || 0;
      amount += this.terminal.store[resultX] || 0;
      if (amount > config.mineral.minAmount) {
        continue;
      }
      if (config.debug.mineral) {
        this.log('Could build: ' + mineralFirst + ' ' + mineralSecond + ' ' + result, amount);
      }
      return {
        result: result,
        first: mineralFirst,
        second: mineralSecond
      };
    }
  }
  return false;
};

Room.prototype.reactions = function() {
  if (!this.memory.reaction) {
    let result = this.getNextReaction();
    if (!result) {
      return;
    }

    let labsAll = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_LAB], false, {
      filter: object => !object.mineralType || object.mineralType === result.result
    });

    let lab;
    let labs = [];
    let getNearLabs = function(object) {
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
      let labsNear = lab.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 2, 'structureType', [STRUCTURE_LAB], false, {
        filter: getNearLabs
      });

      if (labsNear.length >= 2) {
        labs.push(lab.id);
        //        console.log(lab.mineralType, result.result);

        for (let labNear of labsNear) {
          if (!labNear.mineralType || labNear.mineralType === result.first) {
            //            console.log(labNear.mineralType, result.first);
            labs.push(labNear.id);
            break;
          }
        }
        for (let labNear of labsNear) {
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
      labs: labs
    };
    //    this.log('Setting reaction: ' + JSON.stringify(this.memory.reaction));
  }

  if (this.terminal.store[this.memory.reaction.result.result] > config.mineral.minAmount) {
    this.log('Done with reaction:' + this.memory.reaction.result.result);
    delete this.memory.reaction;
  }
};

Room.prototype.orderMinerals = function() {
  if (this.exectueEveryTicks(20)) {
    let baseMinerals = [
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
      RESOURCE_GHODIUM
    ];

    let room = this;
    let orderByDistance = function(object) {
      return Game.map.getRoomLinearDistance(room.name, object);
    };

    for (let mineral of baseMinerals) {
      if (!this.terminal.store[mineral] || this.terminal.store[mineral] < 1000) {
        let roomsOther = _.sortBy(Memory.myRooms, orderByDistance);

        for (let roomOtherName of roomsOther) {
          if (roomOtherName === this.name) {
            continue;
          }
          let roomOther = Game.rooms[roomOtherName];
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

  let roomOtherName = Object.keys(this.memory.mineralOrder)[0];
  let roomOther = Game.rooms[roomOtherName];
  let order = this.memory.mineralOrder[roomOtherName];
  let linearDistanceBetweenRooms = Game.map.getRoomLinearDistance(this.name, roomOtherName);
  let energy = Math.ceil(0.1 * order.amount * linearDistanceBetweenRooms);

  if (this.terminal.store.energy < energy) {
    //this.log('Terminal not enough energy');
    this.memory.terminalTooLessEnergy = true;
    return false;
  }

  this.memory.terminalTooLessEnergy = false;

  if (this.terminal.store[order.type] < order.amount) {
    return false;
  }
  this.terminal.send(order.type, order.amount, roomOtherName);
  delete this.memory.mineralOrder[roomOtherName];
  return true;
};
