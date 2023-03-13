'use strict';

const {findMyRoomsSortByDistance} = require('./helper_findMyRooms');
const {addToReputation} = require('./diplomacy');
const {isFriend} = require('./brain_squadmanager');

/**
 * killCreeps
 *
 * @param {object} room
 */
function killCreeps(room) {
  const creepsToKill = _.filter(Game.creeps, (c) => c.memory.base === room.name);
  room.log('creepsToKill', _.size(creepsToKill), _.map(creepsToKill, (c) => c.suicide()));
}

/**
 * removeNextStructure
 *
 * @param {object} room
 * @return {number}
 */
function removeNextStructure(room) {
  let returnValue;
  const myStructuresToDestroy = _.sortBy(room.findMyStructures(), (s) => s.hitsMax);
  const controller = myStructuresToDestroy.shift();
  if (_.size(myStructuresToDestroy) > 0) {
    returnValue = myStructuresToDestroy[0].destroy();
  } else {
    returnValue = controller.unclaim();
    delete Memory.rooms[room.name];
  }
  room.log('removeNextStructure returns', returnValue,
    'next structure', myStructuresToDestroy[0],
    'total structures', _.size(myStructuresToDestroy),
    'controller', JSON.stringify(controller));
  return returnValue;
}

Room.prototype.unclaimRoom = function() {
  // remove creeps if base === this.name
  const room = this;
  killCreeps(room);
  // const sites = global.utils.removeConstructionSites(room); - This does not exist, but could make sense
  // if (sites < 2) {
  const returnValue = removeNextStructure(room);
  if (returnValue !== OK) {
    room.log('destroy / unclaim did not work');
  }
  // }
};

Room.prototype.myHandleRoom = function() {
  this.data.state = 'Controlled';
  if (!Memory.username) {
    Memory.username = this.controller.owner.username;
  }

  if (!this.memory.queue) {
    this.memory.queue = [];
  }

  this.memory.spawnIdle = this.memory.spawnIdle || 0;
  const spawnIdle = this.findMySpawns().reduce((previous, current) => {
    return previous || !current.spawning;
  }, false);
  this.memory.spawnIdle = (1-config.room.spawnIdleFactor) * this.memory.spawnIdle + config.room.spawnIdleFactor * (spawnIdle ? 1 : 0);

  const hostiles = this.findEnemies();
  if (hostiles.length === 0) {
    delete this.memory.hostile;
  } else {
    this.memory.hostile = {
      lastUpdate: Game.time,
      hostiles: hostiles,
    };
  }
  if (this.memory.unclaim) {
    return this.unclaimRoom();
  }
  return this.executeRoom();
};

Room.prototype.getLinkStorage = function() {
  if (!this.data.constants) {
    this.data.constants = {};
  }
  if (this.data.constants.linkStorage) {
    const link = Game.getObjectById(this.data.constants.linkStorage);
    if (link && link !== null) {
      return link;
    }
  }
  const linkPos = this.data.positions.structure.link[0];
  const linkPosObject = new RoomPosition(linkPos.x, linkPos.y, this.name);
  const structures = linkPosObject.lookFor(LOOK_STRUCTURES);
  for (const structure of structures) {
    if (structure.structureType === STRUCTURE_LINK) {
      this.data.constants.linkStorage = structure.id;
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
  if (this.isUnderAttack() && this.controller.level > 6) {
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
  // added executeEveryTicks 3 for movement of universal
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
  // This could be made a helper function for all handleSTRUCTURE methods
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

/**
 * determine how many universal to spawn
 *
 * @return {number}
 */
Room.prototype.getUniversalAmount = function() {
  if (!this.storage) {
    return 2;
  }
  if (!this.storage.my) {
    return 10;
  }
  if (this.controller.level < 5 && this.storage.isLow()) {
    return 3;
  }
  if (!this.data.mySpawns || this.executeEveryTicks(3000)) {
    this.data.mySpawns = this.findMySpawns();
  }
  if (this.controller.level >= 7 && !this.storage.isLow() && this.data.mySpawns.length > 1) {
    return 2;
  }
  return 1;
};

Room.prototype.handleAttackTimerWithoutHostiles = function() {
  this.memory.attackTimer = Math.max(this.memory.attackTimer - 5, 0);
  if (this.memory.attackTimer <= 0) {
    this.memory.underSiege = false;
  }
};

Room.prototype.handleAttackTimer = function(hostiles) {
  this.memory.attackTimer = this.memory.attackTimer || 0;
  if (hostiles.length === 0) {
    return this.handleAttackTimerWithoutHostiles();
  }
  if (this.isUnderAttack()) {
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

  // TODO when another player attacks and there are invades `hostiles[0]` would be the wrong check
  if (global.config.maliciousNpcUsernames.includes(hostiles[0].owner.username)) {
    if (this.executeEveryTicks(10)) {
      this.debugLog('invader', 'Under attack from ' + hostiles[0].owner.username);
    }
    if (!isFriend(hostiles[0].owner.username)) {
      Game.notify(this.name + ' Under attack from ' + hostiles[0].owner.username + ' at ' + Game.time);
    }
  }
};

Room.prototype.handleAttack = function(hostiles) {
  this.handleAttackTimer(hostiles);
  this.checkForSafeMode();
  this.handleDefence(hostiles);
};

Room.prototype.handleReviveRoomQueueCarry = function(myRoomName) {
  const room = Game.rooms[myRoomName];
  if (!room.isHealthy()) {
    return;
  }
  if (!room.hasSpawnCapacity()) {
    return;
  }
  if (Game.map.getRoomLinearDistance(this.name, room.name) > 10) {
    return;
  }
  this.log(`---!!! ${room.name} send energy to ${this.name} !!!---`);
  room.checkRoleToSpawn('carry', config.carryHelpers.maxHelpersAmount, room.storage.id, room.name, undefined, this.name);
};

Room.prototype.handleReviveRoomSendCarry = function() {
  this.debugLog('revive', `handleReviveRoomSendCarry`);
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
  if (!this.executeEveryTicks(config.carryHelpers.ticksUntilHelpCheck)) {
    return false;
  }

  if (!this.isStruggling()) {
    return false;
  }

  this.debugLog('revive', `handleReviveRoom`);
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

Room.prototype.handleReputation = function() {
  const hostileCreeps = this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', global.config.maliciousNpcUsernames, {inverse: true});
  if (hostileCreeps.length > 0) {
    for (const hostileCreep of hostileCreeps) {
      addToReputation(hostileCreep.owner.username, -1);
    }
  }
};

Room.prototype.getBuilderAmount = function(constructionSites) {
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

Room.prototype.checkForBuilder = function() {
  let constructionSites;
  if (this.isHealthy()) {
    constructionSites = this.findConstructionSitesStructures();
  } else {
    constructionSites = this.findConstructionSitesEssentialStructures();
  }
  if (constructionSites.length === 0) {
    if (this.memory.misplacedSpawn && this.storage && this.storage.store.energy > 20000 && this.energyAvailable >= this.energyCapacityAvailable - 300) {
      this.checkRoleToSpawn('builder', 4);
    }
    return;
  }

  const amount = this.getBuilderAmount(constructionSites);
  this.checkRoleToSpawn('builder', amount);
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
      const targetId = minerals[0].id;
      this.checkRoleToSpawn('extractor', 1, targetId, this.name);
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
  if (!this.isHealthy()) {
    return false;
  }
  return true;
};

Room.prototype.checkForMineral = function() {
  if (!this.isRoomReadyForMineralHandling()) {
    return false;
  }

  if (this.memory.reaction || (this.memory.boosts && Object.keys(this.memory.boosts).length)) {
    this.checkRoleToSpawn('mineral');
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

Room.prototype.isUnderAttack = function() {
  return this.memory.attackTimer > config.myRoom.underAttackMinAttackTimer;
};

Room.prototype.isStruggling = function() {
  if (this.isRampingUp()) {
    return true;
  }
  if (!this.memory.active) {
    return true;
  }
  if (this.storage.isLow()) {
    return true;
  }
  return false;
};

Room.prototype.hasSpawnCapacity = function(threshold) {
  if (this.memory.spawnIdle < (threshold || config.room.spawnIdle)) {
    // this.log(`Spawn is not idle ${this.memory.spawnIdle} < ${config.room.spawnIdle} (${new Error().stack})`);
    // this.log(`Spawn is not idle ${this.memory.spawnIdle} < ${config.room.spawnIdle}`);
    return false;
  }
  return true;
};

Room.prototype.isHealthy = function() {
  if (this.isStruggling()) {
    return false;
  }
  if (this.storage.store.energy < config.room.isHealthyStorageThreshold) {
    return false;
  }
  return true;
};

Room.prototype.isConstructingSpawnEmergency = function() {
  if (!this.controller || !this.controller.my || !config.useConstructingSpawnEmergencyOperations.enabled) {
    return false;
  }
  if ([true, false].includes(this.data.isConstructingSpawn)) {
    return this.data.isConstructingSpawn;
  }
  this.data.isConstructingSpawn = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN], {}).length === 0;
  return this.data.isConstructingSpawn;
};

Room.prototype.executeRoomHandleHostiles = function() {
  const hostiles = this.findHostileAttackingCreeps();
  this.handleAttack(hostiles);
  this.handleReviveRoom(hostiles);
  this.handleReputation();
};

Room.prototype.executeRoomCheckBasicCreeps = function() {
  const amount = this.getUniversalAmount();
  this.checkRoleToSpawn('universal', amount);
  this.checkAndSpawnSourcer();

  if (this.controller.level >= 4 && this.storage && this.storage.my) {
    this.checkRoleToSpawn('storagefiller', 1, 'filler');
  }
  if (this.storage && this.storage.my && this.storage.store.energy > config.room.upgraderMinStorage && !this.memory.misplacedSpawn) {
    this.checkRoleToSpawn('upgrader', 1, this.controller.id);
  }
};

Room.prototype.executeRoom = function() {
  const cpuUsed = Game.cpu.getUsed();
  this.memory.constants = this.memory.constants || {};
  this.buildBase();
  this.executeRoomHandleHostiles();
  this.executeRoomCheckBasicCreeps();
  this.checkForBuilder();
  this.checkForExtractor();
  this.checkForMineral();
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
  // TODO Instead of skipping we could try to free up the way: attack with nextroomer or squad
  if (route.length === 0) {
    roomOther.log('No route to other room: ' + roomOther.name);
    return true;
  }
  return false;
};

Room.prototype.reviveMyNowHelperValid = function(helperRoom) {
  if (helperRoom.isStruggling()) {
    this.debugLog('revive', `No nextroomer is Struggling ${helperRoom.name}`);
    return false;
  }
  if (!helperRoom.hasSpawnCapacity(config.room.nextroomerSpawnIdleThreshold)) {
    this.debugLog('revive', `helper no spawnCapacity ${helperRoom.memory.spawnIdle}`);
    return false;
  }
  if (this.controller.ticksToDowngrade > CREEP_LIFE_TIME && !helperRoom.isHealthy()) {
    this.debugLog('revive', `No nextroomer not healthy ${helperRoom.name} ${helperRoom.storage.store.energy}`);
    return false;
  }
  if (Game.map.getRoomLinearDistance(this.name, helperRoom.name) > config.nextRoom.maxDistance) {
    this.debugLog('revive', `Too far ${helperRoom.name}`);
    return false;
  }
  if (checkForRoute(this, helperRoom)) {
    this.debugLog('revive', `No nextroomer checkForRoute no route to ${helperRoom.name}`);
    return false;
  }

  return true;
};

Room.prototype.reviveMyNow = function() {
  const myRooms = findMyRoomsSortByDistance(this.name);
  for (const helperRoomName of myRooms) {
    if (this.name === helperRoomName) {
      continue;
    }
    const helperRoom = Game.rooms[helperRoomName];
    if (!this.reviveMyNowHelperValid(helperRoom)) {
      this.debugLog('revive', `helper not valid ${helperRoomName}`);
      continue;
    }

    const hostileCreep = this.findEnemies();
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
  let reputationChange = 3000000;
  try {
    tokens = Game.market.getAllOrders({
      type: ORDER_SELL,
      resourceType: CPU_UNLOCK,
    });
  } catch (e) {
    this.log(`No CPU_UNLOCK for sale adding value of ${reputationChange}`);
    tokens = [{
      price: reputationChange, // change this value to whatever you feel appropriate enough
    }];
  }
  if (tokens.length > 0) {
    tokens.sort((a, b) => b.price - a.price);
    reputationChange = Math.min(-1 * reputationChange, -1 * Math.abs(tokens[0].price));
  }
  const hostileCreeps = this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', global.config.maliciousNpcUsernames, {inverse: true});
  if (hostileCreeps.length > 0) {
    for (const hostileCreep of hostileCreeps) {
      this.log(`Add to reputation by CPU_UNLOCK (${reputationChange}) for ${hostileCreep.owner.username}`);
      addToReputation(hostileCreep.owner.username, reputationChange);
    }
  }
  this.memory.active = false;
};

Room.prototype.reviveRoom = function() {
  if (!this.executeEveryTicks(config.revive.nextroomerInterval)) {
    return false;
  }
  this.debugLog('revive', `reviveRoom`);
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
