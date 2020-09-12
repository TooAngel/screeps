// TODO I think we should get rid of findPropertyFilter and have specific finds
// like this
Room.prototype.findOtherPlayerCreeps = function() {
  return this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Invader'], {inverse: true});
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

Room.prototype.findSpawnableSpawns = function() {
  return this.find(FIND_MY_SPAWNS, {
    filter: (spawn) => !spawn.spawning,
  });
};

Room.prototype.findNukes = function() {
  return this.find(FIND_NUKES);
};

Room.prototype.findEnemys = function() {
  return this.find(FIND_HOSTILE_CREEPS, {
    // TODO `brain.isFriend` extract to a module and import via require
    filter: (object) => !brain.isFriend(object.owner.username),
  });
};

Room.prototype.findHealableAlliedCreeps = function() {
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

Room.prototype.findMyHealableCreeps = function() {
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
