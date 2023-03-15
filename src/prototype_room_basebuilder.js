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
    const flags = this.find(FIND_FLAGS, {
      filter: function(flag) {
        return flag.name.startsWith('allowWall');
      },
    });
    for (const flag of flags) {
      if (structure.pos.isEqualTo(flag.pos)) {
        return false;
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
  const flags = this.find(FIND_FLAGS, {
    filter: function(flag) {
      return flag.name.startsWith('allowRoad');
    },
  });
  for (const flag of flags) {
    if (structure.pos.isEqualTo(flag.pos)) {
      return false;
    }
  }
  structure.destroy();
  return true;
};

Room.prototype.buildRampartsAroundSpawns = function() {
  // Build ramparts around the spawn if wallThickness > 1
  // TODO this is not used for a long time and the spawn positions should
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

            const walls = pos.findInRangeWall(0);
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

/**
 * destroyStructureSpawn
 *
 * @param {object} room
 * @param {object} structure
 * @return {boolean}
 */
function destroyStructureSpawn(room, structure) {
  const spawnsCount = room.findMySpawns().length;
  if (room.memory.misplacedSpawn) {
    if (spawnsCount < config.myRoom.leastSpawnsToRebuildStructureSpawn) {
      room.memory.misplacedSpawn = false;
      return false;
    }
    if (room.storage && room.storage.store.energy > 20000) {
      const builders = room.findMyCreepsOfRole('builder');
      if (builders.length > 3) {
        room.log('Destroying to rebuild spawn: ' + structure.structureType + ' ' + JSON.stringify(structure.pos));
        room.log('-----------------------------------------');
        room.log('ATTENTION: The last spawn is destroyed, a new one will be build automatically, DO NOT RESPAWN');
        room.log('-----------------------------------------');
        structure.destroy();
        delete room.memory.misplacedSpawn;
        room.memory.controllerLevel.checkWrongStructureInterval = 1;
        delete room.memory.walls;
        return true;
      }
    }
    return false;
  }
  room.log(`Spawn [${structure.pos.x}, ${structure.pos.y}] is misplaced, not in positions (prototype_room_basebuilder.destroyStructure), spawnsCount be ${spawnsCount}`); // eslint-disable-line max-len
  room.memory.misplacedSpawn = spawnsCount > config.myRoom.leastSpawnsToRebuildStructureSpawn;

  room.buildRampartsAroundSpawns();
  return false;
}

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
  if (structure.structureType === STRUCTURE_CONTAINER) {
    return false;
  }
  if (posIsIn(structure.pos, this.data.positions.structure[structure.structureType])) {
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
    return destroyStructureSpawn(this, structure);
  }
  return false;
};

Room.prototype.checkPath = function() {
  //  this.log('checkPath: ' + this.memory.controllerLevel.checkPathInterval);
  const path = this.getMemoryPath('pathStart-universal');
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
  const structures = this.findStructuresToDestroy();
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
        destroyed: false,
      };
      continue;
    }
    return this.destroyStructure(posStructure);
  }
  return returnValue;
};

/**
 * setupStructureFinishPriorityStructures
 *
 * @param {object} structure
 * @param {array} constructionSites
 * @return {boolean}
 */
function setupStructureFinishPriorityStructures(structure, constructionSites) {
  // Only build one spawn at a time, especially for reviving
  if (structure === STRUCTURE_SPAWN) {
    if (constructionSites.length > 0) {
      return true;
    }
  }

  // Complete storage before building something else
  if (structure === STRUCTURE_STORAGE) {
    if (constructionSites.length > 0) {
      return true;
    }
  }
}

Room.prototype.setupStructure = function(structure) {
  const constructionSites = this.find(FIND_CONSTRUCTION_SITES, {filter: (object) => object.structureType === structure});
  if (setupStructureFinishPriorityStructures(structure, constructionSites)) {
    return true;
  }

  const structures = this.find(FIND_MY_STRUCTURES, {filter: (object) => object.structureType === structure});
  const diff = CONTROLLER_STRUCTURES[structure][this.controller.level] -
    (structures.length + constructionSites.length);
  if (diff <= 0) {
    return false;
  }
  for (const pos of (this.data.positions.structure[structure] || [])) {
    // TODO special case e.g. when powerSpawn can't be set on CostMatrix.setup - need to be fixed there
    if (!pos) {
      continue;
    }
    const posObject = new RoomPosition(pos.x, pos.y, this.name);

    const clear = this.clearPosition(posObject, structure);
    if (clear) {
      if (clear.destroyed) {
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
      this.debugLog('baseBuilding', 'setup createConstructionSite too many constructionSites');
      return true;
    }
    if (returnCode === ERR_INVALID_TARGET) {
      continue;
    }
    if (returnCode === ERR_RCL_NOT_ENOUGH) {
      this.debugLog('baseBuilding', structure + ' ' + this.controller.level + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level]);
      this.debugLog('baseBuilding', 'setup createConstructionSite ERR_RCL_NOT_ENOUGH structure: ' + structure + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level] + ' ' + structures.length + ' ' + constructionSites.length);
    }

    this.debugLog('baseBuilding', 'setup createConstructionSite returnCode: ' + returnCode + ' structure: ' + structure);
  }
  return false;
};

Room.prototype.checkBuildStructureValidity = function() {
  if (!this.data.positions) {
    this.log('No position buildStructures');
    this.setup();
    return false;
  }

  if (!this.data.positions.structure) {
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

  const constructionSites = this.findBuildingConstructionSites();
  if (constructionSites.length > 0) {
    //    this.log('baseBuilder.setup: Too many construction sites');
    return true;
  }

  const beforeStorage = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_LINK, STRUCTURE_EXTENSION];
  for (const structure of beforeStorage) {
    if (this.setupStructure(structure)) {
      return true;
    }
  }

  if (!this.storage || this.findConstructionSiteLink().length > 0) {
    return false;
  }

  const afterStorage = [STRUCTURE_POWER_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_OBSERVER, STRUCTURE_TERMINAL, STRUCTURE_LAB, STRUCTURE_NUKER];
  for (const structure of afterStorage) {
    if (this.setupStructure(structure)) {
      return true;
    }
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
