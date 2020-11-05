'use strict';

const {findMyRoomsSortByDistance} = require('./helper_findMyRooms');

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
  this.memory.state = 'Controlled';
  if (!Memory.username) {
    Memory.username = this.controller.owner.username;
  }
  this.memory.constructionSites = this.findConstructionSites();

  if (!this.memory.queue) {
    this.memory.queue = [];
  }

  const hostiles = this.findEnemys();
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

/**
 * isUnexpectedLinkTransferReturnCode - Returns true on unexpected returnCode
 *
 * - OK: is fine
 * - ERR_NOT_ENOUGH_RESOURCES: Somehow it wasn't filled, but fine
 * - ERR_TIRED: Came back early, not sure why this is included, but also fine
 * could be removed here for optimization / error checking
 * - ERR_RCL_NOT_ENOUGH: Room got downgraded, so okay if the link is not active
 *
 * @param {number} returnCode - The returnCode of the transferEnergy operation
 * @return {boolean} - If the returnCode is unexpected
 */
function isUnexpectedLinkTransferReturnCode(returnCode) {
  return returnCode !== OK &&
      returnCode !== ERR_NOT_ENOUGH_RESOURCES &&
      returnCode !== ERR_TIRED &&
      returnCode !== ERR_RCL_NOT_ENOUGH;
}

Room.prototype.handleLinksTransferEnergy = function(links, linkIndex, linkStorage) {
  if (this.memory.attackTimer > 50 && this.controller.level > 6) {
    // If under attack, only fetch from links next to the sourcer
    // and transfer to the other links
    for (let i = 1; i < 3; i++) {
      const linkSourcer = this.memory.position.structure.link[i];
      if (links[linkIndex].pos.isEqualTo(linkSourcer.x, linkSourcer.y)) {
        links[linkIndex].transferEnergy(linkStorage);
        return true;
      }
    }
    linkStorage.transferEnergy(links[linkIndex]);
    return;
  }

  const returnCode = links[linkIndex].transferEnergy(linkStorage);
  if (isUnexpectedLinkTransferReturnCode(returnCode)) {
    links[linkIndex].log('handleLinks.transferEnergy returnCode: ' + returnCode + ' targetPos: ' + linkStorage.pos);
  }
};

Room.prototype.handleLinks = function() {
  const linkStorage = this.getLinkStorage();
  // Only send energy if linkStorage is set and free capacity is higher or equals than 400 Energy
  if (!linkStorage || linkStorage.store.getFreeCapacity(RESOURCE_ENERGY) < 400) {
    return;
  }

  const links = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_LINK], {
    filter: (link) => link.id !== linkStorage.id,
  });

  if (links.length > 0) {
    const time = Game.time % (links.length * 12);
    const linkIndex = (time / 12);
    if (time % 12 === 0 && links.length - 1 >= linkIndex) {
      this.handleLinksTransferEnergy(links, linkIndex, linkStorage);
    }
  }
};

Room.prototype.handlePowerSpawn = function() {
  // added executeEveryTicks 3 for movement of harvesters
  if (this.executeEveryTicks(3)) {
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

Room.prototype.getRoomNameToObserve = function() {
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

  return xDir + xPos + yDir + yPos;
};

Room.prototype.handleObserver = function() {
  // This could be made a helper function for all handleSTRUCTURE metods
  // and used at the caller
  // something like: `execute('STRUCTURE_OBSERVER', handleObserver)`
  if (CONTROLLER_STRUCTURES.observer[this.controller.level] === 0) {
    return false;
  }
  const observers = this.findObservers();
  if (observers.length === 0) {
    return false;
  }

  const roomObserve = this.getRoomNameToObserve();
  const returnCode = observers[0].observeRoom(roomObserve);
  this.debugLog('observer', `${observers[0]} observing ${roomObserve}`);
  if (returnCode !== OK) {
    this.log('observer returnCode: ' + returnCode + ' ' + roomObserve);
  }
  return true;
};

Room.prototype.handleScout = function() {
  if (!this.executeEveryTicks(config.room.scoutInterval)) {
    return false;
  }
  if (!config.room.scout) {
    return false;
  }
  const observers = this.findObservers();
  if (observers.length > 0) {
    return false;
  }
  this.checkRoleToSpawn('scout');
  return true;
};

Room.prototype.getHarvesterAmount = function() {
  if (!this.storage) {
    return 2;
  }
  if (!this.storage.my) {
    return 10;
  }
  if (this.controller.level < 5 && this.storage.store.energy < config.creep.energyFromStorageThreshold) {
    return 3;
  }
  return 1;
};

Room.prototype.handleAttackTimerWithoutHostiles = function() {
  this.memory.attackTimer = Math.max(this.memory.attackTimer - 5, 0);
  // Make sure we don't spawn towerFiller on reducing again
  if (this.memory.attackTimer % 5 === 0) {
    this.memory.attackTimer--;
  }
  if (this.memory.attackTimer <= 0) {
    this.memory.underSiege = false;
  }
};

Room.prototype.handleAttackTimer = function(hostiles) {
  this.memory.attackTimer = this.memory.attackTimer || 0;
  if (hostiles.length === 0) {
    return this.handleAttackTimerWithoutHostiles();
  }
  if (this.memory.attackTimer > 40) {
    if (Game.time % 5 === 0) {
      this.log(`Under attack: hostiles: ${hostiles.length} attackTimer: ${this.memory.attackTimer}`);
    }
  }
  this.memory.attackTimer++;
};

Room.prototype.checkForSafeMode = function() {
  if (this.memory.attackTimer > 100) {
    // TODO better metric for SafeMode
    const enemies = this.findOtherPlayerCreeps();
    if (enemies > 0) {
      this.controller.activateSafeMode();
    }
  }
};

Room.prototype.spawnTowerFiller = function() {
  if (this.memory.attackTimer < 50 || this.controller.level < 6) {
    return false;
  }
  const towers = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_TOWER]);
  if (towers.length === 0) {
    this.memory.attackTimer = 47;
    return false;
  }

  if (this.memory.attackTimer !== 50 || this.memory.position.creep.towerFiller) {
    return false;
  }

  for (const towerFillerPos of this.memory.position.creep.towerFiller) {
    this.log('Spawning towerfiller: ' + this.memory.attackTimer);
    this.memory.queue.push({
      role: 'towerfiller',
      target_id: towerFillerPos,
    });
  }
};

Room.prototype.spawnDefender = function() {
  if (this.memory.attackTimer > 15) {
    if (this.executeEveryTicks(250)) {
      const role = this.memory.attackTimer > 300 ? 'defendmelee' : 'defendranged';
      this.checkRoleToSpawn(role, 1, undefined, this.name, 1, this.name);
    }
  }
};

Room.prototype.handleDefence = function(hostiles) {
  if (hostiles.length === 0) {
    return;
  }

  this.spawnDefender();

  // TODO when another player attacks and there are invaeds `hostiles[0]` would
  // be the wrong check
  if (hostiles[0].owner.username !== 'Invader') {
    if (this.executeEveryTicks(10)) {
      this.debugLog('invader', 'Under attack from ' + hostiles[0].owner.username);
    }
    if (!brain.isFriend(hostiles[0].owner.username)) {
      Game.notify(this.name + ' Under attack from ' + hostiles[0].owner.username + ' at ' + Game.time);
    }
  }
};

Room.prototype.handleAttack = function(hostiles) {
  this.handleAttackTimer(hostiles);
  this.checkForSafeMode();
  this.spawnTowerFiller();
  this.handleDefence(hostiles);
};

Room.prototype.handleReviveRoomQueueCarry = function(myRoomName) {
  const room = Game.rooms[myRoomName];
  if (!room.isHealthy()) {
    return;
  }
  if (Game.map.getRoomLinearDistance(this.name, room.name) > 10) {
    return;
  }
  this.log(`---!!! ${room.name} send energy to ${this.name} !!!---`);
  room.checkRoleToSpawn('carry', config.carryHelpers.maxHelpersAmount, room.storage.id, room.name, undefined, this.name);
};

Room.prototype.handleReviveRoomSendCarry = function() {
  if (!this.executeEveryTicks(config.carryHelpers.ticksUntilHelpCheck)) {
    return false;
  }

  if (!this.isStruggeling()) {
    return false;
  }

  const myCreeps = this.findMyCreeps();
  if (myCreeps.length === 0) {
    return false;
  }

  for (const myRoomName of Memory.myRooms) {
    this.handleReviveRoomQueueCarry(myRoomName);
  }
  return true;
};

Room.prototype.handleReviveRoom = function(hostiles) {
  // Energy support
  this.handleReviveRoomSendCarry();

  // Revive
  const spawns = this.findMySpawns();
  if (spawns.length === 0) {
    return this.reviveRoom();
  }

  if (this.isRampingUp()) {
    if (hostiles.length > 0) {
      this.controller.activateSafeMode();
    }
    return this.reviveRoom();
  }
  this.memory.active = true;
};

Room.prototype.handleIdiot = function() {
  const idiotCreeps = this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Invader'], {inverse: true});
  if (idiotCreeps.length > 0) {
    for (const idiotCreep of idiotCreeps) {
      brain.increaseIdiot(idiotCreep.owner.username);
    }
  }
};

Room.prototype.getPlanerAmount = function(constructionSites) {
  let amount = 1;
  if (this.controller.level >= 4 && this.memory.misplacedSpawn) {
    amount = 3;
  }
  for (const cs of constructionSites) {
    if (cs.structureType === STRUCTURE_STORAGE) {
      amount = 6;
    }
  }
  return amount;
};

Room.prototype.checkForPlaner = function() {
  const constructionSites = this.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART], {inverse: true});
  if (constructionSites.length === 0) {
    if (this.memory.misplacedSpawn && this.storage && this.storage.store.energy > 20000 && this.energyAvailable >= this.energyCapacityAvailable - 300) {
      this.checkRoleToSpawn('planer', 4);
    }
    return;
  }

  const amount = this.getPlanerAmount(constructionSites);
  this.checkRoleToSpawn('planer', amount);
};

Room.prototype.isRoomReadyForExtractor = function() {
  if (CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][this.controller.level] === 0) {
    return false;
  }
  if (!this.terminal) {
    return false;
  }
  const extractors = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_EXTRACTOR]);
  if (extractors.length === 0) {
    return false;
  }
  return true;
};

Room.prototype.checkForExtractor = function() {
  if (!this.isRoomReadyForExtractor()) {
    return false;
  }

  const minerals = this.findMinerals();
  if (minerals.length > 0 && minerals[0].mineralAmount > 0) {
    const amount = this.terminal.store[minerals[0].mineralType] || 0;
    if (amount < config.mineral.storage) {
      this.checkRoleToSpawn('extractor');
    }
  }
};

Room.prototype.isRoomReadyForMineralHandling = function() {
  if (!config.mineral.enabled) {
    return false;
  }
  if (!this.terminal) {
    return false;
  }
  if (!this.storage) {
    return false;
  }
  return true;
};

Room.prototype.checkForMiner = function() {
  if (!this.isRoomReadyForMineralHandling()) {
    return false;
  }

  const labs = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_LAB]);
  if ((!this.memory.cleanup || this.memory.cleanup <= 10) && (_.size(labs) > 2)) {
    this.checkRoleToSpawn('mineral');
  }
  if ((Game.time + this.controller.pos.x + this.controller.pos.y) % 10000 < 10) {
    this.memory.cleanup = 0;
  }
};

Room.prototype.handleEconomyStructures = function() {
  this.handleLinks();
  this.handleObserver();
  this.handlePowerSpawn();
  this.handleTerminal();
};

Room.prototype.isRampingUp = function() {
  if (this.memory.misplacedSpawn) {
    return true;
  }
  if (this.energyCapacityAvailable < config.room.reviveEnergyCapacity) {
    return true;
  }
  if (!this.storage) {
    return true;
  }
  if (!this.storage.my) {
    return true;
  }
  return false;
};

Room.prototype.isStruggeling = function() {
  if (this.isRampingUp()) {
    return true;
  }
  if (!this.memory.active) {
    return true;
  }
  // TODO rename the `config.creep` variable - check usage first
  if (this.storage.store.energy < config.creep.energyFromStorageThreshold) {
    return true;
  }
  return false;
};

Room.prototype.isHealthy = function() {
  if (this.isStruggeling()) {
    return false;
  }
  // TODO extract as config variable
  if (this.storage.store.energy < config.room.isHealthyStorageThreshold) {
    return false;
  }
  return true;
};

Room.prototype.executeRoom = function() {
  const cpuUsed = Game.cpu.getUsed();
  this.buildBase();
  this.memory.constants = this.memory.constants || {};
  const hostiles = this.findHostileAttackingCreeps();
  this.handleAttack(hostiles);
  this.handleReviveRoom(hostiles);

  const amount = this.getHarvesterAmount();
  this.checkRoleToSpawn('harvester', amount);

  this.handleIdiot();
  this.checkAndSpawnSourcer();

  if (this.controller.level >= 4 && this.storage && this.storage.my) {
    this.checkRoleToSpawn('storagefiller', 1, 'filler');
  }
  if (this.storage && this.storage.my && this.storage.store.energy > config.room.upgraderMinStorage && !this.memory.misplacedSpawn) {
    this.checkRoleToSpawn('upgrader', 1, this.controller.id);
  }

  this.checkForPlaner();
  this.checkForExtractor();
  this.checkForMiner();
  this.handleScout();
  this.handleTower();
  if (this.controller.level > 1 && this.memory.walls && this.memory.walls.finished) {
    this.checkRoleToSpawn('repairer');
  }

  if (this.memory.setup && this.memory.setup.completed) {
    this.handleEconomyStructures();
    this.handleNukeAttack();
  }
  this.spawnCheckForCreate();
  this.handleMarket();
  brain.stats.addRoom(this.name, cpuUsed);
  return true;
};

const checkForRoute = function(room, roomOther) {
  const route = room.findRoute(roomOther.name, room.name);
  // TODO Instead of skipping we could try to free up the way: nextroomerattack or squad
  if (route.length === 0) {
    roomOther.log('No route to other room: ' + roomOther.name);
    return true;
  }
  return false;
};

Room.prototype.reviveMyNowHelperValid = function(helperRoom) {
  let valid = false;

  if (helperRoom.isStruggeling()) {
    this.debugLog('revive', `No nextroomer is struggeling ${helperRoom.name}`);
  } else if (this.controller.ticksToDowngrade > 1500 && !helperRoom.isHealthy()) {
    // When close before downgrading, just send nextroomers
    // TODO replace 1500 with CREEP_LIFE_TIME
    this.debugLog('revive', `No nextroomer not healthy ${helperRoom.name} ${helperRoom.storage.store.energy}`);
  } else if (Game.map.getRoomLinearDistance(this.name, helperRoom.name) > config.nextRoom.maxDistance) {
    this.debugLog('revive', `Too far ${helperRoom.name}`);
  } else if (checkForRoute(this, helperRoom)) {
    this.debugLog('revive', `No nextroomer checkForRoute no route to ${helperRoom.name}`);
  } else {
    valid = true;
  }

  return valid;
};

Room.prototype.reviveMyNow = function() {
  const myRooms = findMyRoomsSortByDistance(this.name);
  for (const helperRoomName of myRooms) {
    if (this.name === helperRoomName) {
      continue;
    }
    const helperRoom = Game.rooms[helperRoomName];
    if (!this.reviveMyNowHelperValid(helperRoom)) {
      continue;
    }

    const hostileCreep = this.findEnemys();
    if (hostileCreep.length > 0) {
      this.debugLog('revive', `Send defender from ${helperRoomName}`);
      helperRoom.checkRoleToSpawn('defender', 1, undefined, this.name);
    }
    helperRoom.checkRoleToSpawn('nextroomer', 1, undefined, this.name);
    this.debugLog('revive', `Send nextroomer from ${helperRoomName}`);
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
  if (!this.executeEveryTicks(config.revive.nextroomerInterval)) {
    return false;
  }

  if (this.memory.active) {
    this.setRoomInactive();
  }

  this.handleTower();
  this.handleTerminal();
  if (config.revive.disabled) {
    this.debugLog('revive', `Not reviving - config.revive.disabled`);
    return false;
  }

  if (this.controller.level === 1 && this.controller.ticksToDowngrade < 100) {
    this.debugLog('revive', `reviveRoom Will die, clearRoom`);
    this.clearRoom();
    return false;
  }

  this.reviveMyNow();
  return true;
};
