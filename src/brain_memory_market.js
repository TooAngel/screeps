'use strict';


const {debugLog} = require('./logging');
const {addToReputation} = require('./diplomacy');
const {checkQuestForAcceptance} = require('./quests_host');
const {checkAppliedQuestForAcceptance} = require('./quests_player');

brain.setMarketOrders = function() {
  Memory.orders = {};
  Memory.orders[ORDER_BUY] = {};
  Memory.orders[ORDER_SELL] = {};
  for (const order of Game.market.getAllOrders()) {
    if (Memory.myRooms.includes(order.roomName)) {
      continue;
    }
    let category = Memory.orders[order.type][order.resourceType];
    if (!category) {
      Memory.orders[order.type][order.resourceType] = category = {
        min: order.price,
        max: order.price,
        totalPrice: 0,
        totalAmount: 0,
        orders: [],
      };
    }
    category.min = Math.min(category.min, order.price);
    category.max = Math.max(category.max, order.price);
    category.totalPrice += order.price * order.remainingAmount;
    category.totalAmount += order.remainingAmount;
    category.orders.push(order);
  }
};

brain.getMarketOrderAverage = (type, resource) => Memory.orders[type][resource] && Memory.orders[type][resource].totalPrice ? Memory.orders[type][resource].totalPrice / Memory.orders[type][resource].totalAmount : null;

brain.getMarketOrder = (type, resource, property) => Memory.orders[type][resource] && Memory.orders[type][resource][property] ? Memory.orders[type][resource][property] : null;

brain.buyPower = function() {
  if (!config.market.buyPower) {
    return false;
  }
  debugLog('brain', 'buyPower');
  const filterRoomPowerSpawn = (r) => Game.rooms[r] && Game.rooms[r].controller.level === 8 && Memory.rooms[r] && Memory.rooms[r].constants && !!Memory.rooms[r].constants.powerSpawn;
  const roomName = _.first(_.filter(_.shuffle(Memory.myRooms), filterRoomPowerSpawn)) || false;
  // low cash
  if (Game.market.credits < config.market.minCredits || !roomName) {
    return false;
  }
  // deal one order
  const deal = function(item) {
    if (item.price < 1) {
      return Game.market.deal(item.id, 1000, roomName);
    }
    return false;
  };
  // if no cooldown
  if (Game.rooms[roomName].terminal && !Game.rooms[roomName].terminal.cooldown) {
    return _.map(Game.market.getAllOrders({type: ORDER_SELL, resourceType: RESOURCE_POWER}), deal);
  }
  return false;
};

brain.handleIncomingTransactionsByUser = function(transaction) {
  const sender = transaction.sender.username;
  if (sender === Memory.username) {
    return false;
  }
  const price = brain.getMarketOrder(ORDER_SELL, transaction.resourceType, 'min') || brain.getMarketOrder(ORDER_BUY, transaction.resourceType, 'max') || 1;
  const value = transaction.amount * price;
  const room = Game.rooms[transaction.to];
  room.debugLog('market', `Incoming transaction from ${sender}[${transaction.from}] ${transaction.amount} ${transaction.resourceType} market price: ${price}`);
  addToReputation(sender, value);
  return true;
};

brain.handleIncomingTransactionsTimeFilter = (object) => {
  // TODO save last checked value, so we will see all transactions even in case of CPU-skipped ticks
  return object.time >= Game.time - 1;
};

brain.handleIncomingTransactions = function() {
  const transactions = Game.market.incomingTransactions;
  const current = _.filter(transactions, brain.handleIncomingTransactionsTimeFilter);

  for (const transaction of current) {
    if (transaction.sender) {
      brain.handleIncomingTransactionsByUser(transaction);
    }
    checkQuestForAcceptance(transaction);
    checkAppliedQuestForAcceptance(transaction);
  }
};
