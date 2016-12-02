'use strict';

Room.prototype.myHandleRoom = function() {
  if (!Memory.username) {
    Memory.username = this.controller.owner.username;
  }
  this.memory.lastSeen = Game.time;
  this.memory.constructionSites = this.find(FIND_CONSTRUCTION_SITES);
  this.memory.droppedResources = this.find(FIND_DROPPED_RESOURCES);
  let room = this;


  // TODO Fix for after `delete Memory.rooms`
  if (!room.memory.position || !room.memory.position.structure) {
    this.setup();
  }

  var hostiles = this.find(FIND_HOSTILE_CREEPS, {
    filter: this.findAttackCreeps
  });
  if (hostiles.length === 0) {
    delete this.memory.hostile;
  } else {
    if (this.memory.hostile) {
      this.memory.hostile.lastUpdate = Game.time;
      this.memory.hostile.hostiles = hostiles;
    } else {
      //this.log('Hostile creeps: ' + hostiles[0].owner.username);
      this.memory.hostile = {
        lastUpdate: Game.time,
        hostiles: hostiles
      };
    }
  }
  if (config.stats.enabled) {
    Memory.stats["room." + this.name + ".energyAvailable"] = this.energyAvailable;
    Memory.stats["room." + this.name + ".energyCapacityAvailable"] = this.energyCapacityAvailable;
    Memory.stats["room." + this.name + ".controllerProgress"] = this.controller.progress;
    Memory.stats['room.' + this.name + '.progress'] = this.memory.upgrader_upgrade / (Game.time % 100);

    let storage = this.storage || {
      store: {}
    };
    if (this.storage) {
      Memory.stats["room." + this.name + ".storage.store.energy"] = storage.store.energy || 0;
      Memory.stats["room." + this.name + ".storage.store.power"] = storage.store.power || 0;
    }
  }

  return this.executeRoom();
};

Room.prototype.getLinkStorage = function() {
  this.memory.constants = this.memory.constants || {};
  if (this.memory.constants.linkStorage) {
    let link = Game.getObjectById(this.memory.constants.linkStorage);
    if (link && link !== null) {
      return link;
    }
  }
  let linkPos = this.memory.position.structure.link[0];
  let linkPosObject = new RoomPosition(linkPos.x, linkPos.y, this.name);
  let structures = linkPosObject.lookFor(LOOK_STRUCTURES);
  for (let structure of structures) {
    if (structure.structureType == STRUCTURE_LINK) {
      this.memory.constants.linkStorage = structure.id;
      return structure;
    }
  }
};

Room.prototype.handleLinks = function() {
  let linkStorage = this.getLinkStorage();
  if (!linkStorage) {
    return;
  }

  var links = this.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      if (object.id == linkStorage.id) {
        return false;
      }
      if (object.structureType != STRUCTURE_LINK) {
        return false;
      }
      return true;
    }
  });

  if (this.memory.attack_timer <= 0) {
    this.memory.underSiege = false;
  }


  if (links.length > 0) {
    var number_of_links = CONTROLLER_STRUCTURES.link[this.controller.level];
    var time = Game.time % ((number_of_links - 1) * 12);
    var link = (time / 12);
    if (time % 12 === 0 && links.length - 1 >= link) {
      if (this.memory.attack_timer > 50 && this.controller.level > 6) {
        for (let i = 1; i < 3; i++) {
          let linkSourcer = this.memory.position.structure.link[i];
          if (links[link].pos.isEqualTo(linkSourcer.x, linkSourcer.y)) {
            let returnCode = links[link].transferEnergy(linkStorage);
            return true;
          }
        }
        let returnCode = linkStorage.transferEnergy(links[link]);
      } else {
        let returnCode = links[link].transferEnergy(linkStorage);
        if (returnCode != OK && returnCode != ERR_NOT_ENOUGH_RESOURCES && returnCode != ERR_TIRED) {
          this.log('handleLinks.transferEnergy returnCode: ' + returnCode + ' targetPos: ' + linkStorage.pos);
        }
      }
    }
  }
};

Room.prototype.handle_powerspawn = function() {
  var powerSpawns = this.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'powerSpawn';
    }
  });
  if (powerSpawns.length === 0) {
    return false;
  }
  var powerSpawn = powerSpawns[0];
  if (powerSpawn.power > 0) {
    powerSpawn.processPower();
  }
};

Room.prototype.handleObserver = function() {
  if (this.name == 'sim') {
    return false;
  }
  var observers = this.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'observer';
    }
  });
  if (observers.length > 0) {
    if (!this.memory.observe_rooms) {
      // TODO manage switch from E to W and S to N
      this.memory.observe_rooms = [];
      let name_split = this.split_room_name();
      for (var x = +name_split[2] - 5; x <= +name_split[2] + 5; x++) {
        for (var y = +name_split[4] - 5; y <= +name_split[4] + 5; y++) {
          if (x % 10 === 0 || y % 10 === 0) {
            this.memory.observe_rooms.push(name_split[1] + x + name_split[3] + y);
          }
        }
      }
    }

    // TODO scan full range, first implementation
    let name_split = this.split_room_name();
    let fullLength = 2 * OBSERVER_RANGE + 1;
    let numberOfFields = fullLength * fullLength;
    let offset = Game.time % numberOfFields;
    let xOffset = Math.floor(offset / fullLength) - OBSERVER_RANGE;
    let yOffset = Math.floor(offset % fullLength) - OBSERVER_RANGE;
    let xPos = +name_split[2] + xOffset;


    let yPos = +name_split[4] + yOffset;
    let xDir = name_split[1];
    let yDir = name_split[3];

    if (xPos < 0) {
      xDir = xDir == 'E' ? 'W' : 'E';
      xPos = xPos * -1 - 1;
    }

    if (yPos < 0) {
      yDir = yDir == 'N' ? 'S' : 'N';
      yPos = yPos * -1 - 1;
    }

    let roomObserve = xDir + xPos + yDir + yPos;




    var observe_room = this.memory.observe_rooms[Game.time % this.memory.observe_rooms.length];
    //this.log(observe_room);
    //     observers[0].observeRoom(observe_room);
    let returnCode = observers[0].observeRoom(roomObserve);
    if (returnCode != OK) {
      this.log('observer returnCode: ' + returnCode + ' ' + roomObserve + ' ' + fullLength + ' ' + numberOfFields + ' ' + offset + ' ' + xOffset + ' ' + yOffset);
    }

  }
};

Room.prototype.handleScout = function() {
  if (this.name == 'sim') {
    return false;
  }
  if (
    ((Game.time + this.controller.pos.x + this.controller.pos.y) % config.room.scoutInterval) === 0 &&
    this.controller.level >= 2 &&
    this.memory.queue.length === 0 &&
    config.room.scout
  ) {
    var scout_spawn = {
      role: 'scout'
    };
    if (!this.inQueue(scout_spawn)) {
      Game.rooms[this.name].memory.queue.push(scout_spawn);
    }
  }
};

Room.prototype.executeRoom = function() {
  this.buildBase();

  var spawns = this.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_SPAWN;
    }
  });

  var hostiles = this.find(FIND_HOSTILE_CREEPS, {
    filter: this.findAttackCreeps
  });
  if (hostiles.length === 0) {
    this.memory.attack_timer = Math.max(this.memory.attack_timer - 5, 0);
    // Make sure we don't spawn towerFiller on reducing again
    if (this.memory.attack_timer % 5 === 0) {
      this.memory.attack_timer--;
    }
  }

  if (spawns.length === 0) {
    this.reviveRoom();
  }
  if (this.energyCapacityAvailable < 1000) {
    this.reviveRoom();
  }
  this.memory.active = true;

  var room = this;

  var nextroomers = this.find(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.memory.role == 'nextroomer') {
        return object.memory.base != room.name;
      }
      return false;
    }
  });
  var building = nextroomers.length > 0 && this.controller.level < 5;

  var creepsInRoom = this.find(FIND_MY_CREEPS);
  if (!building && creepsInRoom.length <= 1 && this.energyAvailable >= 200) {
    this.spawnCreateCreep('harvester');
    Game.rooms[this.name].memory.queue = [];
    return true;
  }

  var spawn;

  var creepsConfig = [];
  if (!building) {
    creepsConfig.push('harvester');
    if (!room.storage) {
      creepsConfig.push('harvester');
      // TODO maybe better spawn harvester when a carry recognize that the dropped energy > threshold
      if (room.controller.level == 2 || room.controller.level == 3) {
        creepsConfig.push('harvester');
        creepsConfig.push('harvester');
        creepsConfig.push('harvester');
      }
    }
  }

  if (this.memory.attack_timer > 100) {
    // TODO better metric for SafeMode
    let enemies = this.find(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        return object.owner.username != 'Invader';
      }
    });
    if (enemies > 0) {
      this.controller.activateSafeMode();
    }
  }
  if (this.memory.attack_timer >= 50 && this.controller.level > 6) {
    let towers = this.find(FIND_STRUCTURES, {
      filter: function(object) {
        return object.structureType == STRUCTURE_TOWER;
      }
    });
    if (towers.length === 0) {
      this.memory.attack_timer = 47;
    } else {
      if (this.memory.attack_timer == 50 && this.memory.position.creep.towerFiller) {
        for (let towerFillerPos of this.memory.position.creep.towerFiller) {
          this.log('Spawning towerfiller: ' + this.memory.attack_timer);
          this.memory.queue.push({
            role: 'towerfiller',
            target_id: towerFillerPos
          });
        }
      }
    }
  }

  if (hostiles.length > 0) {
    this.memory.attack_timer++;

    if (hostiles[0].owner.username != 'Invader') {
      if (!Memory.players[hostiles[0].owner.username]) {
        Memory.players[hostiles[0].owner.username] = {
          idiot: 0
        };
      }

      Memory.players[hostiles[0].owner.username].idiot++;
    }


    if (this.memory.attack_timer > 15) {
      var defender = {
        role: 'defendranged',
        target: hostiles[0].pos
      };
      creepsConfig.push('defendranged');
      if (this.memory.attack_timer > 300) {
        defender.role = 'defendmelee';
        creepsConfig.push('defendmelee');
      }
      if (Game.time % 250 === 0 && !this.inQueue(defender)) {
        this.memory.queue.push(defender);
      }
    }
    if (Game.time % 10 === 0) {
      this.log('Under attack from ' + hostiles[0].owner.username);
    }
    if (hostiles[0].owner.username != 'Invader') {
      Game.notify(this.name + ' Under attack from ' + hostiles[0].owner.username + ' at ' + Game.time);
    }
  }

  if (nextroomers.length === 0) {
    var sources = this.find(FIND_SOURCES);
    for (var sources_index = 0; sources_index < sources.length; sources_index++) {
      creepsConfig.push('sourcer');
    }
  }

  if (this.controller.level >= 5 && this.storage) {
    creepsConfig.push('storagefiller');
  }

  if (this.storage && this.storage.store.energy > config.room.upgraderMinStorage && !this.memory.misplacedSpawn) {
    creepsConfig.push('upgrader');
  }

  var constructionSites = this.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_ROAD) {
        return false;
      }
      if (object.structureType == STRUCTURE_WALL) {
        return false;
      }
      if (object.structureType == STRUCTURE_RAMPART) {
        return false;
      }

      return true;
    }
  });
  if (constructionSites.length > 0) {
    creepsConfig.push('planer');
    for (let cs of constructionSites) {
      if (cs.structureType == STRUCTURE_STORAGE) {
        creepsConfig.push('planer');
        creepsConfig.push('planer');
      }
    }
  } else if (this.memory.misplacedSpawn && this.storage && this.storage.store.energy > 20000 && this.energyAvailable >= this.energyCapacityAvailable - 300) {
    creepsConfig.push('planer');
    creepsConfig.push('planer');
    creepsConfig.push('planer');
    creepsConfig.push('planer');
  }

  let extractors = this.find(FIND_STRUCTURES, {
    filter: {
      structureType: STRUCTURE_EXTRACTOR
    }
  });
  if (this.terminal && extractors.length > 0) {
    let minerals = this.find(FIND_MINERALS);
    if (minerals.length > 0 && minerals[0].mineralAmount > 0) {
      let amount = this.terminal.store[minerals[0].mineralType] || 0;
      if (amount < config.mineral.storage) {
        creepsConfig.push('extractor');
      }
    }
  }
  if (config.mineral.enabled && this.terminal && ((this.memory.mineralBuilds && Object.keys(this.memory.mineralBuilds).length > 0) || this.memory.reaction || this.memory.mineralOrder)) {
    creepsConfig.push('mineral');
  }

  if (!building && nextroomers.length === 0) {
    this.handleScout();
  }

  let constructionSitesBlocker = this.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_RAMPART) {
        return true;
      }
      if (object.structureType == STRUCTURE_WALL) {
        return true;
      }
      return false;
    }
  });

  this.handleTower();
  if (this.controller.level > 1) {
    creepsConfig.push('repairer');
  }

  this.handleLinks();
  this.handleObserver();
  this.handle_powerspawn();
  this.handleTerminal();
  this.handleNukeAttack();

  var creep;
  var creep_index;

  for (var creep_name in creepsInRoom) {
    creep = creepsInRoom[creep_name];
    creep_index = creepsConfig.indexOf(creep.memory.role);
    if (creep_index != -1) {
      creepsConfig.splice(creep_index, 1);
    }
  }

  for (var spawn_name in spawns) {
    spawn = spawns[spawn_name];
    if (!spawn.spawning || spawn.spawning === null) {
      continue;
    }

    creep = Game.creeps[spawn.spawning.name];
    creep_index = creepsConfig.indexOf(creep.memory.role);
    if (creep_index != -1) {
      creepsConfig.splice(creep_index, 1);
    }
  }
  this.spawnCheckForCreate(creepsConfig);

  this.handleMarket();
  return true;
};



Room.prototype.reviveRoom = function() {
  if (this.controller.level > 1 && this.controller.ticksToDowngrade > CONTROLLER_DOWNGRADE[this.controller.level] * 0.9) {
    return false;
  }

  if (this.memory.active) {
    //this.log('Setting room to underSiege');
    //this.memory.underSiege = true;
  }

  this.handleTower();
  this.handleTerminal();
  this.memory.active = false;
  if (!config.room.revive) {
    return false;
  }

  if (this.controller.level == 1 && this.controller.ticksToDowngrade < 100) {
    this.clearRoom();
    return false;
  }

  if (config.nextRoom.revive && this.controller.level >= 1 && (Game.time + this.controller.pos.x + this.controller.pos.y) % config.room.nextroomerInterval === 0) {
    this.log('revive me now');

    let nextroomerCalled = 0;

    let room = this;

    let sortByDistance = function(object) {
      return Game.map.getRoomLinearDistance(room.name, object);
    };

    let roomsMy = _.sortBy(Memory.myRooms, sortByDistance);

    for (let roomIndex in roomsMy) {
      if (nextroomerCalled > config.nextRoom.numberOfNextroomers) {
        break;
      }
      let roomName = Memory.myRooms[roomIndex];
      if (this.name == roomName) {
        continue;
      }
      let roomOther = Game.rooms[roomName];
      roomOther.log('Can I revive?');
      if (!roomOther.memory.active) {
        roomOther.log('No active');
        continue;
      }
      if (!roomOther.storage || roomOther.storage.store.energy < config.room.reviveStorageAvailable) {
        roomOther.log('No storage');
        continue;
      }
      if (roomOther.memory.queue.length > 0) {
        roomOther.log('No queue');
        continue;
      }

      // TODO config value, meaningful
      if (roomOther.energyCapacityAvailable < 1300) {
        roomOther.log('Too Small');
        continue;
      }


      let distance = Game.map.getRoomLinearDistance(this.name, roomName);
      if (distance < config.nextRoom.maxDistance) {
        let creepToSpawn = {
          role: 'nextroomer',
          target: this.name
        };
        if (this.memory.wayBlocked) {
          creepToSpawn.role = 'nextroomerattack';
        }
        let hostile_creeps = this.find(FIND_HOSTILE_CREEPS);
        if (hostile_creeps.length > 0) {
          roomOther.log('Queuing defender for ' + this.name);
          roomOther.memory.queue.push({
            role: 'defender',
            target: this.name
          });
        }
        roomOther.log('Queuing ' + creepToSpawn.role + ' for ' + this.name);
        if (!this.inQueue(creepToSpawn)) {
          roomOther.memory.queue.push(creepToSpawn);
        }
        nextroomerCalled++;
      }
    }
  }
  return true;
};
