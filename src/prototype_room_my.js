'use strict';

Room.prototype.myHandleRoom = function() {
  if (!Memory.username) {
    Memory.username = this.controller.owner.username;
  }
  this.memory.lastSeen = Game.time;
  this.memory.constructionSites = this.find(FIND_CONSTRUCTION_SITES);
  const room = this;

  // TODO Fix for after `delete Memory.rooms`
  if (!room.memory.position || !room.memory.position.structure) {
    this.setup();
  }

  if (!this.memory.queue) {
    this.memory.queue = [];
  }

  const hostiles = this.getEnemys();
  if (hostiles.length === 0) {
    delete this.memory.hostile;
  } else {
    if (this.memory.hostile) {
      this.memory.hostile.lastUpdate = Game.time;
      this.memory.hostile.hostiles = hostiles;
    } else {
      // this.log('Hostile creeps: ' + hostiles[0].owner.username);
      this.memory.hostile = {
        lastUpdate: Game.time,
        hostiles: hostiles,
      };
    }
  }
  return this.executeRoom();
};

Room.prototype.getLinkStorage = function() {
  this.memory.constants = this.memory.constants || {};
  if (this.memory.constants.linkStorage) {
    const link = Game.getObjectById(this.memory.constants.linkStorage);
    if (link && link !== null) {
      return link;
    }
  }
  const linkPos = this.memory.position.structure.link[0];
  const linkPosObject = new RoomPosition(linkPos.x, linkPos.y, this.name);
  const structures = linkPosObject.lookFor(LOOK_STRUCTURES);
  for (const structure of structures) {
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

  const linkStorage = this.getLinkStorage();
  if (!linkStorage) {
    return;
  }

  const links = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_LINK], {
    filter: (link) => link.id !== linkStorage.id,
  });

  if (links.length > 0) {
    const numberOfLinks = CONTROLLER_STRUCTURES.link[this.controller.level];
    const time = Game.time % ((numberOfLinks - 1) * 12);
    const link = (time / 12);
    if (time % 12 === 0 && links.length - 1 >= link) {
      if (this.memory.attackTimer > 50 && this.controller.level > 6) {
        for (let i = 1; i < 3; i++) {
          const linkSourcer = this.memory.position.structure.link[i];
          if (links[link].pos.isEqualTo(linkSourcer.x, linkSourcer.y)) {
            links[link].transferEnergy(linkStorage);
            return true;
          }
        }
        linkStorage.transferEnergy(links[link]);
      } else {
        const returnCode = links[link].transferEnergy(linkStorage);
        if (returnCode !== OK && returnCode !== ERR_NOT_ENOUGH_RESOURCES && returnCode !== ERR_TIRED) {
          this.log('handleLinks.transferEnergy returnCode: ' + returnCode + ' targetPos: ' + linkStorage.pos);
        }
      }
    }
  }
};

Room.prototype.handlePowerSpawn = function() {
  const powerSpawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_POWER_SPAWN]);
  if (powerSpawns.length === 0) {
    return false;
  }
  const powerSpawn = powerSpawns[0];
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
  const observers = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_OBSERVER]);
  if (observers.length > 0) {
    if (!this.memory.observe_rooms) {
      // TODO manage switch from E to W and S to N
      this.memory.observe_rooms = [];
      const nameSplit = this.splitRoomName();
      for (let x = +nameSplit[2] - 5; x <= +nameSplit[2] + 5; x++) {
        for (let y = +nameSplit[4] - 5; y <= +nameSplit[4] + 5; y++) {
          if (x % 10 === 0 || y % 10 === 0) {
            this.memory.observe_rooms.push(nameSplit[1] + x + nameSplit[3] + y);
          }
        }
      }
    }

    // TODO scan full range, first implementation
    const nameSplit = this.splitRoomName();
    const observerRange = Math.max(Math.min(config.room.observerRange, OBSERVER_RANGE), 1);
    const fullLength = 2 * observerRange + 1;
    const numberOfFields = fullLength * fullLength;
    const offset = Game.time % numberOfFields;
    const xOffset = Math.floor(offset / fullLength) - observerRange;
    const yOffset = Math.floor(offset % fullLength) - observerRange;

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

    const roomObserve = xDir + xPos + yDir + yPos;
    const returnCode = observers[0].observeRoom(roomObserve);
    if (config.debug.observer) {
      this.log(`${observers[0]} observing ${roomObserve}`);
    }
    if (returnCode !== OK) {
      this.log('observer returnCode: ' + returnCode + ' ' + roomObserve + ' ' + fullLength + ' ' + numberOfFields + ' ' + offset + ' ' + xOffset + ' ' + yOffset);
    }
  }
};

Room.prototype.handleScout = function() {
  if (this.name === 'sim') {
    return false;
  }
  const shouldSpawn = (
    this.exectueEveryTicks(config.room.scoutInterval) &&
    this.controller.level >= 2 &&
    this.memory.queue.length === 0 &&
    config.room.scout
  );
  if (shouldSpawn) {
    const scoutSpawn = {
      role: 'scout',
    };
    if (!this.inQueue(scoutSpawn)) {
      this.memory.queue.push(scoutSpawn);
    }
  }
};

Room.prototype.checkNeedHelp = function() {
  const needHelp = this.memory.energyStats.average < config.carryHelpers.needTreshold; // && !this.hostile;
  const oldNeedHelp = this.memory.needHelp;
  if (needHelp) {
    if (!oldNeedHelp) {
      Memory.needEnergyRooms.push(this.name);
      this.memory.needHelp = true;
      return '---!!!---' + this.name + ' need energy ---!!!---';
    }
    return 'Already set as needHelp';
  }
  if (oldNeedHelp) {
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
  const nearestRoomObj = Game.rooms[nearestRoom];
  const canHelp = this.memory.energyStats.average > config.carryHelpers.helpTreshold &&
    nearestRoom !== this.name && nearestRoomObj && this.storage && // !nearestRoomObj.hostile &&
    !nearestRoomObj.terminal;
  if (canHelp) {
    const route = this.findRoute(nearestRoom, this.name);
    if (route === -2 || route.length === 0) {
      return 'no';
    }
    this.checkRoleToSpawn('carry', config.carryHelpers.maxHelpersAmount, this.storage.id,
      this.name, undefined, nearestRoom, {
        helper: true,
      });
    return '---!!! ' + this.name + ' send energy to: ' + nearestRoom + ' !!!---';
  }
  return 'no';
};

Room.prototype.checkForEnergyTransfer = function() {
  if (config.carryHelpers.disabled) {
    return false;
  }

  Memory.needEnergyRooms = Memory.needEnergyRooms || [];
  this.memory.energyStats = this.memory.energyStats || {sum: 0, ticks: 0};
  if (!this.exectueEveryTicks(config.carryHelpers.ticksUntilHelpCheck)) {
    const factor = config.carryHelpers.factor;
    this.memory.energyStats.available = (1 - factor) * this.memory.energyStats.available + (factor) * this.energyAvailable || 0;
    this.memory.energyStats.sum += this.memory.energyStats.available;
    this.memory.energyStats.ticks++;
    return;
  }
  this.memory.energyStats.average = this.memory.energyStats.sum / this.memory.energyStats.ticks;
  const needHelp = this.checkNeedHelp();
  if (needHelp) {
    if (needHelp !== 'Already set as needHelp') {
      this.log(needHelp);
    }
  } else {
    const canHelp = this.checkCanHelp();
    if (canHelp !== 'no') {
      this.log(canHelp);
    }
  }
  this.memory.energyStats.sum = 0;
  this.memory.energyStats.ticks = 0;
};

Room.prototype.getHarvesterAmount = function() {
  let amount = 1;
  if (!this.storage) {
    amount = 2;
    // TODO maybe better spawn harvester when a carry recognize that the dropped energy > threshold
    if (this.controller.level === 2 || this.controller.level === 3) {
      amount = 5;
    }
  } else {
    if (this.storage.store.energy < config.creep.energyFromStorageThreshold && this.controller.level < 5) {
      amount = 3;
    }
    if (this.storage.store.energy > 2 * config.creep.energyFromStorageThreshold && this.controller.level > 6 && this.energyAvailable > 2000) {
      amount = 2;
    }
    if (!this.storage.my) {
      amount = 10;
    }
  }
  return amount;
};

Room.prototype.executeRoom = function() {
  const cpuUsed = Game.cpu.getUsed();
  this.buildBase();
  this.memory.attackTimer = this.memory.attackTimer || 0;
  const spawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  const hostiles = this.find(FIND_HOSTILE_CREEPS, {
    filter: this.findAttackCreeps,
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

  const nextroomers = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['nextroomer'], {
    filter: (object) => object.memory.base !== this.name,
  });
  const building = nextroomers.length > 0 && this.controller.level < 4;

  if (!building) {
    const amount = this.getHarvesterAmount();

    this.checkRoleToSpawn('harvester', amount, 'harvester');
  }

  if (this.memory.attackTimer > 100) {
    // TODO better metric for SafeMode
    const enemies = this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Invader'], {inverse: true});
    if (enemies > 0) {
      this.controller.activateSafeMode();
    }
  }
  if (this.memory.attackTimer >= 50 && this.controller.level > 6) {
    const towers = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_TOWER]);
    if (towers.length === 0) {
      this.memory.attackTimer = 47;
    } else {
      if (this.memory.attackTimer === 50 && this.memory.position.creep.towerFiller) {
        for (const towerFillerPos of this.memory.position.creep.towerFiller) {
          this.log('Spawning towerfiller: ' + this.memory.attackTimer);
          this.memory.queue.push({
            role: 'towerfiller',
            target_id: towerFillerPos,
          });
        }
      }
    }
  }

  const idiotCreeps = this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Invader'], {inverse: true});
  if (idiotCreeps.length > 0) {
    for (const idiotCreep of idiotCreeps) {
      brain.increaseIdiot(idiotCreep.owner.username);
    }
  }

  if (hostiles.length > 0) {
    this.memory.attackTimer++;

    if (this.memory.attackTimer > 15) {
      let role = 'defendranged';
      if (this.memory.attackTimer > 300) {
        role = 'defendmelee';
      }
      if (this.exectueEveryTicks(250)) {
        this.checkRoleToSpawn(role, 1, undefined, this.name, 1, this.name);
      }
    }

    if (this.exectueEveryTicks(10)) {
      this.log('Under attack from ' + hostiles[0].owner.username);
    }
    if (hostiles[0].owner.username !== 'Invader' && !brain.isFriend(hostiles[0].owner.username)) {
      Game.notify(this.name + ' Under attack from ' + hostiles[0].owner.username + ' at ' + Game.time);
    }
  }

  this.checkForEnergyTransfer();

  this.checkAndSpawnSourcer();

  if (this.controller.level >= 4 && this.storage && this.storage.my) {
    this.checkRoleToSpawn('storagefiller', 1, 'filler');
  }

  if (this.storage && this.storage.my && this.storage.store.energy > config.room.upgraderMinStorage && !this.memory.misplacedSpawn) {
    this.checkRoleToSpawn('upgrader', 1, this.controller.id);
  }

  const constructionSites = this.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART], {inverse: true});
  if (constructionSites.length > 0) {
    let amount = 1;
    for (const cs of constructionSites) {
      if (cs.structureType === STRUCTURE_STORAGE) {
        amount = 3;
      }
    }
    if (this.controller.level === 4 && this.memory.misplacedSpawn) {
      amount = 3;
    }
    this.checkRoleToSpawn('planer', amount);
  } else if (this.memory.misplacedSpawn && this.storage && this.storage.store.energy > 20000 && this.energyAvailable >= this.energyCapacityAvailable - 300) {
    this.checkRoleToSpawn('planer', 4);
  }
  const extractors = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_EXTRACTOR]);
  if (this.terminal && extractors.length > 0) {
    const minerals = this.find(FIND_MINERALS);
    if (minerals.length > 0 && minerals[0].mineralAmount > 0) {
      const amount = this.terminal.store[minerals[0].mineralType] || 0;
      if (amount < config.mineral.storage) {
        this.checkRoleToSpawn('extractor');
      }
    }
  }
  if (config.mineral.enabled && this.terminal && this.storage) {
    this.checkRoleToSpawn('mineral');
  }

  if (!building && nextroomers.length === 0) {
    this.handleScout();
  }
  this.handleTower();
  if (this.controller.level > 1 && this.memory.walls && this.memory.walls.finished) {
    this.checkRoleToSpawn('repairer');
  }

  this.handleLinks();
  this.handleObserver();
  this.handlePowerSpawn();
  this.handleTerminal();
  this.handleNukeAttack();
  this.spawnCheckForCreate();
  this.handleMarket();
  brain.stats.addRoom(this.name, cpuUsed);
  return true;
};

Room.prototype.reviveMyNow = function() {
  let nextroomerCalled = 0;
  const room = this;

  const sortByDistance = function(object) {
    return Game.map.getRoomLinearDistance(room.name, object);
  };
  const roomsMy = _.sortBy(Memory.myRooms, sortByDistance);

  for (const roomIndex in roomsMy) {
    if (nextroomerCalled > config.nextRoom.numberOfNextroomers) {
      break;
    }
    const roomName = Memory.myRooms[roomIndex];
    if (this.name === roomName) {
      continue;
    }
    const roomOther = Game.rooms[roomName];
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

    const distance = Game.map.getRoomLinearDistance(this.name, roomName);
    if (distance < config.nextRoom.maxDistance) {
      const route = this.findRoute(roomOther.name, this.name);
      // TODO Instead of skipping we could try to free up the way: nextroomerattack or squad
      if (route.length === 0) {
        roomOther.log('No route to other room: ' + roomOther.name);
        continue;
      }

      const role = this.memory.wayBlocked ? 'nextroomerattack' : 'nextroomer';
      const hostileCreep = this.find(FIND_HOSTILE_CREEPS);
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
  // this.memory.underSiege = true;
  let tokens;
  try {
    tokens = Game.market.getAllOrders({
      type: ORDER_SELL,
      resourceType: SUBSCRIPTION_TOKEN,
    });
  } catch (e) {
    this.log('No Subscription Tokens for sale adding value of 5,000,000.000');
    tokens = [{
      price: 5000000.000, // change this value to whatever you feel appropriate enough
    }];
  }
  let addToIdiot = 3000000;
  if (tokens.length > 0) {
    tokens = _.sortBy(tokens, (object) => {
      return -1 * object.price;
    });
    addToIdiot = Math.max(addToIdiot, tokens[0].price);
  }
  this.log('Increase idiot by subscription token');
  const idiotCreeps = this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Invader'], {inverse: true});
  if (idiotCreeps.length > 0) {
    for (const idiotCreep of idiotCreeps) {
      brain.increaseIdiot(idiotCreep.owner.username, addToIdiot);
    }
  }
  this.memory.active = false;
};

Room.prototype.reviveRoom = function() {
  const nextRoomers = _.filter(Game.creeps, (c) => c.memory.role === 'nextroomer' &&
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
    this.exectueEveryTicks(config.nextRoom.nextroomerInterval)) {
    this.reviveMyNow();
  }
  return true;
};
