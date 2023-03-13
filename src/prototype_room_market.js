Room.prototype.sellByOwnOrders = function(resource, sellAmount) {
  const avgBuyPrice = brain.getMarketOrderAverage(ORDER_BUY, resource);
  const avgSellPrice = brain.getMarketOrderAverage(ORDER_SELL, resource);
  const mySellPrice = Math.max((avgBuyPrice || 1) * config.market.sellOrderPriceMultiplicand, config.market.minSellPrice);
  if (!avgSellPrice || mySellPrice <= avgSellPrice) {
    const sellOrders = _.filter(Game.market.orders, (order) => order.type === ORDER_SELL && order.roomName === this.name && order.resourceType === resource);
    if (sellOrders.length > 0) {
      for (const order of sellOrders) {
        if (sellAmount <= 0) {
          break;
        }
        if (order.active) {
          sellAmount -= order.remainingAmount;
        } else if (order.remainingAmount === 0) {
          Game.market.cancelOrder(order.id);
        }
      }
    } else {
      const amount = Math.min(config.market.sellOrderMaxAmount, sellAmount);
      if (mySellPrice * amount * 0.05 < Game.market.credits) {
        const retType = Game.market.createOrder(ORDER_SELL, resource, mySellPrice, amount, this.name);
        this.log('market.createOrder', ORDER_SELL, resource, mySellPrice, amount, this.name);
        if (retType === OK) {
          sellAmount -= amount;
        } else {
          this.log('market.createOrder: ', retType);
        }
      }
    }
    sellAmount -= config.market.sellOrderReserve;
  }
  return sellAmount;
};

Room.prototype.sellByOthersOrders = function(sellAmount, resource, force) {
  const sortByEnergyCostAndPrice = (order) => Game.market.calcTransactionCost(sellAmount, this.name, order.roomName) +
  -order.price * sellAmount / config.market.energyCreditEquivalent;
  if (Memory.orders[ORDER_BUY][resource]) {
    const orders = _.sortBy(Memory.orders[ORDER_BUY][resource].orders, sortByEnergyCostAndPrice);
    for (const order of orders) {
      const amount = Math.min(sellAmount, order.remainingAmount);
      if (amount > 0 && (order.price >= config.market.minSellPrice || force)) {
        if (Game.market.calcTransactionCost(amount, this.name, order.roomName) > this.terminal.store.energy) {
          break;
        }
        if (force && amount < 1000) {
          return false;
        }
        const returnCode = Game.market.deal(order.id, amount, this.name);
        if (returnCode !== ERR_TIRED) {
          this.debugLog('market', `selling ${order.id} ${resource} ${this.name} ${amount} ${order.price}  ${returnCode === OK}`);
        }
        if (returnCode === OK) {
          break;
        }
      }
    }
  }
};

Room.prototype.sellOwnMineral = function() {
  const resource = this.getMineralType();
  let force = false;
  if (!this.terminal.store[resource]) {
    return false;
  }

  if (this.terminal.store[resource] <= config.market.minAmountToSell) {
    return false;
  }

  let sellAmount = this.terminal.store[resource] - config.market.minAmountToSell;

  if (config.market.sellByOwnOrders) {
    sellAmount = this.sellByOwnOrders(resource, sellAmount);
  }

  if (sellAmount <= 0) {
    return true;
  }

  if (_.sum(this.terminal.store) > this.terminal.storeCapacity * 0.9) {
    force = true;
  }
  this.sellByOthersOrders(sellAmount, resource, force);
  return true;
};

Room.prototype.buyByOthersOrders = function(resource) {
  const avgBuyPrice = brain.getMarketOrderAverage(ORDER_BUY, resource);
  const myBuyPrice = Math.min((avgBuyPrice || 1) * config.market.buyOrderPriceMultiplicand, config.market.maxBuyPrice);
  const buyAmount = config.market.maxAmountToBuy - (this.terminal.store[resource] || 0);

  const sortByEnergyCost = (order) => Game.market.calcTransactionCost(buyAmount, this.name, order.roomName);
  const orders = _.sortBy(_.filter(Memory.orders[ORDER_SELL][resource].orders, (o) => o.price <= myBuyPrice), sortByEnergyCost);

  for (const order of orders) {
    const amount = Math.min(buyAmount, order.remainingAmount);
    if (amount > 0) {
      if (Game.market.calcTransactionCost(amount, this.name, order.roomName) > this.terminal.store.energy) {
        break;
      }
      if (config.debug.market) {
        this.log('BUY', order.resourceType, order.id, order.roomName, '=>', this.name, amount, order.price);
      }
      const returnCode = Game.market.deal(order.id, amount, this.name);
      if (returnCode === OK) {
        break;
      } else if (returnCode !== ERR_TIRED) {
        this.log('market.deal:', resource, returnCode);
      }
    }
  }
};

Room.prototype.buyLowResources = function() {
  for (const resource in Memory.orders[ORDER_SELL]) {
    if (!this.terminal[resource] || this.terminal[resource] < config.market.maxAmountToBuy) {
      // this.buyByOwnOrders(resource);
      this.buyByOthersOrders(resource);
    }
  }
};

Room.prototype.buyLowCostResources = function() {
  if ((Game.market.credits < config.market.minCredits) || (this.terminal.cooldown > 0)) {
    return false;
  }
  const room = this.name;
  const resource = this.memory.mineralType;
  if (this.terminal.store[resource] > 10000) {
    return false;
  }
  const orders = _.sortBy(Game.market.getAllOrders({type: ORDER_SELL, resourceType: resource}), ['price'], ['asc']);

  const checkForDeal = (item) => {
    const range = Game.map.getRoomLinearDistance(item.roomName, room, true);
    if (item.price < 1 && range < 20 && ((item.resourceType === 'O') || (item.resourceType === 'H'))) {
      Game.market.deal(item.id, 1000, room);
    }
  };
  _.map(orders, checkForDeal);
};

/**
 * sends 100 power to every room with a terminal
 */
Room.prototype.sendPowerOwnRooms = function() {
  if (this.terminal && this.terminal.cooldown === 0 && this.terminal.store[RESOURCE_POWER] > 100) {
    let sendOnce = false;
    const powerTransfer = _.map(_.shuffle(Memory.myRooms), (myRoom) => {
      if (!Game.rooms[myRoom]) {
        return false;
      }
      if (Game.rooms[myRoom].terminal && !sendOnce) {
        if (!Game.rooms[myRoom].terminal.store[RESOURCE_POWER] ||
          (Game.rooms[myRoom].terminal.store[RESOURCE_POWER] < 100)) {
          sendOnce = true;
          return {
            success: this.terminal.send(RESOURCE_POWER,
              _.min([this.terminal.store[RESOURCE_POWER] - 100, 100]),
              myRoom,
              'trade power ' + this.name + ' ' + myRoom) === OK,
            from: this.name,
            to: myRoom,
          };
        }
        return {
          amount: Game.rooms[myRoom].terminal.store[RESOURCE_POWER],
          room: myRoom,
        };
      }
      return false;
    });
    if (config.debug.power) {
      this.log('powerTransfer', JSON.stringify(powerTransfer, null, 2));
    }
  }
};

Room.prototype.canSendEnergyToMyRooms = function() {
  return (_.size(Memory.needEnergyRooms) > 0) && (_.size(Memory.canHelpRooms) > 0) && _.includes(Memory.canHelpRooms, this.name) && (this.terminal.store[RESOURCE_ENERGY] > config.terminal.minEnergyAmount);
};

Room.prototype.sendEnergyAmountToMyRoom = function() {
  const min = 100;
  const max = this.terminal.store[RESOURCE_ENERGY];
  const amount = (this.terminal.store[RESOURCE_ENERGY] - config.terminal.minEnergyAmount) * 100;
  return (min < amount && amount < max) ? amount : false;
};

Room.prototype.sendEnergyToMyRooms = function() {
  if (this.canSendEnergyToMyRooms()) {
    const myRoom = _.shuffle(Memory.needEnergyRooms)[0];
    const room = Game.rooms[myRoom];
    if (!room) {
      Memory.needEnergyRooms.splice( Memory.needEnergyRooms.indexOf(myRoom), 1 );
      return;
    }
    const amount = this.sendEnergyAmountToMyRoom();
    const shouldSendEnergyToRoom = Game.rooms[myRoom].terminal && (Game.rooms[myRoom].terminal.store[RESOURCE_ENERGY] < config.terminal.maxEnergyAmount);
    if (shouldSendEnergyToRoom) {
      const success = OK === this.terminal.send(RESOURCE_ENERGY, amount, myRoom, 'send energy ' + this.name + ' ' + myRoom);
      if (success) {
        const cost = Game.market.calcTransactionCost(amount, this.name, myRoom);
        this.debugLog('market', 'sendEnergyToMyRooms', myRoom, amount, cost, this.terminal.store[RESOURCE_ENERGY]);
        return true;
      } else {
        this.debugLog('market', 'FAILED:sendEnergyToMyRooms', myRoom, amount, this.terminal.store[RESOURCE_ENERGY]);
      }
    }
  }
  return false;
};

Room.prototype.handleMarket = function() {
  if (!this.terminal || this.terminal.cooldown) {
    return false;
  }
  this.sellOwnMineral();
  this.buyLowResources();
  this.buyLowCostResources();
  if (config.market.sendPowerOwnRoom) {
    this.sendPowerOwnRooms();
  }

  // fixes full storage with 90% energy
  if (config.market.sendEnergyToMyRooms) {
    this.sendEnergyToMyRooms();
  }
};
