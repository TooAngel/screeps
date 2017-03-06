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

  if (!this.memory.queue) {
    this.memory.queue = [];
  }

  var hostiles = this.getEnemys();
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
    if (structure.structureType === STRUCTURE_LINK) {
      this.memory.constants.linkStorage = structure.id;
      return structure;
    }
  }
};

Room.prototype.handleLinks = function() {
  if (this.memory.attackTimer <= 0) {
    this.memory.underSiege = false;
  }

  let linkStorage = this.getLinkStorage();
  if (!linkStorage) {
    return;
  }

  var links = this.find(FIND_MY_STRUCTURES, {
    filter: function(object) {
      if (object.id === linkStorage.id) {
        return false;
      }
      if (object.structureType != STRUCTURE_LINK) {
        return false;
      }
      return true;
    }
  });

  if (links.length > 0) {
    var number_of_links = CONTROLLER_STRUCTURES.link[this.controller.level];
    var time = Game.time % ((number_of_links - 1) * 12);
    var link = (time / 12);
    if (time % 12 === 0 && links.length - 1 >= link) {
      if (this.memory.attackTimer > 50 && this.controller.level > 6) {
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

Room.prototype.handlePowerSpawn = function() {
  let powerSpawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_POWER_SPAWN]);
  if (powerSpawns.length === 0) {
    return false;
  }
  var powerSpawn = powerSpawns[0];
  if (powerSpawn.power > 0) {
    powerSpawn.processPower();
  }
};

Room.prototype.handleObserver = function() {
  if (this.name === 'sim') {
    return false;
  }

  if (CONTROLLER_STRUCTURES.observer[this.controller.level] === 0) {
    return false;
  }
  let observers = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_OBSERVER]);
  if (observers.length > 0) {
    if (!this.memory.observe_rooms) {
      // TODO manage switch from E to W and S to N
      this.memory.observe_rooms = [];
      let nameSplit = this.splitRoomName();
      for (var x = +nameSplit[2] - 5; x <= +nameSplit[2] + 5; x++) {
        for (var y = +nameSplit[4] - 5; y <= +nameSplit[4] + 5; y++) {
          if (x % 10 === 0 || y % 10 === 0) {
            this.memory.observe_rooms.push(nameSplit[1] + x + nameSplit[3] + y);
          }
        }
      }
    }

    // TODO scan full range, first implementation
    let nameSplit = this.splitRoomName();
    let fullLength = 2 * OBSERVER_RANGE + 1;
    let numberOfFields = fullLength * fullLength;
    let offset = Game.time % numberOfFields;
    let xOffset = Math.floor(offset / fullLength) - OBSERVER_RANGE;
    let yOffset = Math.floor(offset % fullLength) - OBSERVER_RANGE;
    let xPos = +nameSplit[2] + xOffset;

    let yPos = +nameSplit[4] + yOffset;
    let xDir = nameSplit[1];
    let yDir = nameSplit[3];

    if (xPos < 0) {
      xDir = xDir === 'E' ? 'W' : 'E';
      xPos = xPos * -1 - 1;
    }

    if (yPos < 0) {
      yDir = yDir === 'N' ? 'S' : 'N';
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
  if (this.name === 'sim') {
    return false;
  }
  let shouldSpawn = (
    ((Game.time + this.controller.pos.x + this.controller.pos.y) %
      config.room.scoutInterval) === 0 &&
    this.controller.level >= 2 &&
    this.memory.queue.length === 0 &&
    config.room.scout
  );
  if (shouldSpawn) {
    let scout_spawn = {
      role: 'scout'
    };
    if (!this.inQueue(scout_spawn)) {
      this.memory.queue.push(scout_spawn);
    }
  }
};

Room.prototype.checkNeedHelp = function() {
  let needHelp = this.memory.energyAvailableSum < config.carryHelpers.needTreshold * config.carryHelpers.ticksUntilHelpCheck; //&& !this.hostile;
  let oldNeedHelp = this.memory.needHelp;
  if (needHelp) {
    if (!oldNeedHelp) {
      this.memory.energyAvailableSum = 0;
      Memory.needEnergyRooms.push(this.name);
      this.memory.needHelp = true;
      return '---!!!---' + this.name + ' need energy ---!!!---';
    }
    return 'Already set as needHelp';
  }
  if (oldNeedHelp) {
    this.memory.energyAvailableSum = 0;
    _.remove(Memory.needEnergyRooms, (r) => r === this.name);
    delete Memory.rooms[this.name].needHelp;
    return '---!!!---' + this.name + ' no more need help ---!!!---';
  }
  return;

};

Room.prototype.checkCanHelp = function() {
  if (!Memory.needEnergyRooms) {
    return;
  }

  let nearestRoom = this.memory.nearestRoom;
  if (!nearestRoom || !Memory.rooms[nearestRoom] || !Memory.rooms[nearestRoom].needHelp) {
    nearestRoom = this.nearestRoomName(Memory.needEnergyRooms, config.carryHelpers.maxDistance);
    this.memory.nearestRoom = nearestRoom;
  }
  if (!Game.rooms[nearestRoom] || !Memory.rooms[nearestRoom].needHelp) {
    _.remove(Memory.needEnergyRooms, (r) => r === nearestRoom);
  }
  let nearestRoomObj = Game.rooms[nearestRoom];

  let canHelp = this.memory.energyAvailableSum > config.carryHelpers.helpTreshold * config.carryHelpers.ticksUntilHelpCheck &&
    nearestRoom !== this.name && nearestRoomObj && this.storage && //!nearestRoomObj.hostile &&
    !nearestRoomObj.terminal;
  if (canHelp) {
    let route = this.findRoute(nearestRoom, this.name);
    if (route == -2 || route.length === 0) {
      return 'no';
    }
    this.checkRoleToSpawn('carry', config.carryHelpers.maxHelpersAmount, this.storage.id,
      this.name, undefined, nearestRoom);
    this.memory.energyAvailableSum = 0;
    return '---!!! ' + this.name + ' send energy to: ' + nearestRoom + ' !!!---';
  }
  return 'no';

};

Room.prototype.checkForEnergyTransfer = function() {
  if (config.carryHelpers.disabled) {
    return false;
  }

  Memory.needEnergyRooms = Memory.needEnergyRooms || [];
  this.memory.energyAvailableSum = this.memory.energyAvailableSum || 0;
  if (Game.time % config.carryHelpers.ticksUntilHelpCheck) {
    let factor = config.carryHelpers.factor;
    this.memory.energyAvailable = (1 - factor) * this.memory.energyAvailable + (factor) * this.energyAvailable || 0;
    this.memory.energyAvailableSum += this.memory.energyAvailable;
    return;
  }
  let needHelp = this.checkNeedHelp();
  if (needHelp) {
    if (needHelp !== 'Already set as needHelp') {
      this.log(needHelp);
    }
  } else {
    let canHelp = this.checkCanHelp();
    if (canHelp !== 'no') {
      this.log(canHelp);
    }
  }
  this.memory.energyAvailableSum = 0;
};

Room.prototype.executeRoom = function() {
  let cpuUsed = Game.cpu.getUsed();
  this.buildBase();
  this.memory.attackTimer = this.memory.attackTimer || 0;
  var spawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  var hostiles = this.find(FIND_HOSTILE_CREEPS, {
    filter: this.findAttackCreeps
  });
  if (hostiles.length === 0) {
    this.memory.attackTimer = Math.max(this.memory.attackTimer - 5, 0);
    // Make sure we don't spawn towerFiller on reducing again
    if (this.memory.attackTimer % 5 === 0) {
      this.memory.attackTimer--;
    }
  }

  if (spawns.length === 0) {
    this.reviveRoom();
  } else if (this.energyCapacityAvailable < config.room.reviveEnergyCapacity) {
    this.reviveRoom();
    if (hostiles.length > 0) {
      this.controller.activateSafeMode();
    }
  } else {
    this.memory.active = true;
  }

  var room = this;

  var nextroomers = this.find(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.memory.role === 'nextroomer') {
        return object.memory.base != room.name;
      }
      return false;
    }
  });
  var building = nextroomers.length > 0 && this.controller.level < 5;

  var creepsInRoom = this.find(FIND_MY_CREEPS);
  var spawn;
  if (!building) {
    let amount = 1;
    if (!room.storage) {
      amount = 2;
      // TODO maybe better spawn harvester when a carry recognize that the dropped energy > threshold
      if (room.controller.level === 2 || room.controller.level === 3) {
        amount = 5;
      }
    }
    this.checkRoleToSpawn('harvester', amount, 'harvester');
  }

  if (this.memory.attackTimer > 100) {
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
  if (this.memory.attackTimer >= 50 && this.controller.level > 6) {
    let towers = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_TOWER]);
    if (towers.length === 0) {
      this.memory.attackTimer = 47;
    } else {
      if (this.memory.attackTimer === 50 && this.memory.position.creep.towerFiller) {
        for (let towerFillerPos of this.memory.position.creep.towerFiller) {
          this.log('Spawning towerfiller: ' + this.memory.attackTimer);
          this.memory.queue.push({
            role: 'towerfiller',
            target_id: towerFillerPos
          });
        }
      }
    }
  }

  let idiotCreeps = this.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return object.owner.username != 'Invader';
    }
  });
  if (idiotCreeps.length > 0) {
    for (let idiotCreep of idiotCreeps) {
      brain.increaseIdiot(idiotCreep.owner.username);
    }
  }

  if (hostiles.length > 0) {
    this.memory.attackTimer++;

    if (this.memory.attackTimer > 15) {
      var defender = {
        role: 'defendranged'
      };
      if (this.memory.attackTimer > 300) {
        defender.role = 'defendmelee';
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

  this.checkForEnergyTransfer();

  this.checkAndSpawnSourcer();

  if (this.controller.level >= 4 && this.storage) {
    this.checkRoleToSpawn('storagefiller', 1, 'filler');
  }

  if (this.storage && this.storage.store.energy > config.room.upgraderMinStorage && !this.memory.misplacedSpawn) {
    this.checkRoleToSpawn('upgrader', 1, this.controller.id);
  }

  var constructionSites = this.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART], true);
  if (constructionSites.length > 0) {
    let amount = 1;
    for (let cs of constructionSites) {
      if (cs.structureType === STRUCTURE_STORAGE) {
        amount = 3;
      }
    }
    this.checkRoleToSpawn('planer', amount);
  } else if (this.memory.misplacedSpawn && this.storage && this.storage.store.energy > 20000 && this.energyAvailable >= this.energyCapacityAvailable - 300) {
    this.checkRoleToSpawn('planer', 4);
  }
  let extractors = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_EXTRACTOR]);
  if (this.terminal && extractors.length > 0) {
    let minerals = this.find(FIND_MINERALS);
    if (minerals.length > 0 && minerals[0].mineralAmount > 0) {
      let amount = this.terminal.store[minerals[0].mineralType] || 0;
      if (amount < config.mineral.storage) {
        this.checkRoleToSpawn('extractor');
      }
    }
  }
  if (config.mineral.enabled && this.terminal && ((this.memory.mineralBuilds && Object.keys(this.memory.mineralBuilds).length > 0) || this.memory.reaction || this.memory.mineralOrder)) {
    this.checkRoleToSpawn('mineral');
  }

  if (!building && nextroomers.length === 0) {
    this.handleScout();
  }
  let constructionSitesBlocker = this.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL]);
  this.handleTower();
  if (this.controller.level > 1 && this.memory.walls && this.memory.walls.finished) {
    this.checkRoleToSpawn('repairer');
  }

  this.handleLinks();
  this.handleObserver();
  this.handlePowerSpawn();
  this.handleTerminal();
  this.handleNukeAttack();

  if (Game.time % 10 === 0) {
    this.spawnCheckForCreate();
  }

  this.handleMarket();
  brain.stats.addRoom(this.name, cpuUsed);
  return true;
};

Room.prototype.reviveMyNow = function() {
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
    if (this.name === roomName) {
      continue;
    }
    let roomOther = Game.rooms[roomName];
    if (!roomOther.memory.active) {
      continue;
    }
    if (!roomOther.storage || roomOther.storage.store.energy < config.room.reviveStorageAvailable) {
      continue;
    }
    // TODO find a proper value
    if (roomOther.memory.queue.length > config.revive.reviverMaxQueue) {
      continue;
    }

    // TODO config value, meaningful
    if (roomOther.energyCapacityAvailable < config.revive.reviverMinEnergy) {
      continue;
    }

    let distance = Game.map.getRoomLinearDistance(this.name, roomName);
    if (distance < config.nextRoom.maxDistance) {
      let route = this.findRoute(roomOther.name, this.name);
      // TODO Instead of skipping we could try to free up the way: nextroomerattack or squad
      if (route.length === 0) {
        roomOther.log('No route to other room: ' + roomOther.name);
        continue;
      }

      let role = this.memory.wayBlocked ? 'nextroomerattack' : 'nextroomer';
      let hostileCreep = this.find(FIND_HOSTILE_CREEPS);
      if (hostileCreep.length > 0) {
        roomOther.checkRoleToSpawn('defender', 1, undefined, this.name);
      }
      roomOther.checkRoleToSpawn(role, 1, undefined, this.name);
      nextroomerCalled++;
    }
  }
};

Room.prototype.setRoomInactive = function() {
  this.log('Setting room to underSiege');
  //this.memory.underSiege = true;
  let tokens = Game.market.getAllOrders({
    type: ORDER_SELL,
    resourceType: SUBSCRIPTION_TOKEN
  });
  let addToIdiot = 3000000;
  if (tokens.length > 0) {
    tokens = _.sortBy(tokens, function(object) {
      return -1 * object.price;
    });
    addToIdiot = Math.max(addToIdiot, tokens[0].price);
  }
  this.log('Increase idiot by subscription token');
  let idiotCreeps = this.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return object.owner.username !== 'Invader';
    }
  });
  if (idiotCreeps.length > 0) {
    for (let idiotCreep of idiotCreeps) {
      brain.increaseIdiot(idiotCreep.owner.username, addToIdiot);
    }
  }
  this.memory.active = false;
};

Room.prototype.reviveRoom = function() {
  let nextRoomers = _.filter(Game.creeps, c => c.memory.role === 'nextroomer' &&
    c.memory.routing.targetRoom === this.name).length;
  if (this.controller.level >= config.nextRoom.boostToControllerLevel &&
    this.controller.ticksToDowngrade >
    (CONTROLLER_DOWNGRADE[this.controller.level] * config.nextRoom.minDowngradPercent / 100) &&
    this.energyCapacityAvailable > config.nextRoom.minEnergyForActive) {
    this.memory.active = true;
    return false;
  } else if (this.controller.level > 1 && nextRoomers >= config.nextRoom.numberOfNextroomers) {
    return false;
  }

  if (this.memory.active) {
    this.setRoomInactive();
  }

  this.handleTower();
  this.handleTerminal();
  if (!config.room.revive) {
    return false;
  }

  if (this.controller.level === 1 && this.controller.ticksToDowngrade < 100) {
    this.clearRoom();
    return false;
  }

  if (!config.revive.disabled && this.controller.level >= 1 &&
    (Game.time + this.controller.pos.x + this.controller.pos.y) %
    config.nextRoom.nextroomerInterval === 0) {
    this.reviveMyNow();
  }
  return true;
};
