'use strict';

PathFinder.use(true);

require('config_creep');
require('config_creep_resources');
require('config_creep_mineral');
require('config_creep_move');
require('config_creep_mineral');
require('config_creep_harvest');
require('config_creep_fight');
require('config_creep_routing');
require('config_room');
require('config_room_not_mine');
require('config_room_external');
require('config_room_flags');
require('config_room_basebuilder');
require('config_room_costmatrix');
require('config_room_controller');
require('config_room_defense');
require('config_room_market');
require('config_room_mineral');
require('config_room_routing');
require('config_roomPosition');
require('config_roomPosition_structures');
require('config_string');

var squadmanager = require('squadmanager');

var profiler = require('screeps-profiler');
profiler.enable();

module.exports.loop = function() {
  profiler.wrap(function() {
    var config = require('config');
    Game.config = config;
    Memory.stats = {};

    // TODO build average over time or something like that
    //    if (!Memory.mineralSystemPrice) {
    Memory.mineralSystemPrice = {};
    //    }

    // TODO store min system prices
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


    //      let ordersSystem = _.filter(Memory.ordersBuy, function(object) {
    //        // Copied from Room.prototype
    //        var patt = /([A-Z]+)(\d+)([A-Z]+)(\d+)/;
    //        var result = patt.exec(object.name);
    //        if (result[2] % 10 === 0 || result[4] % 10 === 0) {
    //          return true;
    //        }
    //        return false;
    //      });
    //
    //      for (let order of ordersSystem) {
    //        if (!Memory.mineralSystemPrice[order.resourceType] || Memory.mineralSystemPrice[order.resourceType] > order.price) {
    //          Memory.mineralSystemPrice[order.resourceType] = order.price;
    //        }
    //      }

    var name;

    if (!Memory.constructionSites) {
      Memory.constructionSites = {};
    }

    if (Game.time % Game.config.constructionSite.maxIdleTime === 0) {
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

    // Cleanup memory
    for (name in Memory.creeps) {
      if (!Game.creeps[name]) {
        if ((name.startsWith('reserver') && Memory.creeps[name].born < (Game.time - CREEP_CLAIM_LIFE_TIME)) || Memory.creeps[name].born < (Game.time - CREEP_LIFE_TIME)) {
          delete Memory.creeps[name];
        } else {
          var creep_memory = Memory.creeps[name];
          if (creep_memory.killed) {
            delete Memory.creeps[name];
            continue;
          }

          console.log(name, 'Not in Game.creeps', Game.time - creep_memory.born, Memory.creeps[name].base);
          if (Game.time - creep_memory.born < 20) {
            continue;
          }
          if (!creep_memory.role) {
            delete Memory.creeps[name];
            continue;
          }
          var unit = require('creep_' + creep_memory.role);
          if (unit.died) {
            unit.died(name, creep_memory);
          } else {
            delete Memory.creeps[name];
          }
        }
      }
    }

    if (Game.time % 300 === 0) {
      for (name in Memory.rooms) {
        // Check for reserved rooms
        let memory = Memory.rooms[name];
        if (memory.reservation) {
          let diff = Game.time - memory.reservation.tick;
          if (diff > 11) {
            let reserved = memory.reservation.reservation - diff;
            if (0 < reserved && reserved < 2000) {
              let room = Game.rooms[name];
              if (room && room !== null) {
                let reservers = room.find(FIND_MY_CREEPS, {
                  filter: function(object) {
                    return object.memory.role == 'reserver';
                  }
                });
                if (reservers.length > 0) {
                  continue;
                }
              }
              console.log(name + ' ' + Game.time + ' ' + name + ' ' + JSON.stringify(memory.reservation) + ' hostiles: ' + memory.hostile + ' diff: ' + diff + ' reserverd: ' + reserved);
              let base = Game.rooms[memory.reservation.base];
              base.memory.queue.push({
                role: 'reserver',
                target: name,
                level: 2
              });
              base.log('Queuing reserver for ' + name);
            }
          }
        }

        if (!Memory.rooms[name].lastSeen) {
          console.log('Deleting ' + name + ' from memory no `last_seen` value');
          delete Memory.rooms[name];
          continue;
        }
        if (Memory.rooms[name].lastSeen < 100000) {
          console.log('Deleting ' + name + ' from memory older than 100000');
          //delete Memory.rooms[name];
          continue;
        }
      }
    }

    if (Game.config.nextRoom) {
      require('nextroom').handle();
    }

    squadmanager.handle();

    var interval = 100;
    if (Game.time % interval === 0) {
      console.log('=========================');
      var diff = Game.gcl.progress - Memory.progress;
      Memory.progress = Game.gcl.progress;

      console.log('Progress: ', diff / interval, '/', Memory.my_rooms.length * 15);
      console.log('ConstructionSites: ', Object.keys(Memory.constructionSites).length);
      console.log('-------------------------');

      var storage_no_string = '';
      var storage_low_string = '';
      var storage_middle_string = '';
      var storage_high_string = '';
      var storage_power = '';
      var upgrade_less = '';
      for (var id in Memory.my_rooms) {
        name = Memory.my_rooms[id];
        let room = Game.rooms[name];
        if (!room || !room.storage) {
          storage_no_string += name + ' ';
          continue;
        }
        if (room.storage.store.energy < 200000) {
          storage_low_string += name + ':' + room.storage.store.energy + ' ';
        } else if (room.storage.store.energy > 800000) {
          storage_high_string += name + ':' + room.storage.store.energy + ' ';
        } else {
          storage_middle_string += name + ':' + room.storage.store.energy + ' ';
        }
        if (room.storage.store.power && room.storage.store.power > 0) {
          storage_power += name + ':' + room.storage.store.power + ' ';
        }
        // TODO 15 it should be
        if (Math.ceil(room.memory.builder_upgrade / interval) < 15) {
          upgrade_less += name + ':' + room.memory.builder_upgrade / interval + ' ';
        }
        room.memory.builder_upgrade = 0;
      }
      console.log('No storage:', storage_no_string);
      console.log('Low storage:', storage_low_string);
      console.log('Middle storage:', storage_middle_string);
      console.log('High storage:', storage_high_string);
      console.log('-------------------------');
      console.log('Power storage:', storage_power);
      console.log('-------------------------');
      console.log('Upgrade less:', upgrade_less);
      console.log('=========================');
    }

    var my_rooms = [];
    for (var roomName in Game.rooms) {
      let room = Game.rooms[roomName];
      try {
        if (room.execute()) {
          my_rooms.push(roomName);
        }
      } catch (err) {
        room.log("Executing room failed: " + room.name + ' ' + err + ' ' + err.stack);
        Game.notify("Executing room failed: " + room.name + " " + err + " " + err.stack, 30);
      }
    }

    Memory.my_rooms = my_rooms;

    if (Game.config.stats.enabled) {
      Memory.stats.creeps = Object.keys(Game.creeps).length;
      Memory.stats['cpu.bucket'] = Game.cpu.bucket;
      Memory.stats['cpu.tickLimit'] = Game.cpu.tickLimit;
      Memory.stats['cpu.limit'] = Game.cpu.limit;
      Memory.stats['cpu.used'] = Game.cpu.getUsed();
      Memory.stats['game.gcl.progress'] = Game.gcl.progress;
      Memory.stats['my.progress'] = (Game.gcl.progress - Memory.progress) / (Game.time % 100);
      Memory.stats['my.progressMax'] = Memory.my_rooms.length * 15;
      for (let playerName in Memory.players) {
        let player = Memory.players[playerName];
        Memory.stats['players.' + playerName + '.idiot'] = player.idiot;
        Memory.stats['players.' + playerName + '.level'] = player.level;
      }
    }

    console.log(Game.time + ' cpu: ' + Game.cpu.getUsed() + ' / ' + Game.cpu.limit);
  });
};
