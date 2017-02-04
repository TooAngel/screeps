'use strict';

Room.prototype.spawnCreateCreep = function(role, heal, level, squad, routing, base) {
  let energy = this.energyAvailable;

  let unit = roles[role];
  if (!unit) {
    this.log('Can not find role: ' + role + ' creep_' + role);
    return true;
  }

  let energyNeeded = 50;
  if (unit.energyRequired) {
    energyNeeded = unit.energyRequired(this);
  }

  if (this.energyAvailable < energyNeeded) {
    return false;
  }

  let id = Math.floor((Math.random() * 1000) + 1);
  let name = role + '-' + id;

  if (unit.energyBuild) {
    energy = unit.energyBuild(this, energy, heal, level);
  }

  let partConfig = unit.getPartConfig(this, energy, heal).slice(0, MAX_CREEP_SIZE);
  let spawns = this.find(FIND_MY_SPAWNS);

  for (let spawnName in spawns) {
    let spawn = spawns[spawnName];
    let memory = {
      role: role,
      number: id,
      step: 0,
      base: base || this.name,
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
    let returnCode = spawn.createCreep(partConfig, name, memory);

    if (returnCode != name) {
      continue;
    }
    if (config.stats.enabled) {
      let userName = Memory.username || _.find(Game.spawns, 'owner').owner;
      Memory.stats = Memory.stats || {};
      Memory.stats[userName].roles = Memory.stats[userName].roles || {};
      let roleStat = Memory.stats[userName].roles[role];
      let previousAmount = roleStat ? roleStat : 0;
      Memory.stats[userName].roles[role] = previousAmount + 1;
    }
    return true;
  }
  return false;
};

Room.prototype.spawnCheckForCreate = function(creepsConfig) {
  let storages;
  let energyNeeded;
  let unit;
  let room = this;
  
  if (room.memory.queue.length > 0 && (creepsConfig.length === 0 || creepsConfig[0] != 'harvester')) {
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

    room.memory.queue = _.sortBy(this.memory.queue, priorityQueue);

    let creep = this.memory.queue[0];
    energyNeeded = 50;

    let sortByDistance = function(object) {
      let dist = Game.map.getRoomLinearDistance(room.name, object);  
      if (dist < 10 && dist > 0){
        return dist;    
      }      
      return
    };
   
    if (room.spawnCreateCreep(creep.role, creep.heal, creep.level, creep.squad, creep.routing, room.name)) {
      room.log('['+room.name +' Spawning]- Activating '+creep.role );
      room.memory.queue.shift();
    } else if ((creep.ttl && creep.ttl === 0)|| room.memory.queue.length > 5) {
      let roomsMy = _.sortBy(Memory.myRooms, sortByDistance);
      for (var roomName in roomsMy) {
        var s_room = Game.rooms[roomsMy[roomName]];
        if (s_room.spawnCreateCreep(creep.role, creep.heal, creep.level, creep.squad, creep.routing, room.name)) {
          s_room.log('['+s_room.name +' Spawning]- Activating '+creep.role+' for: '+room.name  );  
          room.memory.queue.shift();
          return;
        }
      }  
      if(creep.ttl ===0){
        room.log('TTL reached, skipping: ' + JSON.stringify(creep));
      }  
      room.memory.queue.shift();
      return;
    }; 
    // TODO maybe skip only if there is a spawn which is not spawning
    creep.ttl = creep.ttl || config.creep.queueTtl;
    let spawnsNotSpawning = _.filter(this.find(FIND_MY_SPAWNS), function(object) {
      return !object.spawning;
    });
    if (spawnsNotSpawning.length === 0) {
      creep.ttl--;
    }
    // Spawing only one per tick
    return;
  }

  if (creepsConfig.length > 0) {
    room.log('Spawn from creepsConfig: ' + creepsConfig[0]);
    return room.spawnCreateCreep(creepsConfig[0]);
  }

  return false;
};
