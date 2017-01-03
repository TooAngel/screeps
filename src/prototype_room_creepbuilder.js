'use strict';

Room.prototype.spawnCreateCreep = function(creep) {
  let role = creep.role;
  let unit = roles[role];
  if (!unit) {
    this.log('Can not find role: ' + role + ' creep_' + role);
    return true;
  }

  var id = Math.floor((Math.random() * 1000) + 1);
  var name = role + '-' + id;

  var partConfig = unit.getPartConfig(this, creep);
  if (!partConfig) {
    return;
  }
  partConfig = partConfig.slice(0, MAX_CREEP_SIZE);
  var spawns = this.find(FIND_MY_SPAWNS);

  for (var spawn_name in spawns) {
    var spawn = spawns[spawn_name];
    var memory = {
      role: role,
      number: id,
      step: 0,
      base: this.name,
      born: Game.time,
      heal: creep.heal,
      level: creep.level,
      squad: creep.squad,
      // Values from the creep configuration
      killPrevious: unit.killPrevious,
      flee: unit.flee,
      buildRoad: unit.buildRoad,
      routing: creep.routing
    };
    //     if (memory.role == 'reserver') {
    //       console.log('Spawning reserver: ' + JSON.stringify(memory));
    //     }
    var returnCode = spawn.createCreep(partConfig, name, memory);

    if (returnCode != name) {
      continue;
    }

    //    this.log('Spawned ' + name);

    if (memory.role == 'reserver') {
      this.log('Spawning ' + name.rpad(' ', 20) + ' ' + JSON.stringify(memory));
    }
    return true;
  }
  return false;

};

Room.prototype.spawnCheckForCreate = function({role: creepsConfig}) {
  var storages;
  var energyNeeded;
  var unit;

  if (this.memory.queue && (creepsConfig.length === 0 || creepsConfig[0] != 'harvester')) {
    let room = this;
    let priorityQueue = function(object) {
      if (object.role == 'harvester') {
        return 1;
      }

      let target = object.routing && object.routing.targetRoom;

      if (target == room.name) {
        if (object.role == 'sourcer') {
          return 2;
        }
        if (object.role == 'storagefiller') {
          return 3;
        }
        return 4;
      }
      // spawn reserver after external supply line
      if (target !== room.name) {
        if (object.role == 'carry') {
          return 5;
        }
        if (object.role == 'sourcer') {
          return 6;
        }
        if (object.role == 'reserver') {
          return 7;
        }
      }
      if (object.role == 'nextroomer') {
        return 11;
      }

      // TODO added because target was misused as a pos object
      if (object.role == 'defendranged') {
        return 3;
      }

      if (!target) {
        return 12;
      }
      return 100 + Game.map.getRoomLinearDistance(room.name, target);
    };

    this.memory.queue = _.sortBy(this.memory.queue, priorityQueue);

    var creep = this.memory.queue[0];
    energyNeeded = 50;

    if (this.spawnCreateCreep(creep)) {
      this.memory.queue.shift();
    } else {
      if (creep.ttl === 0) {
        this.log('TTL reached, skipping: ' + JSON.stringify(creep));
        this.memory.queue.shift();
        return;
      }

      // TODO maybe skip only if there is a spawn which is not spawning
      creep.ttl = creep.ttl || config.creep.queueTtl;
      let spawnsNotSpawning = _.filter(this.find(FIND_MY_SPAWNS), function(object) {
        return !object.spawning;
      });
      if (spawnsNotSpawning.length === 0) {
        creep.ttl--;
      }
    }
    // Spawing only one per tick
    return;
  }

  if (creepsConfig.length > 0) {
    this.log('Spawn from creepsConfig: ' + creepsConfig[0]);
    return this.spawnCreateCreep(creepsConfig[0]);
  }

  return false;
};
