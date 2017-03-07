'use strict';

Room.prototype.findAttackCreeps = function(object) {
  if (object.owner.username === 'Source Keeper') {
    return false;
  }

  for (var item in object.body) {
    var part = object.body[item];
    if (part.energy === 0) {
      continue;
    }
    if (part.type === 'attack') {
      return true;
    }
    if (part.type === 'ranged_attack') {
      return true;
    }
    if (part.type === 'heal') {
      return true;
    }
    if (part.type === 'work') {
      return true;
    }
    if (part.type === 'claim') {
      return true;
    }
  }
  return true;
  // TODO defender stop in rooms with (non attacking) enemies
  //    return false;
};

Room.prototype.handleNukeAttack = function() {
  if (Game.time % config.room.handleNukeAttackInterval !== 0) {
    return false;
  }

  let nukes = this.find(FIND_NUKES);
  if (nukes.length === 0) {
    return false;
  }

  let sorted = _.sortBy(nukes, function(object) {
    return object.timeToLand;
  });
  if (sorted[0].timeToLand < 100) {
    this.controller.activateSafeMode();
  }

  let findSaveableStructures = function(object) {
    if (object.structureType === STRUCTURE_ROAD) {
      return false;
    }
    if (object.structureType === STRUCTURE_RAMPART) {
      return false;
    }
    if (object.structureType === STRUCTURE_WALL) {
      return false;
    }
    return true;
  };

  let isRampart = function(object) {
    return object.structureType === STRUCTURE_RAMPART;
  };

  for (let nuke of nukes) {
    var structures = nuke.pos.findInRange(FIND_MY_STRUCTURES, 4, {
      filter: findSaveableStructures
    });
    this.log('Nuke attack !!!!!');
    for (let structure of structures) {
      let lookConstructionSites = structure.pos.lookFor(LOOK_CONSTRUCTION_SITES);
      if (lookConstructionSites.length > 0) {
        continue;
      }
      let lookStructures = structure.pos.lookFor(LOOK_STRUCTURES);
      let lookRampart = _.findIndex(lookStructures, isRampart);
      if (lookRampart > -1) {
        continue;
      }
      this.log('Build rampart: ' + JSON.stringify(structure.pos));
      structure.pos.createConstructionSite(STRUCTURE_RAMPART);
    }
  }

  return true;
};

Room.prototype.handleTower = function() {
  var tower_id;
  var towers = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_TOWER]);
  if (towers.length === 0) {
    return false;
  }
  var hostileCreeps = this.find(FIND_HOSTILE_CREEPS);
  if (hostileCreeps.length > 0) {
    let tower;
    let hostileOffset = {};
    let sortHostiles = function(object) {
      return tower.pos.getRangeTo(object) + (hostileOffset[object.id] || 0);
    };

    let towersAttacking = _.sortBy(towers, function(object) {
      let hostile = object.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      return object.pos.getRangeTo(hostile);
    });

    for (tower of towersAttacking) {
      let hostilesSorted = _.sortBy(hostileCreeps, sortHostiles);
      tower.attack(hostilesSorted[0]);
      hostileOffset[hostilesSorted[0].id] = 100;
    }
    return true;
  }

  var my_creeps = this.find(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax;
    }
  });
  if (my_creeps.length > 0) {
    for (tower_id in towers) {
      towers[tower_id].heal(my_creeps[0]);
    }
    return true;
  }

  if (this.controller.level < 4) {
    return false;
  }

  if (!this.memory.repair_min) {
    this.memory.repair_min = 0;
  }

  let repairable_structures = function(object) {
    if (object.hits === object.hitsMax) {
      return false;
    }
    if (object.structureType === STRUCTURE_WALL) {
      return false;
    }
    if (object.structureType === STRUCTURE_RAMPART) {
      return false;
    }
    // TODO Let see if the creeps can keep the roads alive
    if (object.structureType === STRUCTURE_ROAD) {
      return false;
    }
    return true;
  };

  let repair_min = this.memory.repair_min;
  let repairable_blockers = function(object) {
    if (object.hits >= Math.min(repair_min, object.hitsMax)) {
      return false;
    }
    if (object.structureType === STRUCTURE_WALL) {
      return true;
    }
    if (object.structureType === STRUCTURE_RAMPART) {
      return true;
    }
    return false;
  };
  let tower;
  for (var tower_index in towers) {
    tower = towers[tower_index];
    if (tower.energy === 0) {
      continue;
    }
    if ((Game.time + this.controller.pos.x + this.controller.pos.y + tower.pos.x + tower.pos.y + tower.energy) % 10 !== 0) {
      if (tower.energy < tower.energyCapacity / 2 || this.memory.repair_min > 1000000) {
        continue;
      }
    }

    var low_rampart = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.structureType === 'rampart' && object.hits < 10000) {
          return true;
        }
        return false;
      }
    });

    var repair = low_rampart;
    if (low_rampart === null) {
      let to_repair = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: repairable_structures
      });
      //      if (to_repair === null) {
      //        to_repair = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      //          filter: repairable_blockers
      //        });
      //      }
      //      if (to_repair === null) {
      //        this.memory.repair_min += 10000;
      //        this.log('Defense level: ' + this.memory.repair_min);
      //        continue;
      //      }
      repair = to_repair;
      tower.repair(repair);
    }
  }
  return true;
};
