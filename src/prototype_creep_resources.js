'use strict';

Creep.pickableResources = function(creep) {
  return function(object) {
    return creep.pos.getRangeTo(object.pos.x, object.pos.y) < 2;
  };
};

Creep.prototype.harvesterBeforeStorage = function() {
  let methods = [];

  methods.push(Creep.getEnergy);

  if (this.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[this.room.controller.level] / 10 || this.room.controller.level === 1) {
    methods.push(Creep.upgradeControllerTask);
  }

  methods.push(Creep.transferEnergy);
  let structures = this.room.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_CONTROLLER], true);
  if (structures.length > 0) {
    methods.push(Creep.constructTask);
  }

  if (this.room.controller.level < 9) {
    methods.push(Creep.upgradeControllerTask);
  } else {
    methods.push(Creep.repairStructure);
  }
  this.say('startup', true);
  Creep.execute(this, methods);
  return true;
};

Creep.prototype.checkEnergyTransfer = function(otherCreep) {
  // TODO duplicate from role_carry, extract to method
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

Creep.prototype.findCreepWhichCanTransfer = function(creeps) {
  for (let i = 0; i < creeps.length; i++) {
    let otherCreep = creeps[i];
    if (!Game.creeps[otherCreep.name] || otherCreep.carry.energy < 50) {
      continue;
    }

    if (Game.creeps[otherCreep.name].memory.role === 'carry') {
      return this.checkEnergyTransfer(otherCreep);
    }
    continue;
  }
  return false;
};

Creep.prototype.checkForTransfer = function(direction) {
  if (!direction) {
    return false;
  }

  let adjacentPos = this.pos.getAdjacentPosition(direction);

  if (adjacentPos.x < 0 || adjacentPos.y < 0) {
    return false;
  }
  if (adjacentPos.x > 49 || adjacentPos.y > 49) {
    return false;
  }

  let creeps = adjacentPos.lookFor('creep');
  return this.findCreepWhichCanTransfer(creeps);
};

Creep.prototype.pickupWhileMoving = function(reverse) {
  if (this.inBase() && this.memory.routing.pathPos < 2) {
    return reverse;
  }

  if (_.sum(this.carry) === this.carryCapacity) {
    return reverse;
  }

  // TODO Extract to somewhere (also in creep_harvester, creep_carry, config_creep_resources)
  let resources = _.filter(this.room.getDroppedResources(), Creep.pickableResources(this));

  if (resources.length > 0) {
    let resource = Game.getObjectById(resources[0].id);
    const amount = this.pickupOrWithdrawFromSourcer(resource);
    return _.sum(this.carry) + amount > 0.5 * this.carryCapacity;
  }

  if (this.room.name === this.memory.routing.targetRoom) {
    let containers = this.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: (s) => (s.structureType === STRUCTURE_CONTAINER ||
        s.structureType === STRUCTURE_STORAGE)
    });
    for (let container of containers) {
      this.withdraw(container, RESOURCE_ENERGY);
      return container.store.energy > 9;
    }
  }
  return reverse;
};

Creep.prototype.handleExtractor = function() {
  if (!this.room.terminal) {
    this.suicide();
    return true;
  }
  let carrying = _.sum(this.carry);
  if (carrying === this.carryCapacity) {
    let returnCode = this.moveToMy(this.room.terminal.pos, 1);
    for (let key in this.carry) {
      if (this.carry[key] === 0) {
        continue;
      }
      let returnCode = this.transfer(this.room.terminal, key);
      return true;
    }
  }

  let minerals = this.room.find(FIND_MINERALS);
  if (minerals.length > 0) {
    let posMem = this.room.memory.position.creep[minerals[0].id];
    let pos = new RoomPosition(posMem.x, posMem.y, posMem.roomName);
    let returnCode = this.moveToMy(pos, 0);
    this.harvest(minerals[0]);
  }
  return true;
};

Creep.prototype.sayIdiotList = function() {
  let say = function(creep) {
    let players = _.filter(Memory.players, function(object) {
      return object.idiot && object.idiot > 0;
    });
    if (players.length === 0) {
      return;
    }
    let sentence = ['Don\'t', 'like'];
    for (let player of players) {
      sentence.push(player.name);
      sentence.push(player.idiot);
    }
    let word = Game.time % sentence.length;
    creep.say(sentence[word], true);
  };
  // say(this);
};

Creep.prototype.upgraderUpdateStats = function() {
  if (!this.room.memory.upgraderUpgrade) {
    this.room.memory.upgraderUpgrade = 0;
  }
  var work_parts = 0;
  for (var part_i in this.body) {
    if (this.body[part_i].type === 'work') {
      work_parts++;
    }
  }
  this.room.memory.upgraderUpgrade += Math.min(work_parts, this.carry.energy);
};

Creep.prototype.handleUpgrader = function() {
  this.sayIdiotList();
  this.spawnReplacement(1);
  if (this.room.memory.attackTimer > 50 && this.room.controller.level > 6) {
    if (this.room.controller.ticksToDowngrade > 10000) {
      return true;
    }
  }

  var returnCode = this.upgradeController(this.room.controller);
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
  let returnCode = this.pos.createConstructionSite(STRUCTURE_CONTAINER);
  if (returnCode === OK) {
    this.log('Create cs for container');
    return true;
  }
  if (returnCode === ERR_INVALID_TARGET) {
    let constructionSites = this.pos.findInRange(FIND_CONSTRUCTION_SITES, 0);
    for (let constructionSite of constructionSites) {
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

  let constructionSites = this.pos.findInRangeStructures(FIND_CONSTRUCTION_SITES, 0, [STRUCTURE_CONTAINER]);
  if (constructionSites.length > 0) {
    let returnCode = this.build(constructionSites[0]);
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
  var objects = this.pos.findInRangeStructures(FIND_STRUCTURES, 0, [STRUCTURE_CONTAINER]);
  if (objects.length === 0) {
    return this.buildContainerExecute();
  }
  let object = objects[0];
  if (object.hits < object.hitsMax) {
    this.repair(object);
  }
};

Creep.prototype.pickupEnergy = function() {
  // TODO Extract to somewhere (also in creep_harvester, creep_carry, config_creep_resources)
  let creep = this;

  let resources = _.filter(this.room.getDroppedResources(), Creep.pickableResources);
  if (resources.length > 0) {
    let resource = Game.getObjectById(resources[0].id);
    let returnCode = this.pickup(resource);
    return returnCode === OK;
  }

  let containers = this.pos.findInRangeStructures(FIND_STRUCTURES, 1, [STRUCTURE_CONTAINER]);
  if (containers.length > 0) {
    let returnCode = this.withdraw(containers[0], RESOURCE_ENERGY);
    if (returnCode === OK) {
      return true;
    }
  }

  let sourcers = this.pos.findInRange(FIND_MY_CREEPS, 1, {
    filter: function(object) {
      if (object.memory.role === 'sourcer') {
        return true;
      }
      return false;
    }
  });
  if (sourcers.length > 0) {
    let returnCode = sourcers[0].transfer(this, RESOURCE_ENERGY);
    if (returnCode === OK) {
      return true;
    }
  }

  return false;
};

let checkCreepForTransfer = function(creep) {
  if (!Game.creeps[creep.name]) {
    return false;
  }
  // don't transfer to extractor, fixes full terminal with 80% energy?
  if (Game.creeps[creep.name].memory.role === 'extractor') {
    return false;
  }
  // Do we want this?
  if (Game.creeps[creep.name].memory.role === 'powertransporter') {
    return false;
  }
  if (creep.carry.energy === creep.carryCapacity) {
    return false;
  }
  return true;
};

Creep.prototype.transferToCreep = function(direction) {
  let adjacentPos = this.pos.getAdjacentPosition(direction);
  if (!adjacentPos.isValid()) {
    return false;
  }

  var creeps = adjacentPos.lookFor('creep');
  for (let i = 0; i < creeps.length; i++) {
    let otherCreep = creeps[i];
    if (!checkCreepForTransfer(otherCreep)) {
      continue;
    }
    var return_code = this.transfer(otherCreep, RESOURCE_ENERGY);
    if (return_code === OK) {
      return this.carry.energy * 0.5 <= otherCreep.carryCapacity - otherCreep.carry.energy;
    }
  }
  return false;
};

let canStoreEnergy = function(object) {
  let structureTypes = [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_OBSERVER];
  if (structureTypes.indexOf(object.structureType) >= 0) {
    return false;
  }
  return true;
};

let energyAcceptingLink = function(object, room) {
  if (object.structureType === STRUCTURE_LINK) {
    for (let i = 0; i < 3; i++) {
      if (object.pos.isEqualTo(room.memory.position.structure.link[i].x, room.memory.position.structure.link[i].y)) {
        return false;
      }
    }
  }
  return true;
};

let terminalAvailable = function(object) {
  if (object.structureType === STRUCTURE_TERMINAL && (object.store.energy || 0) > 10000) {
    return false;
  }
  return true;
};

let harvesterTarget = function(creep, object) {
  if (creep.memory.role === 'harvester') {
    if (object.structureType === STRUCTURE_STORAGE || object.structureType === STRUCTURE_LINK) {
      return false;
    }
  }
  return true;
};

let filterTransferrables = function(creep, object) {
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

  if (object.structureType !== STRUCTURE_STORAGE && object.energy === object.energyCapacity) {
    return false;
  }

  return true;
};

Creep.prototype.transferAllResources = function(structure) {
  let transferred = false;
  for (let resource in this.carry) {
    if (!resource) {
      continue;
    }
    let returnCode = this.transfer(structure, resource);
    if (returnCode === OK) {
      transferred = Math.min(this.carry[resource], structure.energyCapacity - structure.energy);
    }
  }
  return transferred;
};

Creep.prototype.transferToStructures = function() {
  if (_.sum(this.carry) === 0) {
    return false;
  }

  let transferred = false;
  var look = this.room.lookForAtArea(
    LOOK_STRUCTURES,
    Math.max(1, Math.min(48, this.pos.y - 1)),
    Math.max(1, Math.min(48, this.pos.x - 1)),
    Math.max(1, Math.min(48, this.pos.y + 1)),
    Math.max(1, Math.min(48, this.pos.x + 1)),
    true);
  for (let item of look) {
    if (filterTransferrables(this, item.structure)) {
      if (transferred) {
        return {
          moreStructures: true,
          // TODO handle different type of resources on the structure side
          transferred: transferred
        };
      }
      transferred = this.transferAllResources(item.structure);
    }
  }
  return false;
};

Creep.prototype.getEnergyFromSourcer = function() {
  let sourcers = this.pos.findInRange(FIND_MY_CREEPS, 1, {
    filter: function(object) {
      let creep = Game.getObjectById(object.id);
      if (creep.memory.role === 'sourcer' && creep.carry.energy > 0) {
        return true;
      }
      return false;
    }
  });
  if (sourcers.length > 0) {
    let returnCode = sourcers[0].transfer(this, RESOURCE_ENERGY);
    this.say('rr:' + returnCode);
    if (returnCode === OK) {
      return true;
    }
  }
  return false;
};

Creep.prototype.moveToSource = function(source) {
  if (!this.memory.routing) {
    this.memory.routing = {};
  }
  this.memory.routing.reverse = false;
  if (this.room.memory.misplacedSpawn || this.room.controller.level < 3 || this.memory.role === 'nextroomer') {
    this.moveTo(source.pos);
  } else {
    this.moveByPathMy([{
      'name': this.room.name
    }], 0, 'pathStart', source.id, true, undefined);
  }
  return true;
};

Creep.prototype.harvestSource = function(source) {
  let returnCode = this.harvest(source);
  if (this.carry.energy >= this.carryCapacity) {
    var creep = this;
    var creep_without_energy = this.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter: function(object) {
        return object.carry.energy === 0 && object.id !== creep.id;
      }
    });
    this.transfer(creep_without_energy, RESOURCE_ENERGY);
  }

  // TODO Somehow we move before preMove, canceling here
  this.cancelOrder('move');
  this.cancelOrder('moveTo');
  return true;
};

Creep.prototype.getEnergyFromSource = function() {
  let source = this.pos.getClosestSource();
  let range = this.pos.getRangeTo(source);
  if (this.carry.energy > 0 && range > 1) {
    this.memory.hasEnergy = true; // Stop looking and spend the energy.
    return false;
  }

  if (range <= 2) {
    if (this.getEnergyFromSourcer()) {
      return true;
    }
  }

  if (range === 1) {
    return this.harvestSource(source);
  } else {
    return this.moveToSource(source);
  }
};

Creep.prototype.setHasEnergy = function() {
  if (this.memory.hasEnergy === undefined) {
    this.memory.hasEnergy = (this.carry.energy === this.carryCapacity);
  } else if (this.memory.hasEnergy && this.carry.energy === 0) {
    this.memory.hasEnergy = false;
  } else if (!this.memory.hasEnergy &&
    this.carry.energy === this.carryCapacity) {
    this.memory.hasEnergy = true;
  }
};

Creep.prototype.getEnergy = function() {
  /* State machine:
   * No energy, goes to collect energy until full.
   * Full energy, uses energy until empty.
   */
  this.setHasEnergy();

  if (this.memory.hasEnergy) {
    return false;
  }

  if (this.getDroppedEnergy()) {
    return true;
  }

  if (this.getEnergyFromStorage()) {
    return true;
  }

  if (this.getEnergyFromHostileStructures()) {
    return true;
  }

  return this.getEnergyFromSource();
};

Creep.prototype.buildConstructionSite = function(target) {
  let returnCode = this.build(target);
  if (returnCode === OK) {
    this.moveRandomWithin(target.pos);
    return true;
  } else if (returnCode === ERR_NOT_ENOUGH_RESOURCES) {
    return true;
  } else if (returnCode === ERR_INVALID_TARGET) {
    this.log('config_creep_resource construct: ' + returnCode + ' ' + JSON.stringify(target.pos));
    this.moveRandom();
    target.pos.clearPosition(target);
    return true;
  }
  this.log('config_creep_resource construct: ' + returnCode + ' ' + JSON.stringify(target.pos));
  return false;
};

Creep.prototype.construct = function() {
  var target;
  if (this.memory.role === 'nextroomer') {
    target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
      filter: s => s.structureType !== STRUCTURE_RAMPART
    });
  } else {
    target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
  }

  if (target === null) {
    return false;
  }

  var range = this.pos.getRangeTo(target);
  if (range <= 3) {
    return this.buildConstructionSite(target);
  }

  this.moveToMy(target.pos, 3);
  return true;
};

Creep.prototype.getTransferTarget = function() {
  let structure = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: (s) => {
      if (s.energy === s.energyCapacity) {
        return false;
      }
      return (s.structureType === STRUCTURE_EXTENSION ||
        s.structureType === STRUCTURE_SPAWN ||
        s.structureType === STRUCTURE_TOWER);
    }
  });
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

Creep.prototype.transferEnergyMy = function() {
  if (!this.memory.targetEnergyMy) {
    this.getTransferTarget();
    if (!this.memory.targetEnergyMy) {
      return false;
    }
  }

  var target = Game.getObjectById(this.memory.targetEnergyMy);
  if (!target) {
    this.log(`transferEnergyMy: Can not find target ${this.memory.targetEnergyMy}`);
    delete this.memory.targetEnergyMy;
    return false;
  }
  var range = this.pos.getRangeTo(target);
  if (range === 1) {
    let returnCode = this.transfer(target, RESOURCE_ENERGY);
    if (returnCode !== OK && returnCode !== ERR_FULL) {
      this.log('transferEnergyMy: ' + returnCode + ' ' +
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
  if (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd > 4500) {
    this.memory.level = 1;
  }
  if (!this.room.controller.my && this.room.controller.reservation && this.room.controller.reservation.username !== Memory.username) {
    this.memory.level = 5;
  }
};

let callStructurer = function(creep) {
  var structurers = creep.room.find(FIND_MY_CREEPS, {
    filter: Room.findCreep('structurer')
  });
  if (structurers.length > 0) {
    return false;
  }
  var resource_structures = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_CONTAINER], true);
  if (resource_structures.length > 0 && !creep.room.controller.my) {
    creep.log('Call structurer from ' + creep.memory.base + ' because of ' + resource_structures[0].structureType);
    Game.rooms[creep.memory.base].checkRoleToSpawn('structurer', 1, undefined, creep.room.name);
    return true;
  }
};

let callCleaner = function(creep) {
  if (creep.inBase()) {
    return false;
  }

  if (!Game.rooms[creep.memory.base].storage) {
    return false;
  }

  if (!creep.room.exectueEveryTicks(1000)) {
    return false;
  }

  if (config.creep.structurer) {
    callStructurer(creep);
  }
};

let checkSourcerMatch = function(sourcers, source_id) {
  for (let i = 0; i < sourcers.length; i++) {
    var sourcer = Game.creeps[sourcers[i].name];
    if (sourcer.memory.routing.targetId === source_id) {
      return true;
    }
  }
  return false;
};

let checkSourcer = function(creep) {
  var sources = creep.room.find(FIND_SOURCES);
  var sourcer = creep.room.find(FIND_MY_CREEPS, {
    filter: Room.findCreep('sourcer')
  });

  if (sourcer.length < sources.length) {
    let sourceParse = function(source) {
      if (!checkSourcerMatch(sourcer, source.pos)) {
        Game.rooms[creep.memory.base].checkRoleToSpawn('sourcer', 1, source.id, source.pos.roomName);
      }
    };
    _.each(sources, (sourceParse));
  }
};

Creep.prototype.callDefender = function() {
  var hostiles = this.room.getEnemys();
  if (hostiles.length > 0) {
    //this.log('Reserver under attack');
    if (!this.memory.defender_called) {
      Game.rooms[this.memory.base].memory.queue.push({
        role: 'defender',
        routing: {
          targetRoom: this.room.name
        }
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
      reservation: this.room.controller.reservation.ticksToEnd
    };
  }
  this.memory.targetReached = true;
  this.setNextSpawn();
};

Creep.prototype.interactWithController = function() {
  var return_code;
  if (this.room.controller.owner && this.room.controller.owner !== Memory.username) {
    this.say('attack');
    return_code = this.attackController(this.room.controller);
  } else {
    return_code = this.reserveController(this.room.controller);
  }

  if (return_code === OK || return_code === ERR_NO_BODYPART) {
    this.interactWithControllerSuccess();
    return true;
  }
  if (return_code === ERR_NOT_IN_RANGE) {
    return true;
  }
  if (return_code === ERR_INVALID_TARGET) {
    return true;
  }

  this.log('reserver: ' + return_code);
};

Creep.prototype.handleReserver = function() {
  if (this.room.name !== this.memory.routing.targetRoom) {
    this.memory.routing.reached = false;
    return false;
  }
  this.reserverSetLevel();
  this.spawnReplacement(1);

  callCleaner(this);

  if (this.room.exectueEveryTicks(100) && this.room.controller.reservation && this.room.controller.reservation.username === Memory.username) {
    checkSourcer(this);
  }

  if (config.creep.reserverDefender) {
    this.callDefender();
  }

  this.interactWithController();
  return true;
};
