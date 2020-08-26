'use strict';

/**
 * posIsIn position is in array
 *
 * @param {object} pos - The position
 * @param {array} array - Array of positions
 * @return {boolean} - position is in array
 */
function posIsIn(pos, array) {
  if (!array) {
    return false;
  }

  for (const posCheck of array) {
    // TODO when does this happen?
    if (posCheck === null) {
      throw new Error();
      //      continue;
    }
    if (pos.x === posCheck.x && pos.y === posCheck.y) {
      return true;
    }
  }
  return false;
}

/**
 * destroyStructureWall - Destroys wall structures
 *
 * @param {object} structure - The structure
 * @return {boolean} If handled
 **/
Room.prototype.destroyStructureWall = function(structure) {
  if (!structure.hits) {
    return false;
  }
  if (!this.memory.walls) {
    return false;
  }
  if (!this.memory.walls.finished) {
    return false;
  }
  if (!structure.pos.inRamparts()) {
    for (const layerId of Object.keys(this.memory.walls.layer)) {
      const layer = this.memory.walls.layer[layerId];
      for (const pos of layer) {
        if (structure.pos.isEqualTo(pos.x, pos.y)) {
          return false;
        }
      }
    }
  }
  structure.destroy();
  return true;
};

Room.prototype.destroyStructureRoad = function(structure) {
  for (const pathName of Object.keys(this.getMemoryPaths())) {
    for (const pos of this.getMemoryPath(pathName)) {
      if (structure.pos.isEqualTo(pos.x, pos.y)) {
        return false;
      }
    }
  }
  structure.destroy();
  return true;
};

Room.prototype.buildRampartsAroundSpawns = function() {
  // Build ramparts around the spawn if wallThickness > 1
  // TODO this is not jused for a long time and the spawn positions should
  // be taken from `memory.positions.spawn`
  if (config.layout.wallThickness > 1) {
    const costMatrixBase = this.getMemoryCostMatrix();
    const spawns = this.findMySpawns();

    for (const spawn of spawns) {
      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          if (spawn.pos.x + x >= 0 && spawn.pos.y + y >= 0 && spawn.pos.x + x < 50 && spawn.pos.y + y < 50) {
            const pos = new RoomPosition(spawn.pos.x + x, spawn.pos.y + y, spawn.pos.roomName);
            this.memory.walls.ramparts.push(pos);
            costMatrixBase.set(pos.x, pos.y, 0);
            const walls = pos.findInRangePropertyFilter(FIND_STRUCTURES, 0, 'structureType', [STRUCTURE_WALL]);
            for (const wall of walls) {
              wall.destroy();
            }
          }
        }
      }
    }
    this.setMemoryCostMatrix(costMatrixBase);
  }
};

Room.prototype.destroyStructure = function(structure) {
  if (structure.structureType === STRUCTURE_WALL) {
    return this.destroyStructureWall(structure);
  }
  if (structure.structureType === STRUCTURE_ROAD) {
    return this.destroyStructureRoad(structure);
  }
  if (structure.structureType === STRUCTURE_RAMPART) {
    return false;
  }

  if (posIsIn(structure.pos, this.memory.position.structure[structure.structureType])) {
    return false;
  }

  const structures = this.findStructuresOfStructureType(structure.structureType);
  let structuresMin = 0;
  if (structure.structureType === STRUCTURE_SPAWN) {
    structuresMin = 1;
  }

  if (structures.length > structuresMin && (structure.my || Room.structureIsEmpty(structure)) && (structure.structureType !== STRUCTURE_STORAGE)) {
    structure.destroy();
    return true;
  }
  if (structure.structureType === STRUCTURE_SPAWN) {
    if (this.memory.misplacedSpawn) {
      if (this.storage && this.storage.store.energy > 20000) {
        const planers = this.findMyCreepsOfRole('planer');
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
    this.log(`Spawn [${structure.pos.x}, ${structure.pos.y}] is misplaced, not in positions (prototype_room_basebuilder.destroyStructure)`); // eslint-disable-line max-len
    this.memory.misplacedSpawn = true;

    this.buildRampartsAroundSpawns();
  }
  return false;
};

Room.prototype.checkPath = function() {
  //  this.log('checkPath: ' + this.memory.controllerLevel.checkPathInterval);

  const path = this.getMemoryPath('pathStart-harvester');
  if (!path) {
    this.log('Skipping checkPath, routing not initialized, try remove memory');
    this.clearMemory();
    return false;
  }
  for (const pos of path) {
    const roomPos = new RoomPosition(pos.x, pos.y, this.name);
    const structures = roomPos.lookFor('structure');

    for (const structure of structures) {
      if (structure.structureType === STRUCTURE_ROAD) {
        continue;
      }
      if (structure.structureType === STRUCTURE_RAMPART) {
        continue;
      }
      // console.log('checkPath: ' + pos);
      if (this.destroyStructure(structure)) {
        return true;
      }
    }
  }
  return false;
};

Room.prototype.checkWrongStructure = function() {
  this.debugLog('baseBuilding', 'checkWrongStructure: ' + this.memory.controllerLevel.checkWrongStructureInterval);
  if (this.memory.underSiege && this.controller.level >= 3) {
    this.log('checkWrongStructure: underSiege');
    return false;
  }

  // destroyStructure resets misplacedSpawn, so make sure we reach that point with the storage check
  if (this.memory.misplacedSpawn && (!this.storage || this.storage.store.energy < 20000)) {
    this.debugLog('baseBuilding', 'checkWrongStructures skipped - misplacedSpawn');
    return false;
  }

  // TODO Building up underSiege, maybe check for underSiege
  // if (this.controller.level < 6) {
  //  this.log('checkWrongStructure: controller.level < 6');
  //  return false;
  // }
  const structures = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_CONTROLLER], {inverse: true});
  for (const structure of structures) {
    if (this.destroyStructure(structure)) {
      return true;
    }
  }
  return false;
};

Room.prototype.clearPosition = function(pos, structure) {
  const posStructures = pos.lookFor('structure');
  let returnValue = false;
  for (const posStructureIndex of Object.keys(posStructures)) {
    const posStructure = posStructures[posStructureIndex];
    if (posStructure.structureType === STRUCTURE_ROAD) {
      continue;
    }
    if (posStructure.structureType === STRUCTURE_RAMPART) {
      continue;
    }
    if (posStructure.structureType === structure) {
      returnValue = {
        destoyed: false,
      };
      continue;
    }
    return this.destroyStructure(posStructure);
  }
  return returnValue;
};

Room.prototype.setupStructure = function(structure) {
  const structures = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [structure]);
  const constructionsites = this.findPropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [structure]);
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

  const diff = CONTROLLER_STRUCTURES[structure][this.controller.level] -
    (structures.length + constructionsites.length);
  if (diff <= 0) {
    return false;
  }

  for (const pos of (this.memory.position.structure[structure] || [])) {
    // TODO special case e.g. when powerSpawn can't be set on costmatrix.setup - need to be fixed there
    if (!pos) {
      continue;
    }
    const posObject = new RoomPosition(pos.x, pos.y, this.name);

    const clear = this.clearPosition(posObject, structure);
    if (clear) {
      if (clear.destoyed) {
        return true;
      } else {
        continue;
      }
    }

    const returnCode = posObject.createConstructionSite(structure);
    if (returnCode === OK) {
      return true;
    }
    if (returnCode === ERR_FULL) {
      this.debugLog('baseBuilding', 'setup createConstrustionSite too many constructionSites');
      return true;
    }
    if (returnCode === ERR_INVALID_TARGET) {
      continue;
    }
    if (returnCode === ERR_RCL_NOT_ENOUGH) {
      this.debugLog('baseBuilding', structure + ' ' + this.controller.level + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level]);
      this.debugLog('baseBuilding', 'setup createConstrustionSite ERR_RCL_NOT_ENOUGH structure: ' + structure + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level] + ' ' + structures.length + ' ' + constructionsites.length);
    }

    this.debugLog('baseBuilding', 'setup createConstrustionSite returnCode: ' + returnCode + ' structure: ' + structure);
  }
  return false;
};

Room.prototype.checkBuildStructureValidity = function() {
  if (!this.memory.position) {
    this.log('No position buildStructures');
    this.setup();
    return false;
  }

  if (!this.memory.position.structure) {
    return false;
  }

  if (!this.controller || this.controller === null || !this.controller.my) {
    this.log('No controller');
    return false;
  }

  if (Object.keys(Game.constructionSites).length >= 100) {
    return false;
  }
  return true;
};

Room.prototype.buildStructures = function() {
  if (!this.checkBuildStructureValidity()) {
    return false;
  }

  const constructionSites = this.findPropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_WALL, STRUCTURE_ROAD], {inverse: true});
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

  if (this.setupStructure(STRUCTURE_TERMINAL)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_LAB)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_NUKER)) {
    return true;
  }

  return false;
};

const structureExist = function(pos, structureType) {
  const structures = pos.lookFor(LOOK_STRUCTURES);
  for (const structure of structures) {
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
  if (!this.memory.walls || !this.memory.walls.layer) {
    this.debugLog('baseBuilding', 'checkBlockers: reset walls');
    this.memory.walls = {
      exit_i: 0,
      ramparts: [],
      layer_i: 0,
      // TODO as array?
      layer: {
        0: [],
      },
    };
  }

  for (const layer of Object.keys(this.memory.walls.layer)) {
    for (const blocker of this.memory.walls.layer[layer]) {
      const pos = new RoomPosition(blocker.x, blocker.y, this.name);

      let structureType = STRUCTURE_WALL;
      if (pos.inRamparts()) {
        structureType = STRUCTURE_RAMPART;
      }

      if (structureExist(pos, structureType)) {
        continue;
      }
      const returnCode = pos.createConstructionSite(structureType);
      if (returnCode !== OK && returnCode !== ERR_FULL) {
        // this.log('Build ' + structureType + ' at ' + pos + ' with ' + returnCode);
        return true;
      }
    }
  }
  return false;
};
