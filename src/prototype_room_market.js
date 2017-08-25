const getAverage = (type, resource) => Memory.orders[type][resource] && Memory.orders[type][resource].totalPrice ? Memory.orders[type][resource].totalPrice / Memory.orders[type][resource].totalAmount : null;

Room.prototype.trySellOrders = function(resource, sellAmount) {
  const avgBuyPrice = getAverage(ORDER_BUY, resource);
  const avgSellPrice = getAverage(ORDER_SELL, resource);
  const mySellPrice = (avgBuyPrice || 1) * config.market.sellOrderPriceMultiplicator;
  if (!avgSellPrice || mySellPrice <= avgSellPrice) {
    const sellOrders = _.filter(Game.market.orders, order => order.type === ORDER_SELL && order.roomName === this.name && order.resourceType === resource);
    if (sellOrders.length > 0) {
      for (let order of sellOrders) {
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

Room.prototype.handleMarket = function() {
  if (!this.terminal) {
    return false;
  }

  const minerals = this.find(FIND_MINERALS);
  const resource = minerals[0].mineralType;

  if (!this.terminal.store[resource]) {
    return false;
  }

  if (this.terminal.store[resource] <= config.market.minAmount) {
    return false;
  }

  let sellAmount = this.terminal.store[resource] - config.market.minAmount;

  if (config.market.trySellOrders) {
    sellAmount = this.trySellOrders(resource, sellAmount);
  }

  if (sellAmount <= 0) {
    return true;
  }

  if (!Memory.orders[ORDER_BUY][resource]) {
    return false;
  }

  const sortByEnergyCostAndPrice = order => Game.market.calcTransactionCost(sellAmount, this.name, order.roomName) +
    -order.price * sellAmount / config.market.energyCreditEquivalent;

  const orders = _.sortBy(Memory.orders[ORDER_BUY][resource].orders, sortByEnergyCostAndPrice);
  for (let order of orders) {
    const amount = Math.min(sellAmount, order.remainingAmount);
    if (amount > 0) {
      if (Game.market.calcTransactionCost(amount, this.name, order.roomName) > this.terminal.store.energy) {
        break;
      }
      this.log(order.id, this.name, amount, order.price);
      let returnCode = Game.market.deal(order.id, amount, this.name);
      this.log('market.deal:', resource, returnCode);
      if (returnCode === OK) {
        break;
      }
    }
  }
  return true;
};
