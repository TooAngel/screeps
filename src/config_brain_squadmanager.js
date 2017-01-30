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
  if (name === 'Invader') {
    return false;
  }

  value = value || 1;
  Memory.players = Memory.players || {};

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
  if (name === 'Source Keeper') {
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
    if (squad.action === 'move') {
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

/**
 * TODO atm addToQueue is only for squad creation usable
 * TODO check for queue.length split queue creation to all unused (or less than closestSpawn.memory.queue.length) spawns in range (e.g. under 6 rooms, move '6' to config or room.memory)
 *
 * @param {Array} spawns  Array of Objects like {creeps: 1, role: 'squadsiege'}
 * @param {String} roomNameFrom  pushing to Game.rooms[roomNameFrom].memory.queue
 * @param {String} roomNameTarget routing target
 * @param {String} squadName
 * @param {Number} [queueLimit] don't push if queueLimit is reached
 */
brain.addToQueue = function(spawns, roomNameFrom, roomNameTarget, squadName, queueLimit) {
  queueLimit = queueLimit || false;
  var outer = function(spawn) {
    return function _addToQueue(time) {
      if (queueLimit === false) {
        Game.rooms[roomNameFrom].memory.queue.push({
          role: spawn.role,
          routing: {
            targetRoom: roomNameTarget
          },
          squad: squadName
        });
      } else if (Game.rooms[roomNameFrom].memory.queue.length < queueLimit) {
        Game.rooms[roomNameFrom].memory.queue.push({
          role: spawn.role,
          routing: {
            targetRoom: roomNameTarget
          },
          squad: squadName
        });
      }
    };
  };

  for (let spawn of spawns) {
    _.times(spawn.creeps, outer(spawn));
  }
};
/**
 * brain.startSquad used to attack player.rooms
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 */
brain.startSquad = function(roomNameFrom, roomNameAttack) {
  let name = 'siegesquad-' + Math.random();
  let route = Game.map.findRoute(roomNameFrom, roomNameAttack);
  let target = roomNameFrom;
  if (route.length > 1) {
    target = route[route.length - 2].room;
  }
  Memory.squads = Memory.squads || {};

  var siegeSpawns = [{
    creeps: 1,
    role: 'squadsiege'
  }, {
    creeps: 3,
    role: 'squadheal'
  }];
  this.addToQueue(siegeSpawns, roomNameFrom, roomNameAttack, name);

  Memory.squads[name] = {
    born: Game.time,
    target: roomNameAttack,
    from: roomNameFrom,
    siege: {},
    heal: {},
    route: route,
    action: 'move',
    moveTarget: target
  };
};

/**
 * brain.startMeleeSquad use to clean rooms from invaders and players
 *
 * @param {String} roomNameFrom
 * @param {String} roomNameAttack
 * @param {Array} [spawns]
 */
brain.startMeleeSquad = function(roomNameFrom, roomNameAttack, spawns) {
  let name = 'meleesquad-' + Math.random();
  let route = Game.map.findRoute(roomNameFrom, roomNameAttack);
  let target = roomNameFrom;
  if (route.length > 1) {
    target = route[route.length - 2].room;
  }
  Memory.squads = Memory.squads || {};
  // TODO check for queue length
  let meleeSpawn = [{
    creeps: 1,
    role: 'autoattackmelee'
  }, {
    creeps: 1,
    role: 'squadheal'
  }, {
    creeps: 2,
    role: 'autoattackmelee'
  }, {
    creeps: 2,
    role: 'squadheal'
  }];

  spawns = spawns || meleeSpawn;
  this.addToQueue(spawns, roomNameFrom, roomNameAttack, name);

  Memory.squads[name] = {
    born: Game.time,
    target: roomNameAttack,
    from: roomNameFrom,
    autoattackmelee: {},
    heal: {},
    route: route,
    action: 'move',
    moveTarget: target
  };
};
