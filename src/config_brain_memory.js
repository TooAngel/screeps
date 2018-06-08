'use strict';

brain.setMarketOrders = function() {
  Memory.orders = {};
  Memory.orders[ORDER_BUY] = {};
  Memory.orders[ORDER_SELL] = {};
  for (const order of Game.market.getAllOrders()) {
    if (order.resourceType === SUBSCRIPTION_TOKEN || Memory.myRooms.includes(order.roomName)) {
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
  const roomName = config.market.buyPowerRoom;
  // low cash
  if (Game.market.credits < config.market.minCredits || !roomName) {
    return false;
  }
  // deal one order
  const deal = function(item) {
    return Game.market.deal(item.id, 1000, roomName);
  };
  // if no cooldown
  if (Game.rooms[roomName].terminal && !Game.rooms[roomName].terminal.cooldown) {
    return _.map(Game.market.getAllOrders({type: ORDER_SELL, resourceType: RESOURCE_POWER}), deal);
  }
  return false;
};

brain.setConstructionSites = function() {
  if (!Memory.constructionSites) {
    Memory.constructionSites = {};
  }

  if (Game.time % config.constructionSite.maxIdleTime === 0) {
    const constructionSites = {};
    for (const csId of Object.keys(Game.constructionSites)) {
      const cs = Game.constructionSites[csId];
      const csMem = Memory.constructionSites[csId];
      if (csMem) {
        if (csMem === cs.progress) {
          console.log(csId + ' constructionSite too old');
          const csObject = Game.getObjectById(csId);
          const returnCode = csObject.remove();
          console.log('Delete constructionSite: ' + returnCode);
          continue;
        }
      }
      constructionSites[csId] = cs.progress;
    }
    Memory.constructionSites = constructionSites;
    console.log('Known constructionSites: ' + Object.keys(constructionSites).length);
  }
};

brain.addToStats = function(name) {
  const role = Memory.creeps[name].role;
  brain.stats.modifyRoleAmount(role, -1);
};

brain.handleUnexpectedDeadCreeps = function(name, creepMemory) {
  console.log(name, 'Not in Game.creeps', Game.time - creepMemory.born, Memory.creeps[name].base);
  if (Game.time - creepMemory.born < 20) {
    return;
  }

  if (!creepMemory.role) {
    delete Memory.creeps[name];
    return;
  }

  const unit = roles[creepMemory.role];
  if (!unit) {
    delete Memory.creeps[name];
    return;
  }
  if (unit.died) {
    if (unit.died(name, creepMemory)) {
      delete Memory.creeps[name];
    }
  } else {
    delete Memory.creeps[name];
  }
};

brain.cleanCreeps = function() {
  // Cleanup memory
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      brain.addToStats(name);
      if ((name.startsWith('reserver') && Memory.creeps[name].born < (Game.time - CREEP_CLAIM_LIFE_TIME)) || Memory.creeps[name].born < (Game.time - CREEP_LIFE_TIME)) {
        delete Memory.creeps[name];
        continue;
      }

      const creepMemory = Memory.creeps[name];
      if (creepMemory.killed) {
        delete Memory.creeps[name];
        continue;
      }

      brain.handleUnexpectedDeadCreeps(name, creepMemory);
    }
  }
};

brain.cleanSquads = function() {
  if (Game.time % 1500 === 0) {
    for (const squadId of Object.keys(Memory.squads)) {
      const squad = Memory.squads[squadId];
      if (Game.time - squad.born > 3000) {
        console.log(`Delete squad ${squadId}`);
        delete Memory.squads[squadId];
      }
    }
  }
};

brain.cleanRooms = function() {
  if (Game.time % 300 === 0) {
    for (const name of Object.keys(Memory.rooms)) {
      // Check for reserved rooms
      if (!Memory.rooms[name].lastSeen) {
        console.log('Deleting ' + name + ' from memory no `last_seen` value');
        delete Memory.rooms[name];
        continue;
      }
      if (Memory.rooms[name].lastSeen < Game.time - config.room.lastSeenThreshold) {
        console.log(`Deleting ${name} from memory older than ${config.room.lastSeenThreshold}`);
        delete Memory.rooms[name];
      }
    }
  }
};

brain.getStorageStringForRoom = function(strings, room, interval) {
  const addToString = function(variable, name, value) {
    strings[variable] += name + ':' + value + ' ';
  };

  if (room.storage.store[RESOURCE_ENERGY] < 200000) {
    addToString('storageLowString', room.name, room.storage.store[RESOURCE_ENERGY]);
  } else if (room.storage.store[RESOURCE_ENERGY] > 800000) {
    addToString('storageHighString', room.name, room.storage.store[RESOURCE_ENERGY]);
  } else {
    addToString('storageMiddleString', room.name, room.storage.store[RESOURCE_ENERGY]);
  }
  if (room.storage.store[RESOURCE_POWER] && room.storage.store[RESOURCE_POWER] > 0) {
    addToString('storagePower', room.name, room.storage.store[RESOURCE_POWER]);
  }
  // TODO 15 it should be
  if (Math.ceil(room.memory.upgraderUpgrade / interval) < 15) {
    addToString('upgradeLess', room.name, room.memory.upgraderUpgrade / interval);
  }
  room.memory.upgraderUpgrade = 0;
};

brain.printSummary = function() {
  const interval = 100;
  if (Game.time % interval !== 0) {
    return;
  }
  const diff = Game.gcl.progress - Memory.progress;
  Memory.progress = Game.gcl.progress;

  const strings = {
    storageNoString: '',
    storageLowString: '',
    storageMiddleString: '',
    storageHighString: '',
    storagePower: '',
    upgradeLess: '',
  };
  for (const name of Memory.myRooms) {
    const room = Game.rooms[name];
    if (!room || !room.storage) {
      strings.storageNoString += name + ' ';
      if (room) {
        room.memory.upgraderUpgrade = 0;
      }
      continue;
    }
    brain.getStorageStringForRoom(strings, room, interval);
  }
  Memory.summary = strings;

  console.log(`=========================
Progress: ${diff / interval}/${Memory.myRooms.length * 15}
ConstructionSites: ${Object.keys(Memory.constructionSites).length}
-------------------------
No storage: ${strings.storageNoString}
Low storage: ${strings.storageLowString}
Middle storage: ${strings.storageMiddleString}
High storage: ${strings.storageHighString}
-------------------------
Power storage: ${strings.storagePower}
-------------------------
Upgrade less: ${strings.upgradeLess}
=========================`);
};

brain.prepareMemory = function() {
  Memory.username = Memory.username || _.chain(Game.rooms).map('controller').flatten().filter('my').map('owner.username').first().value();
  Memory.myRooms = Memory.myRooms || [];
  Memory.squads = Memory.squads || {};
  Memory.skippedRooms = [];
  brain.setMarketOrders();
  brain.setConstructionSites();
  brain.cleanCreeps();
  brain.cleanSquads();
  brain.cleanRooms();
  if (config.stats.summary) {
    brain.printSummary();
  }
};

brain.cleanAllMemory = function() {
  const keys = _.map(_.keys(Memory), (value, key) => {
    if (key !== 'players') {
      delete Memory[key];
    }
    return key;
  });

  const rooms = _.map(Game.rooms, (room) => {
    return room.clearMemory();
  });
  console.log(Game.time, 'wiped memory for rooms ', rooms, ' and ', keys);
};
