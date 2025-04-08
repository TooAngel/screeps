'use strict';

Creep.pickableResources = function(creep) {
  return (object) => creep.pos.isNearTo(object);
};

Creep.prototype.universalBeforeStorage = function() {
  this.creepLog(`universalBeforeStorage`);
  if (this.store.getFreeCapacity() === 0 && this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    const resourceToDrop = Object.keys(this.store)[0];
    this.drop(resourceToDrop, this.store[resourceToDrop]);
  }
  const methods = [];

  methods.push(Creep.getEnergy);

  if (this.room.controller && (this.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[this.room.controller.level] / 10 || this.room.controller.level === 1)) {
    methods.push(Creep.upgradeControllerTask);
  }
  if (!this.room.isConstructingSpawnEmergency()) {
    const universals = this.room.findCreep('universal').map((creep) => creep.name);
    universals.sort();
    if (universals.indexOf(this.name) < 2) {
      methods.push(Creep.transferEnergy);
    }
  }

  const structures = this.room.findBuildingConstructionSites();
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
    offset = otherCreep.store.getUsedCapacity();
  }

  // define minimum carryPercentage to move back to storage
  let carryPercentage = config.carry.carryPercentageHighway;
  if (this.room.name === this.memory.routing.targetRoom) {
    carryPercentage = config.carry.carryPercentageExtern;
  }
  if (this.inBase()) {
    carryPercentage = config.carry.carryPercentageBase;
  }

  return offset + this.store.getUsedCapacity() > carryPercentage * this.store.getCapacity();
};

Creep.prototype.pickupWhileMoving = function() {
  if (this.inBase() && this.memory.routing.pathPos < 2) {
    return false;
  }

  if (_.sum(this.store) === this.store.getCapacity()) {
    return false;
  }

  const resources = this.room.find(FIND_DROPPED_RESOURCES, {
    filter: Creep.pickableResources(this),
  });

  if (resources.length > 0) {
    const resource = resources[0];
    const amount = this.pickupOrWithdrawFromSourcer(resource);
    return _.sum(this.store) + amount > 0.5 * this.store.getCapacity();
  }

  if (this.room.name === this.memory.routing.targetRoom) {
    const containers = this.pos.findInRangeStructuresWithUsableEnergy(1);

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
  const resources = Object.keys(target.store);
  for (const resource of resources) {
    if (!returnValue) {
      returnValue = this.withdraw(target, resource) === OK;
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

Creep.prototype.withdrawRuin = function(onlyEnergy) {
  onlyEnergy = onlyEnergy || false;
  let returnValue = false;
  // FIND_RUINS and get them empty first
  const ruins = this.pos.findInRange(FIND_RUINS, 1);
  if (ruins.length > 0) {
    if (onlyEnergy) {
      returnValue = this.withdrawResourcesFromTargets(ruins, true);
    } else {
      returnValue = this.withdrawResourcesFromTargets(ruins);
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
  const sourcers = this.pos.findInRangeSourcer(1);

  if (sourcers.length > 0) {
    for (const resource of Object.keys(sourcers[0].store)) {
      const returnCode = sourcers[0].transfer(this, resource);
      if (returnCode === OK) {
        returnValue = true;
      }
    }
  }
  return returnValue;
};

Creep.prototype.pickupEnergy = function() {
  if (this.pickupEnergyFromGround()) {
    return true;
  }
  if (this.withdrawContainers()) {
    return true;
  }

  if (this.withdrawTombstone()) {
    return true;
  }

  if (this.withdrawRuin()) {
    return true;
  }

  return this.giveSourcersEnergy();
};

Creep.prototype.pickupEnergyFromGround = function() {
  const resources = this.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
    filter: {resourceType: RESOURCE_ENERGY},
  });
  if (resources.length > 0) {
    const resource = resources[0];
    const returnCode = this.pickup(resource);
    if (returnCode === OK) {
      if (resource.amount >= this.store.getFreeCapacity()) {
        return true;
      }
    }
    return false;
  }
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
      const linkPos = room.data.positions.structure.link[i];
      if (object.pos.isEqualTo(linkPos.x, linkPos.y)) {
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

const universalTarget = function(creep, object) {
  if (creep.memory.role === 'universal') {
    if (object.structureType === STRUCTURE_STORAGE || object.structureType === STRUCTURE_LINK) {
      return false;
    }
  }
  return true;
};

const filterTransferable = function(creep, object) {
  if (!canStoreEnergy(object)) {
    return false;
  }

  if (!energyAcceptingLink(object, creep.room)) {
    return false;
  }

  if (!terminalAvailable(object)) {
    return false;
  }

  if (!universalTarget(creep, object)) {
    return false;
  }

  if (object.structureType === STRUCTURE_STORAGE ?
    _.sum(object.store) + _.sum(creep.store) > object.storeCapacity :
    object.energy === object.energyCapacity) {
    return false;
  }

  return true;
};

Creep.prototype.transferAllResources = function(structure) {
  let transferred = false;
  for (const resource in this.store) {
    if (!resource) {
      continue;
    }
    const returnCode = this.transfer(structure, resource);
    if (returnCode === OK) {
      let transferableEnergy = structure.energyCapacity - structure.energy;
      if (structure.structureType === STRUCTURE_STORAGE) {
        transferableEnergy = structure.storeCapacity - _.sum(structure.store);
      }
      transferred = Math.min(this.store[resource], transferableEnergy);
    }
  }
  return transferred;
};

Creep.prototype.transferToStructures = function() {
  if (_.sum(this.store) === 0) {
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
    if (filterTransferable(this, item.structure)) {
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
  const sourcers = this.pos.findInRangeSourcer(0);
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
  if (this.store.energy === this.store.getCapacity() && this.store.getCapacity() > 0) {
    const creepsWithoutEnergy = this.pos.findInRangeCreepWithoutEnergy(1);
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
  if (this.store.energy > 0 && range > 1) {
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
    this.memory.hasEnergy = (this.store.energy === this.store.getCapacity());
  } else if (this.memory.hasEnergy && this.store.energy === 0) {
    this.memory.hasEnergy = false;
  } else if (!this.memory.hasEnergy &&
    _.sum(this.store) === this.store.getCapacity()) {
    this.memory.hasEnergy = true;
  }
};

Creep.prototype.getDroppedEnergy = function() {
  const target = this.pos.findClosestByRangeEnergy();
  if (target === null) {
    return false;
  }
  const energyRange = this.pos.getRangeTo(target.pos);
  if (energyRange <= 1) {
    this.pickupOrWithdrawFromSourcer(target);
    return true;
  }
  if (target.energy > (energyRange * 15) * (this.store.energy + 1)) {
    this.say('dropped');
    this.moveToMy(target.pos, 1);
    return true;
  }
  return false;
};

Creep.prototype.getEnergy = function() {
  if (this.store.getFreeCapacity() === 0) {
    return false;
  }
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

  if (['builder', 'universal', 'nextroomer'].includes(this.memory.role) && this.room.isConstructingSpawnEmergency()) {
    if (this.getEnergyFromAnyOfMyStructures()) {
      this.creepLog(`getEnergy.getEnergyFromAnyStructures`);
      return true;
    }
  } else {
    if (this.getEnergyFromStorage()) {
      this.creepLog(`getEnergy.getEnergyFromStorage`);
      return true;
    }
    if (this.getEnergyFromHostileStructures()) {
      this.creepLog(`getEnergy.getEnergyFromHostileStructures`);
      return true;
    }
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
    this.log(`buildConstructionSite ERR_INVALID_TARGET ${JSON.stringify(target)}`);
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

  // TODO is this necessary here? Maybe because of the builder
  this.memory.routing.targetId = target.id;
  this.moveToMy(target.pos, 3, true);
  return true;
};

Creep.prototype.construct = function() {
  let target;
  if (this.memory.routing.targetId) {
    target = Game.getObjectById(this.memory.routing.targetId);
    this.creepLog('Use memory target', target);
  }
  if (!target || target === null || !(target instanceof ConstructionSite)) {
    this.creepLog('No target');
    delete this.memory.routing.targetId;
    if (this.memory.role === 'nextroomer') {
      target = this.pos.findClosestByRangeStandardConstructionSites();
    } else if (this.memory.role === 'universal') {
      target = this.pos.findClosestByRangeBuildingConstructionSites();
    } else {
      target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    }
  }

  if (target === null) {
    return false;
  }
  this.creepLog('moveToAndBuildConstructionSite');
  return this.moveToAndBuildConstructionSite(target);
};

Creep.prototype.getTransferTargetStructure = function() {
  let structure = this.pos.findClosestStructureWithMissingEnergyByRange(
    (object) => object.structureType !== STRUCTURE_STORAGE && object.structureType !== STRUCTURE_LINK,
  );
  // Universal should always prefer Spawn and Extensions
  if (this.memory.role === 'universal') {
    const structureSpawnExtension = this.pos.findClosestStructureWithMissingEnergyByRange(
      (object) => (object.structureType === STRUCTURE_SPAWN || object.structureType === STRUCTURE_EXTENSION),
    );
    if (structureSpawnExtension !== null) {
      structure = structureSpawnExtension;
    }
  }
  if (structure === null) {
    if (this.room.storage && this.room.storage.my && this.memory.role !== 'builder') {
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
