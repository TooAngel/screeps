'use strict';

brain.handleIncomingTransactions = function() {
  let transactions = Game.market.incomingTransactions;
  let current = _.filter(transactions, function(object) {
    return object.time >= Game.time - 1;
  });

  for (let transaction of current) {
    let sender = transaction.sender.username;
    let orders = Game.market.getAllOrders({
      type: ORDER_SELL,
      resourceType: transaction.resourceType
    });
    let prices = _.sortBy(orders, function(object) {
      return object.price;
    });
    let price = prices[0].price;
    let value = -1 * transaction.amount * price;
    console.log(`Incoming transaction from ${sender} with ${transaction.amount} ${transaction.resourceType} market price: ${price}`);
    brain.increaseIdiot(sender, value);
  }
};

brain.increaseIdiot = function(name, value) {
  if (name == 'Invader') {
    return false;
  }

  if (!value) {
    value = 1;
  }
  if (!Memory.players[name]) {
    Memory.players[name] = {
      name: name,
      rooms: {},
      level: 0,
      counter: 0,
      idiot: 0
    };
  }

  if (!Memory.players[name].idiot) {
    Memory.players[name].idiot = 0;
  }

  Memory.players[name].idiot += value;
};

brain.isFriend = function(name) {
  if (!Memory.players) {
    Memory.players = {};
  }

  if (friends.indexOf(name) > -1) {
    return true;
  }
  if (!Memory.players[name]) {
    return true;
  }
  if (!Memory.players[name].idiot) {
    return true;
  }
  if (Memory.players[name].idiot <= 0) {
    return true;
  }
  if (name == 'Source Keeper') {
    return true;
  }
  return false;
};

brain.handleSquadmanager = function() {
  for (let squadIndex in Memory.squads) {
    let squad = Memory.squads[squadIndex];
    if (Object.keys(squad.siege).length === 0) {
      return true;
    }
    if (squad.action == 'move') {
      for (let siegeId in squad.siege) {
        let siege = squad.siege[siegeId];
        if (!siege.waiting) {
          return true;
        }
      }
      for (let healId in squad.heal) {
        let heal = squad.heal[healId];
        if (!heal.waiting) {
          return true;
        }
      }

      squad.action = 'attack';
    }
  }
};

brain.startSquad = function(roomNameFrom, roomNameAttack) {

  let route = Game.map.findRoute(roomNameFrom, roomNameAttack);
  let target = roomNameFrom;
  if (route.length > 1) {
    target = route[route.length - 2].room;
  }

  if (!Memory.squads) {
    Memory.squads = {};
  }
  let name = Math.random();

  Game.rooms[roomNameFrom].memory.queue.push({
    role: 'squadsiege',
    target: roomNameAttack,
    squad: name
  });
  Game.rooms[roomNameFrom].memory.queue.push({
    role: 'squadheal',
    target: roomNameAttack,
    squad: name
  });
  Game.rooms[roomNameFrom].memory.queue.push({
    role: 'squadheal',
    target: roomNameAttack,
    squad: name
  });
  Game.rooms[roomNameFrom].memory.queue.push({
    role: 'squadheal',
    target: roomNameAttack,
    squad: name
  });
  let squad = {
    born: Game.time,
    target: roomNameAttack,
    from: roomNameFrom,
    siege: {},
    heal: {},
    route: route,
    action: 'move',
    moveTarget: target
  };
  Memory.squads[name] = squad;
};
