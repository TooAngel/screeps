'use strict';

Room.prototype.unclaimRoom = function() {
  // remove creeps if base === this.name
  const room = this;
  let returnValue;
  global.utils.killCreeps(room);
  const sites = global.utils.removeConstructionSites(room);
  if (sites < 2) {
    returnValue = global.utils.removeNextStructure(room);
    if (returnValue !== OK) {
      room.log('destroy / unclaim did not work');
    }
  }
};

Room.prototype.myHandleRoom = function() {
  if (!Memory.username) {
    Memory.username = this.controller.owner.username;
  }
  this.memory.lastSeen = Game.time;
  this.memory.constructionSites = this.find(FIND_CONSTRUCTION_SITES);

  // TODO Fix for after `delete Memory.rooms`
  if (!this.memory.position || !this.memory.position.structure) {
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
  if (this.memory.unclaim) {
    return this.unclaimRoom();
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
    const time = Game.time % (links.length * 12);
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
        if (returnCode !== OK &&
            returnCode !== ERR_NOT_ENOUGH_RESOURCES &&
            returnCode !== ERR_TIRED &&
            returnCode !== ERR_RCL_NOT_ENOUGH) {
          links[link].log('handleLinks.transferEnergy returnCode: ' + returnCode + ' targetPos: ' + linkStorage.pos);
        }
      }
    }
  }
};

Room.prototype.handlePowerSpawn = function() {
  // added exectueEveryTicks 3 for movement of harvesters
  if (this.exectueEveryTicks(3)) {
    const powerSpawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_POWER_SPAWN]);
    if (powerSpawns.length === 0) {
      return false;
    }
    const powerSpawn = powerSpawns[0];
    this.savePowerSpawnId(powerSpawn);

    if (powerSpawn.power > 0) {
      powerSpawn.processPower();
    }
  }
};

// added memory.constants.powerSpawn = powerSpawn.id for role storagefiller
Room.prototype.savePowerSpawnId = function(powerSpawn) {
  if (!this.memory.constants.powerSpawn || this.memory.constants.powerSpawn !== powerSpawn.id) {
    this.memory.constants.powerSpawn = powerSpawn.id;
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
  const observers = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_OBSERVER]);
  const levelCheck = (this.controller.level >= 2 && this.controller.level < 8) || (this.controller.level === 8 && observers.length === 0);
  const shouldSpawn = (
    this.exectueEveryTicks(config.room.scoutInterval) &&
    levelCheck &&
    this.memory.queue.length === 0 &&
    config.room.scout
  );
  if (shouldSpawn) {
    const scoutSpawn = {
      role: 'scout',
      routing: {
        targetRoom: this.name,
      },
    };
    if (!this.inQueue(scoutSpawn)) {
      return this.memory.queue.push(scoutSpawn);
    }
  }
  return false;
};

Room.prototype.checkNeedHelp = function() {
  let needHelp = this.memory.energyStats.average < config.carryHelpers.needTreshold; // && !this.hostile;
  if (!needHelp) {
    needHelp = (this.storage) ? (this.storage.store.energy < 125000) : false;
  }
  const oldNeedHelp = this.memory.needHelp;
  if (needHelp) {
    if (!oldNeedHelp) {
      Memory.needEnergyRooms.push(this.name);
      this.memory.needHelp = true;
      this.debugLog('energyTransfer', '---!!!---' + this.name + ' need energy ---!!!---');
      return true;
    }
    return true;
  }
  if (oldNeedHelp) {
    _.remove(Memory.needEnergyRooms, (r) => r === this.name);
    delete Memory.rooms[this.name].needHelp;
    this.debugLog('energyTransfer', '---!!!---' + this.name + ' no more need help ---!!!---');
    return true;
  }
  return false;
};

Room.prototype.checkCanHelp = function() {
  let returnValue = 'no';
  if (!Memory.needEnergyRooms || Memory.needEnergyRooms.length === 0) {
    return returnValue;
  }

  let nearestRoom = this.memory.nearestRoom;
  if (!nearestRoom || !Memory.rooms[nearestRoom] || !Memory.rooms[nearestRoom].needHelp) {
    nearestRoom = this.nearestRoomName(Memory.needEnergyRooms, config.carryHelpers.maxDistance);
    this.memory.nearestRoom = nearestRoom;
  }
  if (!Game.rooms[nearestRoom] || !Memory.rooms[nearestRoom].needHelp) {
    _.remove(Memory.needEnergyRooms, (r) => r === nearestRoom);
  }
  if (nearestRoom === Infinity) {
    return returnValue;
  }
  const nearestRoomObj = Game.rooms[nearestRoom];
  if (nearestRoom === this.name) {
    returnValue = `no can't help myself`;
  }
  if (!this.storage) {
    returnValue = `no can't help, no storage at ${this.name}}`;
  }
  if (!nearestRoomObj) {
    delete this.memory.nearestRoom;
    returnValue = `no can't help, no nearestRoomObj`;
  }
  if (returnValue !== 'no') {
    return returnValue;
  }

  const thisRoomCanHelp = this.memory.energyStats.average > config.carryHelpers.helpTreshold;
  const canHelp = thisRoomCanHelp && nearestRoomObj && (!nearestRoomObj.terminal ||
    nearestRoomObj.terminal.store.energy < config.carryHelpers.helpTreshold * 2 ||
    (nearestRoomObj.storage.store.energy < this.storage.store.energy && this.storage.store.energy > 700000));
  if (canHelp) {
    const route = this.findRoute(nearestRoom, this.name);
    if (route === -2 || route.length === 0) {
      returnValue = `no route`;
    } else {
      Memory.canHelpRooms.push(this.name);
      this.checkRoleToSpawn('carry', config.carryHelpers.maxHelpersAmount, this.storage.id, this.name, undefined, nearestRoom, {helper: true});
      returnValue = `---!!! ${this.name} send energy to ${nearestRoom} !!!---`;
    }
  }
  return returnValue;
};

Room.prototype.updateEnergyStatsAndCheckForHelp = function() {
  this.memory.energyStats.average = this.memory.energyStats.sum / this.memory.energyStats.ticks;
  const needHelp = this.checkNeedHelp();
  if (!needHelp) {
    const canHelp = this.checkCanHelp();
    if (canHelp !== 'no') {
      this.log(canHelp);
    }
  }
  this.memory.energyStats.sum = 0;
  this.memory.energyStats.ticks = 0;
};

Room.prototype.checkForEnergyTransfer = function(force) {
  if (config.carryHelpers.disabled) {
    return false;
  }

  Memory.needEnergyRooms = _.uniq(Memory.needEnergyRooms) || [];
  Memory.canHelpRooms = _.uniq(Memory.canHelpRooms) || [];
  this.memory.energyStats = this.memory.energyStats || {sum: 0, ticks: 0};
  if (force) {
    this.updateEnergyStatsAndCheckForHelp();
    return true;
  }

  if (this.exectueEveryTicks(config.carryHelpers.ticksUntilHelpCheck)) {
    this.updateEnergyStatsAndCheckForHelp();
    return true;
  } else {
    const factor = config.carryHelpers.factor;
    this.memory.energyStats.available = (1 - factor) * this.memory.energyStats.available + (factor) * this.energyAvailable || 0;
    this.memory.energyStats.sum += this.memory.energyStats.available;
    this.memory.energyStats.ticks++;
    return false;
  }
};

Room.prototype.getHarvesterAmount = function() {
  let amount = 1;
  if (!this.storage) {
    amount = 2;
  } else {
    if (this.storage.store.energy < config.creep.energyFromStorageThreshold && this.controller.level < 5) {
      amount = 3;
    }
    if (this.storage.store.energy > 2 * config.creep.energyFromStorageThreshold && this.controller.level > 6 && this.energyAvailable > 2000 && this.memory.queue.length > 4) {
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
  // Room is build up while nextroomers are in the room and sourcerers are too small
  const building = nextroomers.length > 0 && this.energyCapacityAvailable <= 600;

  if (!building) {
    const amount = this.getHarvesterAmount();
    this.checkRoleToSpawn('harvester', amount);
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
      if (hostiles[0].owner.username !== 'Invader' || config.debug.invader) {
        this.log('Under attack from ' + hostiles[0].owner.username);
      }
    }
    if (hostiles[0].owner.username !== 'Invader' && !brain.isFriend(hostiles[0].owner.username)) {
      Game.notify(this.name + ' Under attack from ' + hostiles[0].owner.username + ' at ' + Game.time);
    }
  }

  if (Memory.myRooms && (Memory.myRooms.length < 5) && building) {
    brain.stats.addRoom(this.name, cpuUsed);
    return true;
  }

  this.checkForEnergyTransfer();

  this.checkAndSpawnSourcer();

  if (this.controller.level >= 4 && this.storage && this.storage.my && !this.memory.misplacedSpawn) {
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
        amount = 6;
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
    const labs = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_LAB]);
    if ((!this.memory.cleanup || this.memory.cleanup <= 10) && (_.size(labs) > 2)) {
      this.checkRoleToSpawn('mineral');
    }
    if ((Game.time + this.controller.pos.x + this.controller.pos.y) % 10000 < 10) {
      this.memory.cleanup = 0;
    }
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
  // TODO find a proper value for config.revive.reviverMaxQueue,
  // TODO find meaningful config value for config.revive.reviverMinEnergy
  const notSuitableRoom = function(roomName, roomOther) {
    if (room.name === roomName) {
      if (config.debug.revive) {
        room.log(`Same room`);
      }
      return true;
    }
    if (!roomOther || !roomOther.memory || !roomOther.memory.active) {
      if (config.debug.revive) {
        room.log(`Other room ${roomOther} not active`);
      }
      return true;
    }
    if (!roomOther.storage || roomOther.storage.store.energy < config.revive.otherMinStorageAvailable) {
      if (config.debug.revive) {
        room.log(`Other room ${roomOther} no storage`);
      }
      return true;
    }
    if (!roomOther.memory.queue || roomOther.memory.queue.length > config.revive.reviverMaxQueue) {
      if (config.debug.revive) {
        room.log(`Other room ${roomOther} no queue`);
      }
      return true;
    }
    if (roomOther.energyCapacityAvailable < config.revive.reviverMinEnergy) {
      if (config.debug.revive) {
        room.log(`Other room ${roomOther} no energy`);
      }
      return true;
    }
    return false;
  };

  const checkForRoute = function(roomOther) {
    const route = room.findRoute(roomOther.name, room.name);
    // TODO Instead of skipping we could try to free up the way: nextroomerattack or squad
    if (route.length === 0) {
      roomOther.log('No route to other room: ' + roomOther.name);
      return true;
    }
    return false;
  };

  const callNextRoomer = (roomName) => {
    if (nextroomerCalled > config.nextRoom.numberOfNextroomers) {
      if (config.debug.revive) {
        room.log(`No nextroomer too many called ${nextroomerCalled} / ${config.nextRoom.numberOfNextroomers}`);
      }
      return false;
    }
    const roomOther = Game.rooms[roomName];
    if (notSuitableRoom(roomName, roomOther)) {
      if (config.debug.revive) {
        room.log(`No nextroomer noNeedNextroomers ${roomOther}`);
      }
      return false;
    }
    const distance = Game.map.getRoomLinearDistance(this.name, roomName);
    if (distance < config.nextRoom.maxDistance) {
      if (checkForRoute(roomOther)) {
        if (config.debug.revive) {
          room.log(`No nextroomer checkForRoute`);
        }
        return false;
      }

      const role = this.memory.wayBlocked ? 'nextroomerattack' : 'nextroomer';
      const hostileCreep = this.find(FIND_HOSTILE_CREEPS);
      if (hostileCreep.length > 0) {
        roomOther.checkRoleToSpawn('defender', 1, undefined, this.name);
      }
      roomOther.checkRoleToSpawn(role, 1, undefined, this.name);
      nextroomerCalled++;
      return {called: nextroomerCalled, base: roomOther, to: this.name};
    }
  };
  const nextroomers = _.map(roomsMy, callNextRoomer);
  if (config.debug.revive) {
    this.log('nextroomers ', nextroomers);
  }
  return nextroomerCalled;
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
  if (!this.exectueEveryTicks(config.revive.nextroomerInterval)) {
    return false;
  }

  const nextRoomers = _.filter(Game.creeps, (c) => c.memory.role === 'nextroomer' &&
  c.memory.routing.targetRoom === this.name).length;
  if (this.controller.level >= config.nextRoom.boostToControllerLevel &&
    this.controller.ticksToDowngrade >
    (CONTROLLER_DOWNGRADE[this.controller.level] * config.nextRoom.minDowngradPercent / 100) &&
    this.energyCapacityAvailable > config.nextRoom.minEnergyForActive) {
    this.memory.active = true;
    if (config.debug.revive) {
      this.log(`reviveRoom set active ${this.controller.level >= config.nextRoom.boostToControllerLevel}` /
        ` ${this.controller.ticksToDowngrade > (CONTROLLER_DOWNGRADE[this.controller.level] * config.nextRoom.minDowngradPercent / 100)}` /
        ` ${this.energyCapacityAvailable > config.nextRoom.minEnergyForActive}`);
    }
    return false;
  } else if (this.controller.level > 1 && nextRoomers >= config.nextRoom.numberOfNextroomers) {
    if (config.debug.revive) {
      this.log(`reviveRoom enough nextRoomers ${nextRoomers}/${config.nextRoom.numberOfNextroomers}`);
    }
    return false;
  }

  if (this.memory.active) {
    this.setRoomInactive();
  }

  this.handleTower();
  this.handleTerminal();
  if (config.revive.disabled) {
    if (config.debug.revive) {
      this.log(`reviveRoom room not set to revive`);
    }
    return false;
  }

  if (this.controller.level === 1 && this.controller.ticksToDowngrade < 100) {
    if (config.debug.revive) {
      this.log(`reviveRoom Will die, clearRoom`);
    }
    this.clearRoom();
    return false;
  }

  this.reviveMyNow();
  return true;
};
