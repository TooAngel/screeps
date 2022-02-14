'use strict';

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
          console.log(Game.time, csId + ' constructionSite too old');
          const csObject = Game.getObjectById(csId);
          const returnCode = csObject.remove();
          console.log(Game.time, 'Delete constructionSite: ' + returnCode);
          continue;
        }
      }
      constructionSites[csId] = cs.progress;
    }
    Memory.constructionSites = constructionSites;
    brain.debugLog('constructionSites', `Known constructionSites: ${Object.keys(constructionSites).length}`);
  }
};

brain.addToStats = function(name) {
  const role = Memory.creeps[name].role;
  brain.stats.modifyRoleAmount(role, -1);
};

brain.handleUnexpectedDeadCreeps = function(name, creepMemory) {
  let data = {};
  if (creepMemory.room) {
    data = global.data.rooms[creepMemory.room];
  } else {
    console.log(`${Game.time} ${name} handleUnexpectedDeadCreeps no creepMemory.room creepMemory: ${JSON.stringify(creepMemory)} data: ${JSON.stringify(global.data.creeps[name])}`);
  }

  brain.debugLog(`${Game.time} ${creepMemory.room} ${name} memory hostile: ${data.hostileCreepCount}`);
  if (data.hostileCreepCount > 0) {
    brain.debugLog('brain', `${creepMemory.room} ${name} Not in Game.creeps with hostiles lived ${Game.time - creepMemory.born} hostiles: ${data.hostileCreepCount} - I guess killed by hostile`); // eslint-disable-line max-len
  } else {
    console.log(`${Game.time} ${creepMemory.room} ${name} Not in Game.creeps without hostiles lived ${Game.time - creepMemory.born} hostiles: ${data.hostileCreepCount}`); // eslint-disable-line max-len
  }

  if (Game.time - creepMemory.born < 20) {
    return;
  }

  if (!creepMemory.role) {
    delete Memory.creeps[name];
    delete global.data.creeps[name];
    return;
  }

  const unit = roles[creepMemory.role];
  if (!unit) {
    delete Memory.creeps[name];
    delete global.data.creeps[name];
    return;
  }
  if (unit.died) {
    if (unit.died(name, creepMemory)) {
      delete Memory.creeps[name];
      delete global.data.creeps[name];
    }
  } else {
    delete Memory.creeps[name];
    delete global.data.creeps[name];
  }
};

brain.cleanCreeps = function() {
  // Cleanup memory
  if (!Memory.creeps) {
    return;
  }
  for (const name of Object.keys(Memory.creeps)) {
    if (Game.creeps[name]) {
      continue;
    }

    brain.addToStats(name);
    if ((name.startsWith('reserver') && Memory.creeps[name].born < (Game.time - CREEP_CLAIM_LIFE_TIME)) ||
        (name.startsWith('claimer') && Memory.creeps[name].born < (Game.time - CREEP_CLAIM_LIFE_TIME)) ||
        Memory.creeps[name].born < (Game.time - CREEP_LIFE_TIME)) {
      delete Memory.creeps[name];
      delete global.data.creeps[name];
      continue;
    }

    const creepMemory = Memory.creeps[name];
    if (creepMemory.killed) {
      delete Memory.creeps[name];
      delete global.data.creeps[name];
      continue;
    }

    if (creepMemory.recycle) {
      delete Memory.creeps[name];
      delete global.data.creeps[name];
      continue;
    }

    brain.handleUnexpectedDeadCreeps(name, creepMemory);
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
      // TODO lastSeen moved to global.data - so we should check this, also Memory.rooms should only exist for myRooms
      if (!Memory.rooms[name].lastSeen && Object.keys(Memory.rooms[name]).length > 0) {
        console.log(`${Game.time} Deleting ${name} from memory no 'lastSeen' value, keys: ${JSON.stringify(Object.keys(Memory.rooms[name]))}`);
        delete Memory.rooms[name];
        continue;
      }
      if (Memory.rooms[name].lastSeen < Game.time - config.room.lastSeenThreshold && Memory.myRooms.indexOf(name) < 0) {
        console.log(Game.time, `Deleting ${name} from memory older than ${config.room.lastSeenThreshold}`);
        delete Memory.rooms[name];
      }
      if (Memory.myRooms.indexOf(name) < 0) {
        console.log(Game.time, `Deleting ${name} from memory, no myRoom ${JSON.stringify(Memory.rooms[name])}`);
        delete Memory.rooms[name];
      }
    }
  }
};

brain.getStorageStringForRoom = function(strings, room) {
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
    brain.getStorageStringForRoom(strings, room);
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
