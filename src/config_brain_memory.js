'use strict';

brain.prepareMemory = function() {
  Memory.username = Memory.username || _.find(Game.spawns, 'owner').owner.username;
  Memory.constructionSites = Memory.constructionSites || {};
  Memory.mineralSystemPrice = {};
  Memory.ordersBuy = _.filter(Game.market.getAllOrders(), function(object) {
    if (object.type != ORDER_BUY || object.resourceType == 'token') {
      return false;
    }
    }
    var patt = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
    var result = patt.exec(object.roomName);
    if (result[2] % 10 !== 0 && result[4] % 10 !== 0) {
      return false;
    }
    return true;
  });
  if (Game.time % config.constructionSite.maxIdleTime === 0) {
    for (let csId in Game.constructionSites) {
      let cs = Game.constructionSites[csId];
      let csMem = Memory.constructionSites[csId];
      if (csMem && csMem === cs.progress) {
        let csObject = Game.getObjectById(csId);
        let returnCode = csObject.remove();
        console.log('Delete constructionSite: ' + csId + '- - - return: ' + returnCode);
        continue;      }
      Memory.constructionSites[csId] = cs.progress;
    }
    console.log('Known constructionSites: ' + Object.keys(Memory.constructionSites).length);
  }
  // Cleanup memory
  for (let creepName in Memory.creeps) {
    if (!Game.creeps[creepName]) {
      var creepMemory = Memory.creeps[creepName];
      let role = creepMemory.role;
      let unit = role && roles[role];
      let diedFunction = unit && unit.died;
      let age = Game.time - creepMemory.born;
      let reserverEndLife = creepName.startsWith('reserver') && age < CREEP_CLAIM_LIFE_TIME;
      brain.stats.decreaseRole(role);
      console.log(creepName, 'Not in Game.creeps', age, Memory.creeps[creepName].base);
      if (diedFunction && age < CREEP_LIFE_TIME && !reserverEndLife && !creepMemory.killed) {
        diedFunction(creepName, creepMemory);
      }
      delete Memory.creeps[creepName];
    }
  }
  if (Game.time % 1500 === 0) {
    for (let squadId in Memory.squads) {
      let squad = Memory.squads[squadId];
      if (Game.time - squad.born > 3000) {
        console.log(`Delete squad ${squadId}`);
        delete Memory.squads[squadId];
      }
    }
  }

  if (Game.time % 300 === 0) {
    for (let roomName in Memory.rooms) {
      // Check for reserved rooms
      let roomMemory = Memory.rooms[roomName];
      let lastSeen = roomMemory.lastSeen;
      let timeSinceLost = lastSeen ? Game.time - lastSeen : -1;
      if (timeSinceLost === -1 || timeSinceLost > config.room.lastSeenThreshold) {
        console.log('Deleting ${romName} from memory. timeSinceLost: ', timeSinceLost);
        delete Memory.rooms[roomName];
      }
      }
    }
  }

  if (config.stats.summary) {
    var interval = 100;
    if (Game.time % interval === 0) {
      console.log('=========================');
      var diff = Game.gcl.progress - Memory.progress;
      Memory.progress = Game.gcl.progress;

      console.log('Progress: ', diff / interval, '/', Memory.myRooms.length * 15);
      console.log('ConstructionSites: ', Object.keys(Memory.constructionSites).length);
      console.log('-------------------------');

      var storage = {
        no: '',
        low: '',
        middle: '',
        high: '',
        power: ''
      };
      var upgradeLess = '';
      for (var id in Memory.myRooms) {
        let roomName = Memory.myRooms[id];
        let room = Game.rooms[roomName];
        let roomStorage = room && room.storage;
        if (!roomStorage) {
          storage.no += roomName + ' ';
          continue;
        }
        let storageEnergy = room.storage.store.energy;
        let storagePower = room.storage.store.power;
        if (storageEnergy < 200000) {
          storage.low += roomName + ':' + storageEnergy + ' ';
        } else if (storageEnergy >= 800000) {
          storage.high += roomName + ':' + storageEnergy + ' ';
        } else {
          storage.middle += roomName + ':' + storageEnergy + ' ';
        }
        if (storagePower && storagePower > 0) {
          storage.power += roomName + ':' + storagePower + ' ';
        }
        // TODO 15 it should be
        if (Math.ceil(room.memory.upgraderUpgrade / interval) < 15) {
          upgradeLess += roomName + ':' + room.memory.upgraderUpgrade / interval + ' ';
        }
        room.memory.upgraderUpgrade = 0;
      }
      console.log('No storage:', storage.no);
      console.log('Low storage:', storage.low);
      console.log('Middle storage:', storage.middle);
      console.log('High storage:', storage.high);
      console.log('-------------------------');
      console.log('Power storage:', storage.power);
      console.log('-------------------------');
      console.log('Upgrade less:', upgradeLess);
      console.log('=========================');
    }
  }
};
