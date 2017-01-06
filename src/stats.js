stats = {
  calc: function() {
    var name = Memory.username;
    Memory.stats = {};
    if (config.stats.enabled && name) {
      Memory.stats[name] = {
        cpu: {
          limit: Game.cpu.limit,
          tickLimit: Game.cpu.tickLimit,
          bucket: Game.cpu.bucket
        },
        exec: {
          halt: Game.cpu.bucket < Game.cpu.tickLimit * 2
        },
        gcl: {
          level: Game.gcl.level,
          progress: Game.gcl.progress,
          progressTotal: Game.gcl.progressTotal
        },
        rooms: {
          available: Game.rooms.length
        }
      };

      return 1;
    } else if (!config.stats.enabled) {
      delete Memory.stats;
    }
    return 0;
  },
  room: function(room) {
    var name = Memory.username;
    if (config.stats.enabled && name) {
      let name = Memory.username;
      let roomName = room.name;
      let pathBegin = name + '.room.' + roomName;
      if (room.memory.upgraderUpgrade === undefined) {
        room.memory.upgraderUpgrade = 0;
      }
      Memory.stats[name].room[roomName] = {
        energy: {
          available: room.energyAvailable,
          capacity: room.energyCapacityAvailable,
          sources: _.sum(_.map(room.find(FIND_SOURCES), 'energy'))
        },
        constroller: {
          progress: room.controller.progress,
          preCalcSpeed: room.memory.upgraderUpgrade / (Game.time % 100),
          progressTotal: room.controller.progressTotal
        },
        creeps: {
          into: room.find(FIND_CREEPS).length,
          queue: room.memory.queue.length
        },
        cpu: Game.cpu.getUsed()
      };
      if (room.storage) {
        let storage = room.storage;
        Memory.stats[pathBegin].storage = {
          energy: storage.store.energy,
          power: storage.store.power
        };
      }
      if (room.terminal) {
        let terminal = room.terminal;
        Memory.stats[pathBegin].terminal = {
          energy: terminal.store.energy,
          minerals: _.sum(terminal.store) - terminal.store.energy
        };
      }
    } else if (!name) {
      name = room.controller.owner;
      Memory.name = name;
    }
  },
  getCpuUsed: function() {
    if (config.stats.enabled && Memory.username) {
      Memory.stats[Memory.username].cpu.used = Game.cpu.getUsed();
    }
  }
};

module.exports = stats;
