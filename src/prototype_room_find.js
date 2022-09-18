// TODO I think we should get rid of findPropertyFilter and have specific finds
// like this
Room.prototype.findOtherPlayerCreeps = function() {
  return this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', global.maliciousNpcUsernames, {inverse: true});
};

Room.prototype.findObservers = function() {
  return this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_OBSERVER}});
};

Room.prototype.findMySpawns = function() {
  return this.find(FIND_MY_SPAWNS);
};

Room.prototype.findMyCreeps = function() {
  return this.find(FIND_MY_CREEPS);
};

Room.prototype.findStructures = function() {
  return this.find(FIND_STRUCTURES);
};

Room.prototype.findMyStructures = function() {
  return this.find(FIND_MY_STRUCTURES);
};

Room.prototype.findConstructionSites = function() {
  return this.find(FIND_CONSTRUCTION_SITES);
};

Room.prototype.findSources = function() {
  return this.find(FIND_SOURCES);
};

Room.prototype.findMinerals = function() {
  return this.find(FIND_MINERALS);
};

Room.prototype.findSpawnsNotSpawning = function() {
  return this.find(FIND_MY_SPAWNS, {
    filter: (spawn) => !spawn.spawning,
  });
};

Room.prototype.findNukes = function() {
  return this.find(FIND_NUKES);
};

Room.prototype.findEnemies = function() {
  return this.find(FIND_HOSTILE_CREEPS, {
    // TODO `brain.isFriend` extract to a module and import via require
    filter: (object) => !brain.isFriend(object.owner.username),
  });
};

Room.prototype.findAlliedCreepsToHeal = function() {
  return this.find(FIND_HOSTILE_CREEPS, {
    filter: (object) => {
      if (object.hits === object.hitsMax) {
        return false;
      }
      if (brain.isFriend(object.owner.username)) {
        return true;
      }
      return false;
    },
  });
};

Room.prototype.findMyCreepsToHeal = function() {
  return this.find(FIND_MY_CREEPS, {
    filter: (object) => object.hits < object.hitsMax,
  });
};

Room.prototype.findHostileAttackingCreeps = function() {
  return this.find(FIND_HOSTILE_CREEPS, {
    // TODO unify the filter better
    filter: this.findAttackCreeps,
  });
};

Room.prototype.findInvaderCore = function() {
  return this.find(FIND_HOSTILE_STRUCTURES, {
    filter: {structureType: STRUCTURE_INVADER_CORE},
  },
  );
};

Room.prototype.findStructuresOfStructureType = function(structureType) {
  return this.find(FIND_STRUCTURES, {
    filter: {structureType: structureType},
  },
  );
};

Room.prototype.findMyCreepsOfRole = function(role) {
  return this.find(FIND_MY_CREEPS, {
    filter: (object) => object.memory && object.memory.role === role,
  });
};

Room.prototype.findSourceKeepersStructures = function() {
  return this.find(FIND_HOSTILE_STRUCTURES, {
    filter: (object) => object.owner.username === 'Source Keeper',
  });
};

Room.prototype.findDefenseStructures = function() {
  return this.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return [STRUCTURE_WALL, STRUCTURE_RAMPART].indexOf(structure.structureType) > -1;
    },
  });
};

Room.prototype.findPowerBanks = function() {
  return this.find(FIND_STRUCTURES, {
    filter: {structureType: STRUCTURE_POWER_BANK},
  });
};

Room.prototype.findDestructibleStructures = function() {
  return this.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_CONTAINER, STRUCTURE_INVADER_CORE].indexOf(structure.structureType) < 0;
    },
  });
};

Room.prototype.findTowers = function() {
  return this.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
};

Room.prototype.findLabs = function() {
  return this.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_LAB}});
};
