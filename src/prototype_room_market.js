Room.prototype.sellByOwnOrders = function(resource, sellAmount) {
  const avgBuyPrice = brain.getMarketOrderAverage(ORDER_BUY, resource);
  const avgSellPrice = brain.getMarketOrderAverage(ORDER_SELL, resource);
  const mySellPrice = Math.max((avgBuyPrice || 1) * config.market.sellOrderPriceMultiplicator, config.market.minSellPrice);
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
      const retType = Game.market.createOrder(ORDER_SELL, resource, mySellPrice, amount, this.name);
      this.log('market.createOrder', ORDER_SELL, resource, mySellPrice, amount, this.name);
      if (retType === OK) {
        sellAmount -= amount;
      } else {
        this.log('market.createOrder: ', retType);
      }
    }
    sellAmount -= config.market.sellOrderReserve;
  }
  return sellAmount;
};

Room.prototype.sellByOthersOrders = function(sellAmount, resource) {
  const sortByEnergyCostAndPrice = (order) => Game.market.calcTransactionCost(sellAmount, this.name, order.roomName) +
    -order.price * sellAmount / config.market.energyCreditEquivalent;
  if (Memory.orders[ORDER_BUY][resource]) {
    const orders = _.sortBy(Memory.orders[ORDER_BUY][resource].orders, sortByEnergyCostAndPrice);
    for (const order of orders) {
      const amount = Math.min(sellAmount, order.remainingAmount);
      if (amount > 0 && order.price >= config.market.minSellPrice) {
        if (Game.market.calcTransactionCost(amount, this.name, order.roomName) > this.terminal.store.energy) {
          break;
        }
        this.log(order.id, this.name, amount, order.price);
        const returnCode = Game.market.deal(order.id, amount, this.name);
        this.log('market.deal:', resource, returnCode);
        if (returnCode === OK) {
          break;
        }
      }
    }
  }
};

Room.prototype.sellOwnMineral = function() {
  const resource = this.getMineralType();

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
  this.sellByOthersOrders(sellAmount, resource);
  return true;
};

Room.prototype.buyByOthersOrders = function(resource) {
  const avgBuyPrice = brain.getMarketOrderAverage(ORDER_BUY, resource);
  const myBuyPrice = Math.min((avgBuyPrice || 1) * config.market.buyOrderPriceMultiplicator, config.market.maxBuyPrice);
  const buyAmount = config.market.maxAmountToBuy - (this.terminal.store[resource] || 0);

  const sortByEnergyCost = (order) => Game.market.calcTransactionCost(buyAmount, this.name, order.roomName);
  const orders = _.sortBy(_.filter(Memory.orders[ORDER_SELL][resource].orders, (o) => o.price <= myBuyPrice), sortByEnergyCost);

  for (const order of orders) {
    const amount = Math.min(buyAmount, order.remainingAmount);
    if (amount > 0) {
      if (Game.market.calcTransactionCost(amount, this.name, order.roomName) > this.terminal.store.energy) {
        break;
      }
      this.log('BUY', order.id, this.name, amount, order.price);
      const returnCode = Game.market.deal(order.id, amount, this.name);
      this.log('market.deal:', resource, returnCode);
      if (returnCode === OK) {
        break;
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

Room.prototype.handleMarket = function() {
  if (!this.terminal) {
    return false;
  }

  this.sellOwnMineral();
  this.buyLowResources();
};
