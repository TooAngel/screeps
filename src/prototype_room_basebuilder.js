'use strict';

function posIsIn(pos, array) {
  if (!array) {
    return false;
  }

  for (let posCheck of array) {
    // TODO when does this happen?
    if (posCheck === null) {
      console.log('Pos is not in array', pos, posCheck, JSON.stringify(array));
      throw new Error();
      //      continue;
    }
    if (pos.x === posCheck.x && pos.y === posCheck.y) {
      return true;
    }
  }
  return false;
}

Room.prototype.destroyStructure = function(structure) {
  if (structure.structureType === STRUCTURE_WALL) {
    if (!this.memory.walls) {
      return false;
    }
    if (!this.memory.walls.finished) {
      this.log('Wall setup not yet finished:' + structure.structureType + ' ' + JSON.stringify(structure.pos));
      return false;
    }
    if (!structure.pos.inRamparts()) {
      for (let layerId in this.memory.walls.layer) {
        let layer = this.memory.walls.layer[layerId];
        for (let pos of layer) {
          if (structure.pos.isEqualTo(pos.x, pos.y)) {
            return false;
          }
        }
      }
    }
    this.log('destroyStructure: wall not found in memory, destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos));
    structure.destroy();
    return true;
  }
  if (structure.structureType === STRUCTURE_ROAD) {
    for (let pathName in this.getMemoryPaths()) {
      for (let pos of this.getMemoryPath(pathName)) {
        if (structure.pos.isEqualTo(pos.x, pos.y)) {
          return false;
        }
      }
    }
    this.log('destroyStructure: not found in paths, destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos) + ' ' + JSON.stringify(Object.keys(this.getMemoryPaths())));
    structure.destroy();
    return true;
  }
  if (structure.structureType === STRUCTURE_RAMPART) {
    return false;
  }

  if (posIsIn(structure.pos, this.memory.position.structure[structure.structureType])) {
    return false;
  }
  let structures = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [structure.structureType]);
  let structuresMin = 0;
  if (structure.structureType === STRUCTURE_SPAWN) {
    structuresMin = 1;
  }

  if (structures.length > structuresMin && (structure.my || Room.structureIsEmpty(structure))) {
    this.log('Destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos));
    structure.destroy();
    return true;
  }
  this.log('Not destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos) + ' ' + structures.length + ' ' + structuresMin);
  if (structure.structureType === STRUCTURE_SPAWN) {
    if (this.memory.misplacedSpawn) {
      if (this.storage && this.storage.store.energy > 20000) {
        let planers = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['planer']);
        if (planers.length > 3) {
          this.log('Destroying to rebuild spawn: ' + structure.structureType + ' ' + JSON.stringify(structure.pos));
          this.log('-----------------------------------------');
          this.log('ATTENTION: The last spawn is destroyed, a new one will be build automatically, DO NOT RESPAWN');
          this.log('-----------------------------------------');
          structure.destroy();
          delete this.memory.misplacedSpawn;
          this.memory.controllerLevel.checkWrongStructureInterval = 1;
          delete this.memory.walls;
          return true;
        }
      }
      return false;
    }
    this.log('Set misplaced spawn');
    this.memory.misplacedSpawn = true;

    // Build ramparts around the spawn if wallThickness > 1
    if (config.layout.wallThickness > 1) {
      let costMatrixBase = this.getMemoryCostMatrix();
      let spawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
      let getWalls = function(object) {
        return object.structureType === STRUCTURE_WALL;
      };

      for (let spawn of spawns) {
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) {
            let pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, spawn.pos.roomName);
            this.memory.walls.ramparts.push(pos);
            costMatrixBase.set(pos.x, pos.y, 0);
            let walls = pos.findInRangePropertyFilter(FIND_STRUCTURES, 0, 'structureType', [STRUCTURE_WALL]);
            for (let wall of walls) {
              wall.destroy();
            }
          }
        }
      }
      this.setMemoryCostMatrix(costMatrixBase);
    }
  }
  return false;
};

Room.prototype.checkPath = function() {
  //  this.log('checkPath: ' + this.memory.controllerLevel.checkPathInterval);

  let path = this.getMemoryPath('pathStart-harvester');
  if (!path) {
    this.log('Skipping checkPath, routing not initialized');
    return false;
  }
  let filterSpawns = function(object) {
    return object.structureType === STRUCTURE_SPAWN;
  };
  for (let pos of path) {
    let roomPos = new RoomPosition(pos.x, pos.y, this.name);
    let structures = roomPos.lookFor('structure');

    for (let structure of structures) {
      if (structure.structureType === STRUCTURE_ROAD) {
        continue;
      }
      if (structure.structureType === STRUCTURE_RAMPART) {
        continue;
      }
      console.log('checkPath: ' + pos);
      if (this.destroyStructure(structure)) {
        return true;
      }
    }
  }
  return false;
};

Room.prototype.checkWrongStructure = function() {
  //  this.log('checkWrongStructure: ' + this.memory.controllerLevel.checkWrongStructureInterval);
  if (this.memory.underSiege && this.controller.level >= 3) {
    this.log('checkWrongStructure: underSiege');
    return false;
  }

  // destroyStructure resets misplacedSpawn, so make sure we reach that point with the storage check
  if (this.memory.misplacedSpawn && (!this.storage || this.storage.store.energy < 20000)) {
    this.log('checkWrongStructures skipped - misplacedSpawn');
    return false;
  }

  // TODO Building up underSiege, maybe check for underSiege
  //if (this.controller.level < 6) {
  //  this.log('checkWrongStructure: controller.level < 6');
  //  return false;
  //}
  let structures = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_CONTROLLER], true);
  for (let structure of structures) {
    if (this.destroyStructure(structure)) {
      return true;
    }
  }
  return false;
};

Room.prototype.clearPosition = function(pos, structure) {
  let posStructures = pos.lookFor('structure');
  let returnValue = false;
  for (let posStructureIndex in posStructures) {
    let posStructure = posStructures[posStructureIndex];
    if (posStructure.structureType === STRUCTURE_ROAD) {
      continue;
    }
    if (posStructure.structureType === STRUCTURE_RAMPART) {
      continue;
    }
    if (posStructure.structureType === structure) {
      returnValue = {
        destoyed: false
      };
      continue;
    }
    return this.destroyStructure(posStructure);
  }
  return returnValue;
};

Room.prototype.setupStructure = function(structure) {
  var structures = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [structure]);
  var constructionsites = this.findPropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [structure]);
  // Only build one spawn at a time, especially for reviving
  if (structure === STRUCTURE_SPAWN) {
    if (constructionsites.length > 0) {
      return true;
    }
  }

  // Complete storage before building something else - 2016-10-16
  if (structure === STRUCTURE_STORAGE) {
    if (constructionsites.length > 0) {
      return true;
    }
  }

  var diff = CONTROLLER_STRUCTURES[structure][this.controller.level] -
    (structures.length + constructionsites.length);
  if (diff <= 0) {
    return false;
  }

  var max = CONTROLLER_STRUCTURES[structure][this.controller.level];
  for (let pos of (this.memory.position.structure[structure] || [])) {
    // TODO special case e.g. when powerSpawn can't be set on costmatrix.setup - need to be fixed there
    if (!pos) {
      continue;
    }
    var posObject = new RoomPosition(pos.x, pos.y, this.name);

    let clear = this.clearPosition(posObject, structure);
    if (clear) {
      if (clear.destoyed) {
        return true;
      } else {
        continue;
      }
    }

    let returnCode = posObject.createConstructionSite(structure);
    if (returnCode === OK) {
      this.log('Build: ' + structure + ' ' + JSON.stringify(posObject));
      return true;
    }
    if (returnCode === ERR_FULL) {
      this.log('setup createConstrustionSite too many constructionSites');
      return true;
    }
    if (returnCode === ERR_INVALID_TARGET) {
      this.log('setup createConstrustionSite invalid target: ' + structure + ' ' + JSON.stringify(posObject));
      continue;
    }
    if (returnCode === ERR_RCL_NOT_ENOUGH) {
      this.log(structure + ' ' + this.controller.level + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level]);
      this.log('setup createConstrustionSite ERR_RCL_NOT_ENOUGH structure: ' + structure + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level] + ' ' + structures.length + ' ' + constructionsites.length);
    }

    this.log('setup createConstrustionSite returnCode: ' + returnCode + ' structure: ' + structure);
  }
  return false;
};

Room.prototype.buildStructures = function() {
  // TODO reduce noise
  // this.log('buildStructures: ' + this.memory.controllerLevel.buildStructuresInterval);
  if (!this.memory.position) {
    this.log('No position buildStructures');
    this.setup();
    return false;
  }

  if (!this.memory.position.structure) {
    this.log('No structure positions: ' + JSON.stringify(this.memory.position));
    return false;
  }

  if (this.controller === null || !this.controller.my) {
    this.log('No controller');
    return false;
  }

  if (Object.keys(Game.constructionSites).length >= 100) {
    return false;
  }

  let constructionSites = this.findPropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_ROAD], true);
  if (constructionSites.length > 0) {
    //    this.log('basebuilder.setup: Too many construction sites');
    return true;
  }

  if (this.setupStructure('spawn')) {
    return true;
  }
  if (this.setupStructure(STRUCTURE_TOWER)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_STORAGE)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_LINK)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_EXTENSION)) {
    return true;
  }

  if (!this.storage || this.findPropertyFilter(FIND_MY_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_LINK]).length > 0) {
    return false;
  }
  if (this.setupStructure(STRUCTURE_POWER_SPAWN)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_EXTRACTOR)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_OBSERVER)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_LAB)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_TERMINAL)) {
    return true;
  }
  if (this.setupStructure(STRUCTURE_NUKER)) {
    return true;
  }

  return false;
};

let structureExist = function(pos, structureType) {
  let structures = pos.lookFor(LOOK_STRUCTURES);
  for (let structure of structures) {
    if (structure.structureType === structureType) {
      return true;
    }
  }
  return false;
};

Room.prototype.checkBlockers = function() {
  if (this.controller.level === 1) {
    return false;
  }
  //  this.log('checkBlockers: ' + this.memory.controllerLevel.checkBlockersInterval + ' ' + this.controller.level + ' ' + this.memory.walls);
  if (this.controller.level >= 2 && (!this.memory.walls || !this.memory.walls.layer)) {
    this.log('checkBlockers: reset walls');
    this.memory.walls = {
      exit_i: 0,
      ramparts: [],
      layer_i: 0,
      // TODO as array?
      layer: {
        0: []
      }
    };
  }

  for (let layer in this.memory.walls.layer) {
    for (let blocker of this.memory.walls.layer[layer]) {
      let pos = new RoomPosition(blocker.x, blocker.y, this.name);

      let structureType = STRUCTURE_WALL;
      if (pos.inRamparts()) {
        structureType = STRUCTURE_RAMPART;
      }

      if (structureExist(pos, structureType)) {
        continue;
      }
      let returnCode = pos.createConstructionSite(structureType);
      if (returnCode != OK && returnCode != ERR_FULL) {
        // this.log('Build ' + structureType + ' at ' + pos + ' with ' + returnCode);
        return true;
      }
    }
  }
  return false;
};
