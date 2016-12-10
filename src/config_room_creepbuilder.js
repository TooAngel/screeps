'use strict';

Room.prototype.spawnCreateCreep = function(role, target, source, heal, target_id, level, squad, routing) {
  var energy = this.energyAvailable;

  let unit = roles[role];
  if (!unit) {
    this.log('Can not find role: ' + role + ' creep_' + role);
    return true;
  }

  var energyNeeded = 50;

  if (unit.energyRequired) {
    energyNeeded = unit.energyRequired(this);
  }

  if (this.energyAvailable < energyNeeded) {
    return false;
  }

  var id = Math.floor((Math.random() * 1000) + 1);
  var name = role + '-' + id;

  if (role == 'sourcer' && !source) {
    if (!this.memory.sources_index) {
      this.memory.sources_index = 0;
    }
    var sources = this.find(FIND_SOURCES);
    source = sources[this.memory.sources_index % sources.length].pos;
    target_id = sources[this.memory.sources_index % sources.length].id;
    target = sources[this.memory.sources_index % sources.length].pos.roomName;
    routing = {
      targetRoom: this.name,
      targetId: sources[this.memory.sources_index % sources.length].id
    };
  }

  if (unit.energyBuild) {
    energy = unit.energyBuild(this, energy, source, heal, level);
  }

  var partConfig = unit.getPartConfig(this, energy, heal, target);
  partConfig = partConfig.slice(0, MAX_CREEP_SIZE);
  var spawns = this.find(FIND_MY_SPAWNS);

  for (var spawn_name in spawns) {
    var spawn = spawns[spawn_name];
    var memory = {
      role: role,
      number: id,
      step: 0,
      target: target,
      base: this.name,
      source: source,
      target_id: target_id,
      born: Game.time,
      heal: heal,
      level: level,
      squad: squad,
      // Values from the creep configuration
      killPrevious: unit.killPrevious,
      flee: unit.flee,
      buildRoad: unit.buildRoad,
      routing: routing
    };
    //     if (memory.role == 'reserver') {
    //       console.log('Spawning reserver: ' + JSON.stringify(memory));
    //     }
    var returnCode = spawn.createCreep(partConfig, name, memory);

    if (returnCode != name) {
      continue;
    }

    //    this.log('Spawned ' + name);

    if (role == 'sourcer') {
      this.memory.sources_index = this.memory.sources_index + 1;
    }

    if (memory.role == 'reserver') {
      this.log('Spawning ' + name.rpad(' ', 20) + ' ' + JSON.stringify(memory));
    }
    return true;
  }
  return false;

};

Room.prototype.spawnCheckForCreate = function(creepsConfig, target) {
  var storages;
  var energyNeeded;
  var unit;

  if (!this.memory.queue) {
    this.memory.queue = [];
  }

  if (this.memory.queue.length > 0 && (creepsConfig.length === 0 || creepsConfig[0] != 'harvester')) {
    let room = this;
    let priorityQueue = function(object) {

      let target = object.routing && object.routing.targetRoom || object.target;

      if (target == room.name) {
        if (object.role == 'harvester') {
          return 1;
        }
        if (object.role == 'sourcer') {
          return 2;
        }
        if (object.role == 'storagefiller') {
          return 3;
        }
        return 4;
      }

      if (object.role == 'nextroomer') {
        return 11;
      }

      // TODO added because target was misused as a pos object
      if (object.role == 'defendranged') {
        return 3;
      }

      if (!target) {
        return 110;
      }
      return 100 + Game.map.getRoomLinearDistance(room.name, target);
    };

    let queue = _.sortBy(this.memory.queue, priorityQueue);
    //     this.log(JSON.stringify(queue));

    var creep = queue[0];
    energyNeeded = 50;

    //     this.log(JSON.stringify(creep));

    if (this.spawnCreateCreep(creep.role, creep.target, creep.source, creep.heal, creep.target_id, creep.level, creep.squad, creep.routing)) {
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
    return this.spawnCreateCreep(creepsConfig[0], target);
  }

  return false;
};
