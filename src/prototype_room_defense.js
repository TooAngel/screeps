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
  if (!this.exectueEveryTicks(config.room.handleNukeAttackInterval)) {
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

  let isRampart = function(object) {
    return object.structureType === STRUCTURE_RAMPART;
  };

  for (let nuke of nukes) {
    const structures = nuke.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 4, 'structureType', [STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_WALL], true);
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
  const towers = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_TOWER]);
  if (towers.length === 0) {
    return false;
  }
  const hostileCreeps = this.find(FIND_HOSTILE_CREEPS, {
    filter: object => !brain.isFriend(object.owner.username)
  });
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

  if (config.tower.healMyCreeps) {
    const my_creeps = this.find(FIND_MY_CREEPS, {
      filter: function(object) {
        return object.hits < object.hitsMax;
      }
    });
    if (my_creeps.length > 0) {
      for (let tower of towers) {
        tower.heal(my_creeps[0]);
      }
      return true;
    }
  }

  if (this.controller.level < 4) {
    return false;
  }

  if (!config.tower.repairStructures) {
    return true;
  }

  if (!this.memory.repair_min) {
    this.memory.repair_min = 0;
  }

  let repairable_structures = object => object.hits < object.hitsMax / 2;

  let repair_min = this.memory.repair_min;
  let repairable_blockers = object => object.hits < Math.min(repair_min, object.hitsMax);

  for (let tower of towers) {
    if (tower.energy === 0) {
      continue;
    }
    if (!this.exectueEveryTicks(10)) {
      if (tower.energy < tower.energyCapacity / 2 || this.memory.repair_min > 1000000) {
        continue;
      }
    }

    const low_rampart = tower.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART], false, {
      filter: rampart => rampart.hits < 10000
    });

    let repair = low_rampart;
    if (low_rampart === null) {
      let to_repair = tower.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [
        STRUCTURE_WALL, STRUCTURE_RAMPART
      ], true, { filter: repairable_structures });
      // if (to_repair === null) {
      //   to_repair = tower.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_WALL, STRUCTURE_RAMPART], false, {
      //     filter: repairable_blockers
      //   });
      // }
      // if (to_repair === null) {
      //   this.memory.repair_min += 10000;
      //   this.log('Defense level: ' + this.memory.repair_min);
      //   continue;
      // }
      repair = to_repair;
      tower.repair(repair);
    }
  }
  return true;
};
