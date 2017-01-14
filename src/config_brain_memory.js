'use strict';

brain.prepareMemory = function() {
  Memory.mineralSystemPrice = {};
  Memory.ordersBuy = _.filter(Game.market.getAllOrders(), function(object) {
    if (object.type != ORDER_BUY) {
      return false;
    }
    if (object.resourceType == 'token') {
      return false;
    }
    var patt = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
    var result = patt.exec(object.roomName);
    if (result[2] % 10 !== 0 && result[4] % 10 !== 0) {
      return false;
    }
    return true;
  });

  if (!Memory.constructionSites) {
    Memory.constructionSites = {};
  }

  if (Game.time % config.constructionSite.maxIdleTime === 0) {
    let constructionSites = {};
    for (let csId in Game.constructionSites) {
      let cs = Game.constructionSites[csId];
      let csMem = Memory.constructionSites[csId];
      if (csMem) {
        if (csMem == cs.progress) {
          console.log(csId + ' constructionSite too old');
          let csObject = Game.getObjectById(csId);
          let returnCode = csObject.remove();
          console.log('Delete constructionSite: ' + returnCode);
          continue;
        }
      }
      constructionSites[csId] = cs.progress;
    }
    Memory.constructionSites = constructionSites;
    console.log('Known constructionSites: ' + Object.keys(constructionSites).length);
  }

  var userName = Memory.username || Game.rooms[Memory.myRooms[0]].controller.owner || 'default';
  Memory.username = userName;
  // Cleanup memory
  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      let role = Memory.creeps[name].role;
      let roleStat;
      if (!Memory.stats[userName]) {
        roleStat = Memory.stats[userName].roles[role];
      }
      let previousAmount = roleStat ? roleStat.amount : 0;
      let amount = previousAmount ? 0 : previousAmount - 1;
      brain.stats.add('', '.roles.' + role, amount);

      if ((name.startsWith('reserver') && Memory.creeps[name].born < (Game.time - CREEP_CLAIM_LIFE_TIME)) || Memory.creeps[name].born < (Game.time - CREEP_LIFE_TIME)) {
        delete Memory.creeps[name];
      } else {
        var creepMemory = Memory.creeps[name];
        if (creepMemory.killed) {
          delete Memory.creeps[name];
          continue;
        }

        console.log(name, 'Not in Game.creeps', Game.time - creepMemory.born, Memory.creeps[name].base);
        if (Game.time - creepMemory.born < 20) {
          continue;
        }
        if (!creepMemory.role) {
          delete Memory.creeps[name];
          continue;
        }
        try {
          let unit = roles[creepMemory.role];
          if (!unit) {
            delete Memory.creeps[name];
          }
          if (unit.died) {
            unit.died(name, creepMemory);
            //            delete Memory.creeps[name];
          } else {
            delete Memory.creeps[name];
          }
        } catch (e) {
          delete Memory.creeps[name];
        }
      }
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
    for (let name in Memory.rooms) {
      // Check for reserved rooms
      let memory = Memory.rooms[name];
      if (!Memory.rooms[name].lastSeen) {
        //        console.log('Deleting ' + name + ' from memory no `last_seen` value');
        delete Memory.rooms[name];
        continue;
      }
      if (Memory.rooms[name].lastSeen < config.room.lastSeenThreshold) {
        console.log('Deleting ' + name + ' from memory older than 100000');
        //delete Memory.rooms[name];
        continue;
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

      var storageNoString = '';
      var storageLowString = '';
      var storageMiddleString = '';
      var storageHighString = '';
      var storagePower = '';
      var upgradeLess = '';
      for (var id in Memory.myRooms) {
        let name = Memory.myRooms[id];
        let room = Game.rooms[name];
        if (!room || !room.storage) {
          storageNoString += name + ' ';
          continue;
        }
        if (room.storage.store.energy < 200000) {
          storageLowString += name + ':' + room.storage.store.energy + ' ';
        } else if (room.storage.store.energy > 800000) {
          storageHighString += name + ':' + room.storage.store.energy + ' ';
        } else {
          storageMiddleString += name + ':' + room.storage.store.energy + ' ';
        }
        if (room.storage.store.power && room.storage.store.power > 0) {
          storagePower += name + ':' + room.storage.store.power + ' ';
        }
        // TODO 15 it should be
        if (Math.ceil(room.memory.upgraderUpgrade / interval) < 15) {
          upgradeLess += name + ':' + room.memory.upgraderUpgrade / interval + ' ';
        }
        room.memory.upgraderUpgrade = 0;
      }
      console.log('No storage:', storageNoString);
      console.log('Low storage:', storageLowString);
      console.log('Middle storage:', storageMiddleString);
      console.log('High storage:', storageHighString);
      console.log('-------------------------');
      console.log('Power storage:', storagePower);
      console.log('-------------------------');
      console.log('Upgrade less:', upgradeLess);
      console.log('=========================');
    }
  }
};
