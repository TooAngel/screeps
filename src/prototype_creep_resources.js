'use strict';

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

  Creep.execute(this, methods);
  return true;
};

Creep.prototype.checkForTransfer = function(direction) {
  if (!direction) {
    return false;
  }

  var pos;
  var creeps;
  var index_calc;
  var offset;
  var new_path;

  //  for (var direction = 1; direction < 9; direction++) {
  let adjacentPos = this.pos.getAdjacentPosition(direction);

  if (adjacentPos.x < 0 || adjacentPos.y < 0) {
    return false;
  }
  if (adjacentPos.x > 49 || adjacentPos.y > 49) {
    return false;
  }

  creeps = adjacentPos.lookFor('creep');

  for (var name in creeps) {
    let otherCreep = creeps[name];
    if (!Game.creeps[otherCreep.name]) {
      continue;
    }
    if (otherCreep.carry.energy < 50) {
      continue;
    }
    if (Game.creeps[otherCreep.name].memory.role === 'carry') {
      // TODO duplicate from role_carry, extract to method
      let carryPercentage = 0.1;
      if (this.room.name === this.memory.routing.targetRoom) {
        carryPercentage = 0.8;
      }
      if (this.inBase()) {
        carryPercentage = 0.0;
      }
      return otherCreep.carry.energy + _.sum(this.carry) > carryPercentage * this.carryCapacity;
    }
    continue;
  }
  //  }
  return false;
};

Creep.prototype.pickupWhileMoving = function(reverse) {
  if (this.inBase() && this.memory.routing.pathPos < 2) {
    return reverse;
  }

  if (_.sum(this.carry) < this.carryCapacity) {
    let creep = this;
    // TODO Extract to somewhere (also in creep_harvester, creep_carry, config_creep_resources)
    let pickableResources = function(object) {
      return creep.pos.getRangeTo(object.pos.x, object.pos.y) < 2;
    };

    let resources = _.filter(this.room.getDroppedResources(), pickableResources);

    if (resources.length > 0) {
      let resource = Game.getObjectById(resources[0].id);
      this.pickup(resource);
      return _.sum(this.carry) + resource.amount > 0.5 * this.carryCapacity;
    }

    if (this.room.name === this.memory.routing.targetRoom) {
      let containers = this.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (s) => (s.structureType === STRUCTURE_CONTAINER ||
          s.structureType === STRUCTURE_STORAGE),
      });
      for (let container of containers) {
        this.withdraw(container, RESOURCE_ENERGY);
        return container.store.energy > 9;
      }
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
    let returnCode = this.moveToMy(pos);
    this.harvest(minerals[0]);
  }
  return true;
};

Creep.prototype.handleUpgrader = function() {
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
  this.spawnReplacement(1);
  var room = Game.rooms[this.room.name];
  if (room.memory.attackTimer > 50 && room.controller.level > 6) {
    if (room.controller.ticksToDowngrade > 10000) {
      return true;
    }
  }

  var returnCode = this.upgradeController(this.room.controller);
  if (returnCode === OK) {
    if (!room.memory.upgraderUpgrade) {
      room.memory.upgraderUpgrade = 0;
    }
    var work_parts = 0;
    for (var part_i in this.body) {
      if (this.body[part_i].type === 'work') {
        work_parts++;
      }
    }
    room.memory.upgraderUpgrade += Math.min(work_parts, this.carry.energy);
  }

  returnCode = this.withdraw(this.room.storage, RESOURCE_ENERGY);
  if (returnCode === ERR_FULL) {
    return true;
  }
  if (returnCode === OK) {
    return true;
  }
  return true;
};

Creep.prototype.buildContainer = function() {
  if (this.inBase()) {
    return false;
  }
  // TODO Not in base room
  var objects = this.pos.findInRange(FIND_STRUCTURES, 0, {
    filter: function(object) {
      if (object.structureType === STRUCTURE_CONTAINER) {
        return true;
      }
      return false;
    }
  });
  if (objects.length === 0) {
    if (this.carry.energy >= 50) {
      let constructionSites = this.pos.findInRange(FIND_CONSTRUCTION_SITES, 0, {
        filter: function(object) {
          if (object.structureType != STRUCTURE_CONTAINER) {
            return false;
          }
          return true;
        }
      });
      if (constructionSites.length > 0) {
        let returnCode = this.build(constructionSites[0]);
        if (returnCode != OK) {
          this.log('build container: ' + returnCode);
        }
        return true;
      }

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
      if (returnCode != ERR_FULL) {
        this.log('Container: ' + returnCode + ' pos: ' + this.pos);
      }
      return false;
    }
  }
  if (objects.length > 0) {
    let object = objects[0];
    if (object.hits < object.hitsMax) {
      this.repair(object);
    }
  }
};

Creep.prototype.pickupEnergy = function() {
  // TODO Extract to somewhere (also in creep_harvester, creep_carry, config_creep_resources)
  let creep = this;
  let pickableResources = function(object) {
    return creep.pos.getRangeTo(object.pos.x, object.pos.y) < 2;
  };

  let resources = _.filter(this.room.getDroppedResources(), pickableResources);
  if (resources.length > 0) {
    let resource = Game.getObjectById(resources[0].id);
    let returnCode = this.pickup(resource);
    return returnCode === OK;
  }

  let containers = this.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: function(object) {
      if (object.structureType === STRUCTURE_CONTAINER) {
        return true;
      }
      return false;
    }
  });
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

// After introduction of `routing` take the direction to transfer to
Creep.prototype.transferToCreep = function(direction) {
  // TODO Only forward proper
  for (var index = -1; index < 2; index++) { // Only forward
    let indexCalc = (+direction + 7 + index) % 8 + 1;
    let adjacentPos = this.pos.getAdjacentPosition(indexCalc);
    if (adjacentPos.x < 0 || adjacentPos.y < 0) {
      continue;
    }
    if (adjacentPos.x > 49 || adjacentPos.y > 49) {
      continue;
    }

    var creeps = adjacentPos.lookFor('creep');
    for (var name in creeps) {
      let otherCreep = creeps[name];
      if (!Game.creeps[otherCreep.name]) {
        continue;
      }
      // don't transfer to extractor, fixes full terminal with 80% energy?
      if (Game.creeps[otherCreep.name].memory.role === 'extractor') {
        continue;
      }
      // Do we want this?
      if (Game.creeps[otherCreep.name].memory.role === 'powertransporter') {
        continue;
      }
      if (otherCreep.carry.energy === otherCreep.carryCapacity) {
        continue;
      }
      var return_code = this.transfer(otherCreep, RESOURCE_ENERGY);
      if (return_code === OK) {
        // return true;
        return this.carry.energy * 0.5 <= otherCreep.carryCapacity - otherCreep.carry.energy;
      }
    }
  }
  return false;
};

Creep.prototype.transferToStructures = function() {
  if (_.sum(this.carry) === 0) {
    return false;
  }

  let creep = this;
  let room = creep.room;
  let filterTransferrables = function(object) {
    if (object.structureType === STRUCTURE_CONTROLLER) {
      return false;
    }
    if (object.structureType === STRUCTURE_ROAD) {
      return false;
    }
    if (object.structureType === STRUCTURE_WALL) {
      return false;
    }
    if (object.structureType === STRUCTURE_RAMPART) {
      return false;
    }
    if (object.structureType === STRUCTURE_OBSERVER) {
      return false;
    }

    if (object.structureType === STRUCTURE_LINK) {
      if (object.pos.isEqualTo(room.memory.position.structure.link[0].x, room.memory.position.structure.link[0].y)) {
        return false;
      }
      if (object.pos.isEqualTo(room.memory.position.structure.link[1].x, room.memory.position.structure.link[1].y)) {
        return false;
      }
      if (object.pos.isEqualTo(room.memory.position.structure.link[2].x, room.memory.position.structure.link[2].y)) {
        return false;
      }
    }

    if (object.structureType === STRUCTURE_TERMINAL && (object.store.energy || 0) > 10000) {
      return false;
    }

    if (creep.memory.role === 'harvester' && object.structureType === STRUCTURE_STORAGE) {
      return false;
    }

    if (creep.memory.role === 'harvester' && object.structureType === STRUCTURE_LINK) {
      return false;
    }

    if ((object.structureType === STRUCTURE_LAB ||
        object.structureType === STRUCTURE_EXTENSION ||
        object.structureType === STRUCTURE_SPAWN ||
        object.structureType === STRUCTURE_NUKER ||
        object.structureType === STRUCTURE_POWER_SPAWN ||
        object.structureType === STRUCTURE_TOWER ||
        object.structureType === STRUCTURE_LINK) &&
      object.energy === object.energyCapacity) {
      return false;
    }

    return true;
  };

  let transferred = false;
  var look = this.room.lookForAtArea(
    LOOK_STRUCTURES,
    Math.max(1, Math.min(48, this.pos.y - 1)),
    Math.max(1, Math.min(48, this.pos.x - 1)),
    Math.max(1, Math.min(48, this.pos.y + 1)),
    Math.max(1, Math.min(48, this.pos.x + 1)),
    true);
  for (let item of look) {
    if (filterTransferrables(item.structure)) {
      if (transferred) {
        return {
          moreStructures: true,
          // TODO handle different type of resources on the structure side
          transferred: transferred
        };
      }
      for (let resource in this.carry) {
        let returnCode = this.transfer(item.structure, resource);
        if (returnCode === OK) {
          transferred = Math.min(this.carry[resource], item.structure.energyCapacity - item.structure.energy);
        }
      }
    }
  }
  return false;
};

Creep.prototype.transferMy = function() {
  var pos;
  var structures;
  var structure;
  var creeps;
  let otherCreep;
  var offset;
  var index;
  var return_code;
  var name;

  for (let direction = 1; direction < 9; direction++) {
    let adjacentPos = this.pos.getAdjacentPosition(direction);
    if (adjacentPos.x < 0 || adjacentPos.y < 0) {
      continue;
    }
    if (adjacentPos.x > 49 || adjacentPos.y > 49) {
      continue;
    }
    creeps = adjacentPos.lookFor('creep');
    for (name in creeps) {
      otherCreep = creeps[name];
      if (!otherCreep.my) {
        continue;
      }
      if (otherCreep.carry.energy === otherCreep.carryCapacity) {
        continue;
      }
      return_code = this.transfer(otherCreep, RESOURCE_ENERGY);
      return return_code === 0;
    }
  }
  return false;
};

Creep.prototype.getEnergy = function() {
  /* State machine:
   * No energy, goes to collect energy until full.
   * Full energy, uses energy until empty.
   */
  if (this.memory.hasEnergy === undefined) {
    this.memory.hasEnergy = (this.carry.energy === this.carryCapacity);
  } else if (this.memory.hasEnergy && this.carry.energy === 0) {
    this.memory.hasEnergy = false;
  } else if (!this.memory.hasEnergy &&
    this.carry.energy === this.carryCapacity) {
    this.memory.hasEnergy = true;
  }

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

  var range = null;
  var item = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE);

  if (item === null) {
    if (this.carry.energy === 0) {
      var source = this.pos.findClosestByRange(FIND_SOURCES);
      let returnCode = this.moveToMy(source.pos);
      return true;
    } else {
      this.memory.hasEnergy = true; // Stop looking and spend the energy.
      return false;
    }
  }

  range = this.pos.getRangeTo(item);
  if (this.carry.energy > 0 && range > 1) {
    this.memory.hasEnergy = true; // Stop looking and spend the energy.
    return false;
  }

  if (range === 1) {
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
  }

  if (typeof(this.memory.target) != 'undefined') {
    delete this.memory.target;
  }

  if (range === 1) {
    let returnCode = this.harvest(item);
    if (this.carry.energy >= this.carryCapacity) {
      var creep = this;
      var creep_without_energy = this.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: function(object) {
          return object.carry.energy === 0 && object.id != creep.id;
        }
      });
      range = this.pos.getRangeTo(creep_without_energy);

      if (range === 1) {
        this.transfer(creep_without_energy, RESOURCE_ENERGY);
      }
    }
    // TODO Somehow we move before preMove, canceling here
    this.cancelOrder('move');
    this.cancelOrder('moveTo');
    return true;
  } else {
    if (!this.memory.routing) {
      this.memory.routing = {};
    }
    this.memory.routing.reverse = false;
    if (this.room.memory.misplacedSpawn || this.room.controller.level < 3) {
      this.moveTo(item.pos);
    } else {
      this.moveByPathMy([{
        'name': this.room.name
      }], 0, 'pathStart', item.id, true, undefined);
    }
    return true;
  }
};

Creep.prototype.construct = function() {
  //   this.say('construct', true);
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
    let returnCode = this.build(target);
    if (returnCode === OK) {
      this.moveRandomWithin(target.pos);
      return true;
    } else if (returnCode === ERR_NOT_ENOUGH_RESOURCES) {
      return true;
    } else if (returnCode === ERR_INVALID_TARGET) {
      this.log('config_creep_resource construct: ' + returnCode + ' ' + JSON.stringify(target.pos));
      this.moveRandom();

      let structures = target.pos.lookFor('structure');
      for (let structureId in structures) {
        let structure = structures[structureId];
        if (structure.structureType === STRUCTURE_SPAWN) {
          let spawns = this.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
          if (spawns.length <= 1) {
            target.remove();
            return true;
          }
        }
        this.log('Destroying: ' + structure.structureType);
        structure.destroy();
      }
      return true;
    }
    this.log('config_creep_resource construct: ' + returnCode + ' ' + JSON.stringify(target.pos));
  } else {
    let search = PathFinder.search(
      this.pos, {
        pos: target.pos,
        range: 3
      }, {
        roomCallback: this.room.getCostMatrixCallback(target.pos, true),
        maxRooms: 0
      }
    );

    if (search.incomplete) {
      this.moveTo(target.pos);
      return true;
    }

    if (range > 5 && search.path.length === 1) {
      // TODO extract to a method and make sure, e.g. creep doesn't leave the room
      this.moveRandom();
      return true;
    }

    // TODO Stuck?
    if (!this.pos.getDirectionTo(search.path[0])) {
      this.moveRandom();
      return true;
    }

    let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    if (returnCode != ERR_TIRED) {
      this.memory.lastPosition = this.pos;
    }
  }
  return true;
};

Creep.prototype.transferEnergyMy = function() {
  let exitDir;

  if (!this.memory.target) {
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
      if (this.room.storage && this.room.storage.my && this.memory.role != 'planer') {
        this.memory.target = this.room.storage.id;
      } else {
        return false;
      }
    } else {
      this.memory.target = structure.id;
    }
  }

  var target = Game.getObjectById(this.memory.target);
  if (!target) {
    this.log('transferEnergyMy: Can not find target');
    delete this.memory.target;
    return false;
  }

  //   this.say('transferEnergy', true);
  var range = this.pos.getRangeTo(target);
  // this.log('target: ' + target.pos + ' range: ' + range);
  if (range === 1) {
    let returnCode = this.transfer(target, RESOURCE_ENERGY);
    if (returnCode != OK && returnCode != ERR_FULL) {
      this.log('transferEnergyMy: ' + returnCode + ' ' +
        target.structureType + ' ' + target.pos);
    }
    delete this.memory.target;
  } else {
    let returnCode = this.moveToMy(target.pos, 1);
    if (returnCode === false) {
      this.say('tr:incompl', true);
      if (config.path.pathfindIncomplete) {
        this.moveTo(target.pos);
        return true;
      }
    }
  }
  return true;
};

Creep.prototype.handleReserver = function() {
  if (this.room.name != this.memory.routing.targetRoom) {
    this.memory.routing.reached = false;
    return false;
  }

  this.memory.level = 2;
  if (this.room.controller.reservation && this.room.controller.reservation.ticksToEnd > 4500) {
    this.memory.level = 1;
  }
  if (!this.room.controller.my && this.room.controller.reservation && this.room.controller.reservation.username != Memory.username) {
    this.memory.level = 5;
  }
  this.spawnReplacement(1);

  let callCleaner = function(creep) {
    if (creep.inBase()) {
      return false;
    }

    if (!Game.rooms[creep.memory.base].storage) {
      return false;
    }

    if ((Game.time + creep.pos.x + creep.pos.y) % 1000 !== 0) {
      return false;
    }

    if (config.creep.structurer) {
      var structurers = creep.room.find(FIND_MY_CREEPS, {
        filter: function(object) {
          return object.memory.role === 'structurer';
        }
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
    }
  };

  callCleaner(this);

  if (Game.time % 100 === 0 && this.room.controller.reservation && this.room.controller.reservation.username === Memory.username) {
    let checkSourcer = function(creep) {
      let checkSourcerMatch = function(sourcers, source_id) {
        for (var sourcer_i in sourcers) {
          var sourcer = sourcers[sourcer_i];
          if (sourcer.memory.routing.targetId === source_id) {
            return true;
          }
        }
        return false;
      };
      var sources = creep.room.find(FIND_SOURCES);
      var sourcer = creep.room.find(FIND_MY_CREEPS, {
        filter: function(object) {
          return object.memory.role === 'sourcer';
        }
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
    checkSourcer(this);
  }

  if (config.creep.reserverDefender) {
    var hostiles = this.room.getEnemys();
    if (hostiles.length > 0) {
      //this.log('Reserver under attack');
      if (!this.memory.defender_called) {
        Game.rooms[this.memory.base].memory.queue.push({
          role: 'defender',
          routing: {
            targetRoom: this.room.name
          },
        });
        this.memory.defender_called = true;
      }
    }
  }

  var method = this.reserveController;
  var return_code;
  if (this.room.controller.owner && this.room.controller.owner != Memory.username) {
    this.say('attack');
    return_code = this.attackController(this.room.controller);
  } else {
    return_code = this.reserveController(this.room.controller);
  }

  if (return_code === OK || return_code === ERR_NO_BODYPART) {
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
    return true;
  }
  if (return_code === ERR_NOT_IN_RANGE) {
    return true;
  }
  if (return_code === ERR_INVALID_TARGET) {
    return true;
  }

  this.log('reserver: ' + return_code);

  return true;
};
