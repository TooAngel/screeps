'use strict';

Creep.pickableResources = function(creep) {
  return (object) => creep.pos.isNearTo(object);
};

Creep.prototype.harvesterBeforeStorage = function() {
  this.creepLog(`harvesterBeforeStorage`);
  const methods = [];

  methods.push(Creep.getEnergy);

  if (this.room.controller && (this.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[this.room.controller.level] / 10 || this.room.controller.level === 1)) {
    methods.push(Creep.upgradeControllerTask);
  }
  const harvesters = this.room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['harvester']).map((creep) => creep.name);
  harvesters.sort();
  if (harvesters.indexOf(this.name) < 2) {
    methods.push(Creep.transferEnergy);
  }

  const structures = this.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_CONTROLLER], {inverse: true});
  if (structures.length > 0) {
    methods.push(Creep.constructTask);
  }

  if (this.room.controller && this.room.controller.level < 9) {
    methods.push(Creep.upgradeControllerTask);
  } else {
    methods.push(Creep.repairStructure);
  }
  // this.say('startup', true);
  Creep.execute(this, methods);
  return true;
};

Creep.prototype.checkCarryEnergyForBringingBackToStorage = function(otherCreep) {
  let offset = 0;
  if (otherCreep) {
    offset = otherCreep.carry.energy;
  }

  // define minimum carryPercentage to move back to storage
  let carryPercentage = config.carry.carryPercentageHighway;
  if (this.room.name === this.memory.routing.targetRoom) {
    carryPercentage = config.carry.carryPercentageExtern;
  }
  if (this.inBase()) {
    carryPercentage = config.carry.carryPercentageBase;
  }

  return offset + _.sum(this.carry) > carryPercentage * this.carryCapacity;
};

// return true if helper can't transfer to creep
Creep.prototype.checkHelperNoTransfer = function(creep) {
  return creep.memory.base !== this.memory.base;
};

Creep.prototype.findCreepWhichCanTransfer = function(creeps) {
  for (let i = 0; i < creeps.length; i++) {
    const otherCreep = creeps[i];
    if (!Game.creeps[otherCreep.name] || otherCreep.carry.energy < 50 || otherCreep.memory.recycle) {
      continue;
    }

    if (otherCreep.memory.role === 'carry') {
      if (otherCreep.checkHelperNoTransfer(this)) {
        continue;
      }
      if (otherCreep.memory.routing.pathPos < 0) {
        continue;
      }
      return this.checkCarryEnergyForBringingBackToStorage(otherCreep);
    }
    continue;
  }
  return false;
};

Creep.prototype.checkForTransfer = function(direction) {
  if (!direction) {
    this.creepLog(`checkForTransfer no direction}`);
    return false;
  }

  const adjacentPos = this.pos.getAdjacentPosition(direction);

  if (adjacentPos.isBorder(-2)) {
    this.creepLog(`checkForTransfer isBorder}`);
    return false;
  }

  const creeps = adjacentPos.lookFor(LOOK_CREEPS);
  return this.findCreepWhichCanTransfer(creeps);
};

Creep.prototype.pickupWhileMoving = function() {
  if (this.inBase() && this.memory.routing.pathPos < 2) {
    return false;
  }

  if (_.sum(this.carry) === this.carryCapacity) {
    return false;
  }

  const resources = this.room.find(FIND_DROPPED_RESOURCES, {
    filter: Creep.pickableResources(this),
  });

  if (resources.length > 0) {
    const resource = resources[0];
    const amount = this.pickupOrWithdrawFromSourcer(resource);
    return _.sum(this.carry) + amount > 0.5 * this.carryCapacity;
  }

  if (this.room.name === this.memory.routing.targetRoom) {
    const containers = this.pos.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_CONTAINER, STRUCTURE_STORAGE]);
    for (const container of containers) {
      // To avoid carry withdrawing energy from base storage
      if (container.structureType === STRUCTURE_STORAGE && container.id !== this.memory.routing.targetId) {
        continue;
      }
      if (container.store[RESOURCE_ENERGY]) {
        this.withdraw(container, RESOURCE_ENERGY);
        return container.store[RESOURCE_ENERGY] > 9;
      }
    }
  }
  return false;
};

Creep.prototype.handleExtractor = function() {
  if (!this.room.terminal) {
    this.suicide();
    return true;
  }
  const carrying = _.sum(this.carry);
  if (carrying === this.carryCapacity) {
    this.moveToMy(this.room.terminal.pos, 1);
    for (const key in this.carry) {
      if (this.carry[key] === 0) {
        continue;
      }
      this.transfer(this.room.terminal, key);
      return true;
    }
  }

  const minerals = this.room.findMinerals();
  if (minerals.length > 0) {
    const posMem = this.room.memory.position.creep[minerals[0].id][0];
    // TODO this could be moved to `creep.moveToMy`, just need to unify the parameter
    if (this.pos.x !== posMem.x || this.pos.y !== posMem.y) {
      const pos = new RoomPosition(posMem.x, posMem.y, posMem.roomName);
      this.moveToMy(pos, 0);
    }
    this.harvest(minerals[0]);
  }
  return true;
};

Creep.prototype.sayIdiotList = function() {
  const say = function(creep) {
    const players = _.filter(Memory.players, (object) => {
      return object.idiot && object.idiot > 0;
    });
    if (players.length === 0) {
      return;
    }
    const sentence = ['Don\'t', 'like'];
    for (const player of players) {
      sentence.push(player.name);
      sentence.push(player.idiot);
    }
    const word = Game.time % sentence.length;
    creep.say(sentence[word], true);
  };
  say(this);
};

Creep.prototype.upgraderUpdateStats = function() {
  if (!this.room.memory.upgraderUpgrade) {
    this.room.memory.upgraderUpgrade = 0;
  }
  let workParts = 0;
  for (const partI in this.body) {
    if (this.body[partI].type === 'work') {
      workParts++;
    }
  }
  this.room.memory.upgraderUpgrade += Math.min(workParts, this.carry.energy);
};

Creep.prototype.handleUpgrader = function() {
  // this.sayIdiotList();
  this.spawnReplacement(1);
  if (this.room.memory.attackTimer > 50 && this.room.controller.level > 6) {
    if (this.room.controller.ticksToDowngrade > 10000) {
      return true;
    }
  }
  if (this.room.controller.ticksToDowngrade > (CONTROLLER_DOWNGRADE[this.room.controller.level] * config.nextRoom.minDowngradPercent / 100) &&
    this.room.storage.store.energy < config.creep.energyFromStorageThreshold &&
    Game.time % 1000 !== 0) {
    this.creepLog('Skipping controller upgrade, not enough in storage');
    return true;
  }

  let returnCode = this.upgradeController(this.room.controller);
  if (returnCode === OK) {
    this.upgraderUpdateStats();
  }

  returnCode = this.withdraw(this.room.storage, RESOURCE_ENERGY);
  if (returnCode === ERR_FULL || returnCode === OK) {
    return true;
  }
  return true;
};

Creep.prototype.buildContainerConstructionSite = function() {
  const returnCode = this.pos.createConstructionSite(STRUCTURE_CONTAINER);
  if (returnCode === OK) {
    this.creepLog('Create cs for container');
    return true;
  }
  if (returnCode === ERR_INVALID_TARGET) {
    const constructionSites = this.pos.findInRange(FIND_CONSTRUCTION_SITES, 0);
    for (const constructionSite of constructionSites) {
      constructionSite.remove();
    }
    return false;
  }
  if (returnCode !== ERR_FULL) {
    this.log('Container: ' + returnCode + ' pos: ' + this.pos);
  }
  return false;
};

Creep.prototype.buildContainerExecute = function() {
  if (this.carry.energy < 50) {
    return false;
  }

  const constructionSites = this.pos.findInRangeStructures(FIND_CONSTRUCTION_SITES, 0, [STRUCTURE_CONTAINER]);
  if (constructionSites.length > 0) {
    const returnCode = this.build(constructionSites[0]);
    if (returnCode !== OK) {
      this.log('buildContainerExecute build: ' + returnCode);
    }
    return true;
  }

  return this.buildContainerConstructionSite();
};

Creep.prototype.buildContainer = function() {
  if (this.inBase()) {
    return false;
  }
  // TODO Not in base room
  const objects = this.pos.findInRangeStructures(FIND_STRUCTURES, 0, [STRUCTURE_CONTAINER]);
  if (objects.length === 0) {
    return this.buildContainerExecute();
  }
  const object = objects[0];
  if (object.hits < object.hitsMax) {
    this.repair(object);
  }
};

Creep.prototype.withdrawEnergyFromTarget = function(target) {
  let returnValue = false;
  const returnCode = this.withdraw(target, RESOURCE_ENERGY);
  if (returnCode === OK) {
    returnValue = true;
  }
  return returnValue;
};

Creep.prototype.withdrawResourcesFromTarget = function(target) {
  let returnValue = false;
  const resosurces = Object.keys(target.store) || Object.keys(target.carry);
  for (const resosurce of resosurces) {
    if (!returnValue) {
      returnValue = this.withdraw(target, resosurce) === OK;
    }
  }
  return returnValue;
};

Creep.prototype.withdrawResourcesFromTargets = function(targets, onlyEnergy) {
  let returnValue = false;
  for (const target of targets) {
    if (!returnValue) {
      returnValue = onlyEnergy ? this.withdrawEnergyFromTarget(target) : this.withdrawResourcesFromTarget(target);
    }
  }
  return returnValue;
};

Creep.prototype.withdrawTombstone = function(onlyEnergy) {
  onlyEnergy = onlyEnergy || false;
  let returnValue = false;
  // FIND_TOMBSTONES and get them empty first
  const tombstones = this.pos.findInRange(FIND_TOMBSTONES, 1);
  if (tombstones.length > 0) {
    if (onlyEnergy) {
      returnValue = this.withdrawResourcesFromTargets(tombstones, true);
    } else {
      returnValue = this.withdrawResourcesFromTargets(tombstones);
    }
  }
  return returnValue;
};

Creep.prototype.withdrawContainers = function() {
  let returnValue = false;
  const containers = this.pos.findInRangeStructures(FIND_STRUCTURES, 1, [STRUCTURE_CONTAINER]);
  if (containers.length > 0) {
    const returnCode = this.withdraw(containers[0], RESOURCE_ENERGY);
    if (returnCode === OK) {
      returnValue = true;
    }
  }
  return returnValue;
};

Creep.prototype.giveSourcersEnergy = function() {
  let returnValue = false;
  const sourcers = this.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 1, 'memory.role', ['sourcer']);
  if (sourcers.length > 0) {
    const returnCode = sourcers[0].transfer(this, RESOURCE_ENERGY);
    if (returnCode === OK) {
      returnValue = true;
    }
  }
  return returnValue;
};

Creep.prototype.pickupEnergy = function() {
  const resources = this.room.findPropertyFilter(FIND_DROPPED_RESOURCES, 'resourceType', [RESOURCE_ENERGY], {
    filter: Creep.pickableResources(this),
  });
  if (resources.length > 0) {
    const resource = resources[0];
    const returnCode = this.pickup(resource);
    if (returnCode === OK) {
      if (resource.amount >= this.store.getFreeCapacity()) {
        return true;
      }
    }
  }
  if (this.withdrawContainers()) {
    return true;
  }

  if (this.withdrawTombstone()) {
    return true;
  }

  return this.giveSourcersEnergy();
};

const checkCreepForTransfer = function(creep) {
  if (!Game.creeps[creep.name]) {
    return false;
  }
  // don't transfer to extractor, fixes full terminal with 80% energy?
  if (Game.creeps[creep.name].memory.role === 'extractor') {
    return false;
  }
  // don't transfer to mineral, fixes full terminal with 80% energy?
  if (Game.creeps[creep.name].memory.role === 'mineral') {
    return false;
  }
  // Do we want this?
  if (Game.creeps[creep.name].memory.role === 'powertransporter') {
    return false;
  }
  // can not carry
  if (creep.carry.energy === creep.carryCapacity) {
    return false;
  }
  return true;
};

Creep.prototype.transferToCreep = function(direction) {
  const adjacentPos = this.pos.getAdjacentPosition(direction);
  if (!adjacentPos.isValid()) {
    return false;
  }

  const creeps = adjacentPos.lookFor('creep');
  for (let i = 0; i < creeps.length; i++) {
    const otherCreep = creeps[i];
    if (!checkCreepForTransfer(otherCreep) || this.checkHelperNoTransfer(otherCreep)) {
      continue;
    }
    const returnCode = this.transfer(otherCreep, RESOURCE_ENERGY);
    if (returnCode === OK) {
      return this.carry.energy * 0.5 <= otherCreep.carryCapacity - otherCreep.carry.energy;
    }
  }
  return false;
};

const canStoreEnergy = function(object) {
  const structureTypes = [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_OBSERVER];
  if (structureTypes.indexOf(object.structureType) >= 0) {
    return false;
  }
  return true;
};

const energyAcceptingLink = function(object, room) {
  if (object.structureType === STRUCTURE_LINK) {
    for (let i = 0; i < 3; i++) {
      if (object.pos.isEqualTo(room.memory.position.structure.link[i].x, room.memory.position.structure.link[i].y)) {
        return false;
      }
    }
  }
  return true;
};

const terminalAvailable = function(object) {
  if (object.structureType === STRUCTURE_TERMINAL && (object.store.energy || 0) > config.terminal.maxEnergyAmount) {
    return false;
  }
  return true;
};

const harvesterTarget = function(creep, object) {
  if (creep.memory.role === 'harvester') {
    if (object.structureType === STRUCTURE_STORAGE || object.structureType === STRUCTURE_LINK) {
      return false;
    }
  }
  return true;
};

const filterTransferrables = function(creep, object) {
  if (!canStoreEnergy(object)) {
    return false;
  }

  if (!energyAcceptingLink(object, creep.room)) {
    return false;
  }

  if (!terminalAvailable(object)) {
    return false;
  }

  if (!harvesterTarget(creep, object)) {
    return false;
  }

  if (object.structureType === STRUCTURE_STORAGE ?
    _.sum(object.store) + _.sum(creep.carry) > object.storeCapacity :
    object.energy === object.energyCapacity) {
    return false;
  }

  return true;
};

Creep.prototype.transferAllResources = function(structure) {
  let transferred = false;
  for (const resource in this.carry) {
    if (!resource) {
      continue;
    }
    const returnCode = this.transfer(structure, resource);
    if (returnCode === OK) {
      let transferableEnergy = structure.energyCapacity - structure.energy;
      if (structure.structureType === STRUCTURE_STORAGE) {
        transferableEnergy = structure.storeCapacity - _.sum(structure.store);
      }
      transferred = Math.min(this.carry[resource], transferableEnergy);
    }
  }
  return transferred;
};

Creep.prototype.transferToStructures = function() {
  if (_.sum(this.carry) === 0) {
    return false;
  }

  let transferred = false;
  const look = this.room.lookForAtArea(
    LOOK_STRUCTURES,
    Math.max(1, Math.min(48, this.pos.y - 1)),
    Math.max(1, Math.min(48, this.pos.x - 1)),
    Math.max(1, Math.min(48, this.pos.y + 1)),
    Math.max(1, Math.min(48, this.pos.x + 1)),
    true);
  for (const item of look) {
    if (filterTransferrables(this, item.structure)) {
      if (transferred) {
        return {
          moreStructures: true,
          // TODO handle different type of resources on the structure side
          transferred: transferred,
        };
      }
      transferred = this.transferAllResources(item.structure);
    }
  }
  if (transferred) {
    return {
      moreStructures: false,
      transferred: transferred,
    };
  }
  return false;
};

Creep.prototype.getEnergyFromSourcer = function() {
  const sourcers = this.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 1, 'memory.role', ['sourcer'], {
    filter: (creep) => creep.carry.energy > 0,
  });
  if (sourcers.length > 0) {
    const returnCode = sourcers[0].transfer(this, RESOURCE_ENERGY);
    this.say('rr:' + returnCode);
    if (returnCode === OK) {
      return true;
    }
  }
  return false;
};

Creep.prototype.moveToSource = function(source, swarm = false) {
  this.memory.routing.reverse = false;
  if (swarm && this.pos.inRangeTo(source, 3)) {
    this.moveToMy(source.pos);
  } else if (this.room.memory.misplacedSpawn || (this.room.controller && this.room.controller.level < 2)) {
    this.moveToMy(source.pos);
  } else {
    const route = [{'name': this.room.name}];
    const routePos = 0;
    const start = 'pathStart';
    const target = source.id;
    const path = this.room.getPath(route, routePos, start, target);
    this.memory.routing.pathPos = this.getPathPos(path);
    const directions = this.getDirections(path);
    this.moveByPathMy(path, this.memory.routing.pathPos, directions);
  }
  return true;
};

Creep.prototype.harvestSource = function(source) {
  this.harvest(source);
  if (this.carry.energy === this.carryCapacity && this.carryCapacity > 0) {
    const creepsWithoutEnergy = this.pos.findInRangePropertyFilter(FIND_MY_CREEPS, 1, 'carry.energy', [0]);
    if (creepsWithoutEnergy.length > 0) {
      this.transfer(creepsWithoutEnergy[0], RESOURCE_ENERGY);
    }
  }

  // TODO Somehow we move before preMove, canceling here
  this.cancelOrder('move');
  this.cancelOrder('moveTo');
  return true;
};

Creep.prototype.getSourceToHarvest = function(swarmSourcesFilter) {
  let source;
  if (this.memory.source) {
    source = Game.getObjectById(this.memory.source);
    if (source === null || source.energy === 0) {
      source = this.pos.getClosestSource(swarmSourcesFilter);
    }
  } else {
    source = this.pos.getClosestSource(swarmSourcesFilter);
  }
  return source;
};

Creep.prototype.getEnergyFromSource = function() {
  let swarm = false;
  let swarmSourcesFilter;
  if (config.swarmSourceHarvestingMaxParts < this.body.filter((b) => b.type === WORK).length) {
    swarm = true;
    swarmSourcesFilter = (source) => source.pos.hasNonObstacleAdjacentPosition() || this.pos.isNearTo(source);
  }
  const source = this.getSourceToHarvest(swarmSourcesFilter);

  this.memory.source = source.id;
  const range = this.pos.getRangeTo(source);
  if (this.carry.energy > 0 && range > 1) {
    this.memory.hasEnergy = true; // Stop looking and spend the energy.
    return false;
  }

  if (range <= 2 && this.getEnergyFromSourcer()) {
    return true;
  }

  if (range === 1) {
    return this.harvestSource(source);
  } else {
    if (range > 1 && range < 4) {
      // TODO avoid exits here
      this.moveTo(source);
      return true;
    }
    this.creepLog(`getEnergy.moveToSource`);
    return this.moveToSource(source, swarm);
  }
};

Creep.prototype.setHasEnergy = function() {
  if (this.memory.hasEnergy === undefined) {
    this.memory.hasEnergy = (this.carry.energy === this.carryCapacity);
  } else if (this.memory.hasEnergy && this.carry.energy === 0) {
    this.memory.hasEnergy = false;
  } else if (!this.memory.hasEnergy &&
    _.sum(this.carry) === this.carryCapacity) {
    this.memory.hasEnergy = true;
  }
};

Creep.prototype.getDroppedEnergy = function() {
  const target = this.pos.findClosestByRangePropertyFilter(FIND_DROPPED_RESOURCES, 'resourceType', [RESOURCE_ENERGY], {
    filter: (object) => object.amount > 0,
  });
  if (target === null) {
    return false;
  }
  const energyRange = this.pos.getRangeTo(target.pos);
  if (energyRange <= 1) {
    this.pickupOrWithdrawFromSourcer(target);
    return true;
  }
  if (target.energy > (energyRange * 15) * (this.carry.energy + 1)) {
    this.say('dropped');
    this.moveToMy(target.pos, 1);
    return true;
  }
  return false;
};

Creep.prototype.getEnergy = function() {
  /* State machine:
   * No energy, goes to collect energy until full.
   * Full energy, uses energy until empty.
   */
  this.pickupEnergy();
  this.setHasEnergy();

  if (this.memory.hasEnergy) {
    return false;
  }
  if (this.getDroppedEnergy()) {
    this.creepLog(`getEnergy.getDroppedEnergy`);
    return true;
  }
  if (this.getEnergyFromStorage()) {
    this.creepLog(`getEnergy.getEnergyFromStorage`);
    return true;
  }
  if (this.getEnergyFromHostileStructures()) {
    this.creepLog(`getEnergy.getEnergyFromHostileStructures`);
    return true;
  }

  this.creepLog(`getEnergy.getEnergyFromSource`);
  return this.getEnergyFromSource();
};

Creep.prototype.buildConstructionSite = function(target) {
  const returnCode = this.build(target);
  if (returnCode === OK) {
    this.moveRandomWithin(target.pos);
    return true;
  } else if (returnCode === ERR_NOT_ENOUGH_RESOURCES) {
    return true;
  } else if (returnCode === ERR_INVALID_TARGET) {
    this.moveRandom();
    target.pos.clearPosition(target);
    return true;
  }
  this.log(`creep_resources.buildConstructionSite build returnCode: ${returnCode} target: ${JSON.stringify(target)}`);
  return false;
};

Creep.prototype.moveToAndBuildConstructionSite = function(target) {
  this.creepLog('moveToAndBuildConstructionSite');
  const range = this.pos.getRangeTo(target);
  if (range <= 3) {
    return this.buildConstructionSite(target);
  }

  // TODO is this necessary here? Maybe because of the planer
  this.memory.routing.targetId = target.id;
  this.moveToMy(target.pos, 3);
  return true;
};

Creep.prototype.construct = function() {
  let target;
  if (this.memory.routing.targetId) {
    target = Game.getObjectById(this.memory.routing.targetId);
    this.creepLog('Use memory target', target);
  }
  if (!target || target === null) {
    delete this.memory.routing.targetId;
    if (this.memory.role === 'nextroomer') {
      target = this.pos.findClosestByRangePropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART], {inverse: true});
    } else if (this.memory.role === 'harvester') {
      target = this.pos.findClosestByRangePropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_WALL], {inverse: true});
    } else {
      target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    }
  }

  if (target === null) {
    return false;
  }

  return this.moveToAndBuildConstructionSite(target);
};

Creep.prototype.getTransferTargetStructure = function() {
  let structure = this.pos.findClosestStructureWithMissingEnergyByRange(
    (object) => object.structureType !== STRUCTURE_STORAGE,
  );
  // Harvester should always prefer Spawn and Extensions
  if (this.memory.role === 'harvester') {
    const structureSpawnExtension = this.pos.findClosestStructureWithMissingEnergyByRange(
      (object) => (object.structureType === STRUCTURE_SPAWN || object.structureType === STRUCTURE_EXTENSION),
    );
    if (structureSpawnExtension !== null) {
      structure = structureSpawnExtension;
    }
  }
  if (structure === null) {
    if (this.room.storage && this.room.storage.my && this.memory.role !== 'planer') {
      this.memory.target = this.room.storage.id;
    } else {
      return false;
    }
  } else {
    this.memory.targetEnergyMy = structure.id;
  }
};

Creep.prototype.getTransferTarget = function() {
  if (!this.memory.targetEnergyMy) {
    this.getTransferTargetStructure();
    if (!this.memory.targetEnergyMy) {
      return false;
    }
  }

  const target = Game.getObjectById(this.memory.targetEnergyMy);
  if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    delete this.memory.targetEnergyMy;
    return false;
  }
  return target;
};

Creep.prototype.transferEnergy = function() {
  const target = this.getTransferTarget();
  if (!target) {
    return false;
  }
  const range = this.pos.getRangeTo(target);
  if (range === 1) {
    const returnCode = this.transfer(target, RESOURCE_ENERGY);
    if (returnCode !== OK && returnCode !== ERR_FULL) {
      this.log('transferEnergy: ' + returnCode + ' ' +
        target.structureType + ' ' + target.pos);
    }
    delete this.memory.targetEnergyMy;
  } else {
    this.moveToMy(target.pos, 1);
  }
  return true;
};

Creep.prototype.reserverSetLevel = function() {
  this.memory.level = 2;
  const baseRoom = Game.rooms[this.memory.base];
  if (baseRoom.getEnergyCapacityAvailable() < 2 * (BODYPART_COST.claim + BODYPART_COST.move) || (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd > 4500)) {
    this.memory.level = 1;
  }
  if (baseRoom.getEnergyCapacityAvailable() >= 5 * (BODYPART_COST.claim + BODYPART_COST.move) || (!this.room.controller.my && this.room.controller.reservation && this.room.controller.reservation.username !== Memory.username)) {
    this.memory.level = 5;
  }
};

const callStructurer = function(creep) {
  const structurers = creep.room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['structurer']);
  if (structurers.length > 0) {
    return false;
  }
  const resourceStructures = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_CONTAINER], {inverse: true});
  if (resourceStructures.length > 0 && !creep.room.controller.my) {
    creep.log('Call structurer from ' + creep.memory.base + ' because of ' + resourceStructures[0].structureType);
    Game.rooms[creep.memory.base].checkRoleToSpawn('structurer', 1, undefined, creep.room.name);
    return true;
  }
};

const callCleaner = function(creep) {
  if (creep.inBase()) {
    return false;
  }

  if (!Game.rooms[creep.memory.base].storage) {
    return false;
  }

  if (!creep.room.executeEveryTicks(1000)) {
    return false;
  }

  if (config.creep.structurer) {
    callStructurer(creep);
  }
};

Creep.prototype.callDefender = function() {
  const hostiles = this.room.findEnemys();
  if (hostiles.length > 0) {
    // this.log('Reserver under attack');
    if (!this.memory.defender_called) {
      Game.rooms[this.memory.base].memory.queue.push({
        role: 'defender',
        routing: {
          targetRoom: this.room.name,
        },
      });
      this.memory.defender_called = true;
    }
  }
};

Creep.prototype.interactWithControllerSuccess = function() {
  if (this.room.controller.reservation) {
    this.room.memory.reservation = {
      base: this.memory.base,
      tick: Game.time,
      ticksToLive: this.ticksToLive,
      reservation: this.room.controller.reservation.ticksToEnd,
    };
  }
  this.memory.targetReached = true;
  this.setNextSpawn();
};

Creep.prototype.interactWithController = function() {
  let returnCode;
  if (this.room.controller.owner && this.room.controller.owner.username !== Memory.username) {
    this.say('attack');
    returnCode = this.attackController(this.room.controller);
    if (returnCode === ERR_TIRED) {
      this.respawnMe();
      this.suicide();
      return true;
    }
  } else {
    returnCode = this.reserveController(this.room.controller);
  }

  if (returnCode === OK || returnCode === ERR_NO_BODYPART) {
    this.interactWithControllerSuccess();
    return true;
  }
  if (returnCode === ERR_NOT_IN_RANGE) {
    return true;
  }
  if (returnCode === ERR_INVALID_TARGET) {
    return true;
  }

  this.log('reserver: ' + returnCode);
};

Creep.prototype.handleReserver = function() {
  if (this.room.name !== this.memory.routing.targetRoom) {
    this.memory.routing.reached = false;
    return false;
  }
  this.reserverSetLevel();
  this.spawnReplacement(1);

  callCleaner(this);

  if (config.creep.reserverDefender) {
    this.callDefender();
  }

  this.interactWithController();
  return true;
};
