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
      // this.debugLog('mineral', 'Could build: ' + mineralFirst + ' ' + mineralSecond + ' ' + result, amount);
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
    return false;
  }

  const labs = this.findLabs();
  if (labs.length < 3) {
    return false;
  }
  this.memory.reaction = {
    result: result,
    labs: [
      labs[0].id, // This is a easy quickfix, let's see if it just works
      labs[1].id,
      labs[2].id,
    ],
  };
  this.debugLog('mineral', 'Setting reaction: ' + JSON.stringify(this.memory.reaction));
};

Room.prototype.reactions = function() {
  if (this.memory.boosts && Object.keys(this.memory.boosts).length > 0) {
    return false;
  }
  if (!this.memory.reaction) {
    return this.reactionsWithoutReaction();
  }

  // if (this.getResourceAmountWithNextTiers(this.memory.reaction.result.result) > config.mineral.minAmount &&
  if ((this.terminal.store[this.memory.reaction.result.result] > config.mineral.minAmount)) {
    this.debugLog('mineral', 'Done with reaction:' + this.memory.reaction.result.result);
    delete this.memory.reaction;
    return;
  }

  const reaction = this.memory.reaction;
  const lab0 = Game.getObjectById(reaction.labs[0]);
  if (!lab0) {
    this.debugLog('mineral', `reactions no lab0 ${JSON.stringify(reaction)}`);
    delete this.memory.reaction;
    return;
  }
  if (lab0.cooldown) {
    return;
  }
  const lab1 = Game.getObjectById(reaction.labs[1]);
  const lab2 = Game.getObjectById(reaction.labs[2]);
  lab0.runReaction(lab1, lab2);
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
