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

brain.handleDiedFastCreep = function(creepMemory) {
  return Game.time - creepMemory.born < 20;
};

brain.handleDiedNoRoleCreep = function(creepMemory) {
  return !!(!creepMemory.role || !roles[creepMemory.role]);
};

brain.handleDiedCreep = function(name, creepMemory) {
  const role = roles[creepMemory.role];
  if (role.died) {
    if (typeof role.died === 'boolean' && role.died === true) {
      console.log('--->', name, JSON.stringify(creepMemory), 'Died naturally?');
    }
    if (typeof role.died === 'function') {
      role.died(name, creepMemory);
    }
  }
};

brain.handleDiedCreepLog = function(name, creepMemory) {
  const baseRoomName = Memory.creeps[name].base;
  let baseRoom = Game.rooms[baseRoomName];
  if (!baseRoom) {
    baseRoom = console;
  }
  baseRoom.log(Game.time, name, 'Not in Game.creeps', Game.time - creepMemory.born, Memory.creeps[name].base);
};

brain.handleUnexpectedDeadCreeps = function(name, creepMemory) {
  brain.handleDiedCreepLog(name, creepMemory);

  if (brain.handleDiedFastCreep(creepMemory)) {
    return false;
  }

  if (brain.handleDiedNoRoleCreep(creepMemory)) {
    delete Memory.creeps[name];
    return false;
  }

  brain.handleDiedCreep(name, creepMemory);
  delete Memory.creeps[name];
  return false;
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

  if (room.storage.store.energy < 200000) {
    addToString('storageLowString', room.name, room.storage.store.energy);
  } else if (room.storage.store.energy > 800000) {
    addToString('storageHighString', room.name, room.storage.store.energy);
  } else {
    addToString('storageMiddleString', room.name, room.storage.store.energy);
  }
  if (room.storage.store.power && room.storage.store.power > 0) {
    addToString('storagePower', room.name, room.storage.store.power);
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
      continue;
    }
    brain.getStorageStringForRoom(strings, room, interval);
  }

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
  brain.setMarketOrders();
  brain.setConstructionSites();
  brain.cleanCreeps();
  brain.cleanSquads();
  brain.cleanRooms();
  if (config.stats.summary) {
    brain.printSummary();
  }
};
