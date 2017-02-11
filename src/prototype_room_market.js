Room.prototype.handleMarket = function() {
  if (!this.terminal) {
    return false;
  }

  let minerals = this.find(FIND_MINERALS);
  let resource = minerals[0].mineralType;

  if (!this.terminal.store[resource]) {
    return false;
  }

  if (this.terminal.store[resource] < config.mineral.minAmountForMarket) {
    return false;
  }

  // TODO Adapt amount
  let amount = this.terminal.store[resource];

  let myMineralOrders = function(object) {
    if (object.resourceType === resource) {
      return true;
    }
    return false;
  };

  let room = this;

  let sortByEnergyCost = function(order) {
    return Game.market.calcTransactionCost(amount, room.name, order.roomName);
  };

  let orders = _.sortBy(_.filter(Memory.ordersBuy, myMineralOrders), sortByEnergyCost);
  for (let order of orders) {
    //if (!Memory.mineralSystemPrice[order.resourceType] || order.price < Memory.mineralSystemPrice[order.resourceType]) {
    //  continue;
    //}

    if (Game.market.calcTransactionCost(amount, this.name, order.roomName) > this.terminal.store.energy) {
      //      this.log('Market: No energy');
      break;
    }
    this.log(order.id + ' ' + this.name + ' ' + amount);
    let returnCode = Game.market.deal(order.id, amount, this.name);
    this.log('market.deal: ' + resource + ' ' + returnCode);
    if (returnCode === OK) {
      break;
    }
  }
  return true;
};
