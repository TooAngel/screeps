'use strict';

Room.prototype.findAttackCreeps = function(object) {
  if (object.owner.username === 'Source Keeper') {
    return false;
  }

  for (const item of Object.keys(object.body)) {
    const part = object.body[item];
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
  return false;
};

Room.prototype.handleNukeAttack = function() {
  if (!this.executeEveryTicks(config.room.handleNukeAttackInterval)) {
    return false;
  }

  const nukes = this.findNukes();
  if (nukes.length === 0) {
    return false;
  }

  const sorted = _.sortBy(nukes, (object) => {
    return object.timeToLand;
  });
  if (sorted[0].timeToLand < 100) {
    this.controller.activateSafeMode();
  }

  const isRampart = function(object) {
    return object.structureType === STRUCTURE_RAMPART;
  };

  for (const nuke of nukes) {
    const structures = nuke.pos.findInRangePropertyFilter(FIND_MY_STRUCTURES, 4, 'structureType', [STRUCTURE_ROAD, STRUCTURE_RAMPART, STRUCTURE_WALL], {inverse: true});
    this.log('Nuke attack !!!!!');
    for (const structure of structures) {
      const lookConstructionSites = structure.pos.lookFor(LOOK_CONSTRUCTION_SITES);
      if (lookConstructionSites.length > 0) {
        continue;
      }
      const lookStructures = structure.pos.lookFor(LOOK_STRUCTURES);
      const lookRampart = _.findIndex(lookStructures, isRampart);
      if (lookRampart > -1) {
        continue;
      }
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
  const hostileCreeps = this.findEnemys();
  if (hostileCreeps.length > 0) {
    let tower;
    const hostileOffset = {};
    const sortHostiles = function(object) {
      return tower.pos.getRangeTo(object) + (hostileOffset[object.id] || 0);
    };

    const towersAttacking = _.sortBy(towers, (object) => {
      const hostile = object.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      return object.pos.getRangeTo(hostile);
    });

    for (tower of towersAttacking) {
      const hostilesSorted = _.sortBy(hostileCreeps, sortHostiles);
      tower.attack(hostilesSorted[0]);
      hostileOffset[hostilesSorted[0].id] = 100;
    }
    return true;
  }

  if (config.tower.healMyCreeps) {
    const myCreeps = this.findMyHealableCreeps();
    if (myCreeps.length > 0) {
      for (const tower of towers) {
        tower.heal(myCreeps[0]);
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

  const repairableStructures = (object) => object.hits < object.hitsMax / 2;

  for (const tower of towers) {
    if (tower.energy === 0) {
      continue;
    }
    if (!this.executeEveryTicks(10)) {
      if (tower.energy < tower.energyCapacity / 2 || this.memory.repair_min > 1000000) {
        continue;
      }
    }

    const lowRampart = tower.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART], {
      filter: (rampart) => rampart.hits < 10000,
    });

    let repair = lowRampart;
    if (lowRampart === null) {
      repair = tower.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_WALL, STRUCTURE_RAMPART], {
        inverse: true,
        filter: repairableStructures,
      });
      tower.repair(repair);
    }
  }
  return true;
};
