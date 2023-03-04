'use strict';

// TODO this does not need to be on the Room object
Room.prototype.setPosition = function(type, pos, value = config.layout.structureAvoid, positionType = 'structure', firstStructure = false) {
  this.debugLog('baseBuilding', `Increasing ${pos} ${type} ${positionType} with ${value}`);

  // New implementation
  if (!this.data.positions[positionType]) {
    this.data.positions[positionType] = {};
  }
  if (!this.data.positions[positionType][type]) {
    this.data.positions[positionType][type] = [];
  }
  if (firstStructure) {
    this.data.positions[positionType][type].unshift(pos);
  } else {
    this.data.positions[positionType][type].push(pos);
  }

  this.increaseCostMatrixValue(this.data.costMatrix, pos, value);
};

Room.prototype.initSetController = function() {
  if (this.controller) {
    const upgraderPos = this.controller.pos.getBestNearPosition({ignorePositions: true, ignorePath: true});
    this.setPosition(this.controller.id, upgraderPos, config.layout.creepAvoid, 'creep', false);
  }
};

Room.prototype.initSetSources = function() {
  const sources = this.findSources();
  for (const source of sources) {
    const sourcer = source.pos.getFirstNearPosition({ignorePath: true});
    if (!sourcer) {
      this.log(`initSetSources, can't find position ${JSON.stringify(source.pos)}`);
      continue;
    }
    this.setPosition(source.id, sourcer, config.layout.creepAvoid, 'creep');
    this.setPosition(STRUCTURE_LINK, sourcer.getFirstNearPosition());
  }
};

Room.prototype.initSetMinerals = function() {
  const minerals = this.findMinerals();
  for (const mineral of minerals) {
    // const extractor = mineral.pos.getFirstNearPosition();
    const extractor = mineral.pos.getBestNearPosition();
    this.setPosition(mineral.id, extractor, config.layout.creepAvoid, 'creep');
    this.setPosition(STRUCTURE_EXTRACTOR, mineral.pos, config.layout.structureAvoid);
  }
};

Room.prototype.initSetStorageAndPathStart = function() {
  const upgraderPos = this.data.positions.creep[this.controller.id][0];
  const storagePos = upgraderPos.getBestNearPosition({ignorePath: true});
  this.setPosition(STRUCTURE_STORAGE, storagePos);
  this.debugLog('baseBuilding', `Storage position ${storagePos} costMatrix value before path ${this.data.costMatrix.get(storagePos.x, storagePos.y)}`);
  // TODO Why is this 'Worse'?
  this.data.positions.creep.pathStart = [storagePos.getWorseNearPosition({ignorePath: true})];

  const route = [{
    room: this.name,
  }];
  const pathUpgrader = this.getPath(route, 0, 'pathStart', this.controller.id, true);
  this.setCostMatrixPath(this.data.costMatrix, pathUpgrader);
  this.debugLog('baseBuilding', `Upgrader position ${upgraderPos} costMatrix value after path ${this.data.costMatrix.get(upgraderPos.x, upgraderPos.y)}`);
  return {
    storagePos: storagePos,
    route: route,
  };
};

Room.prototype.setFillerArea = function(storagePos, route) {
  const fillerPos = storagePos.getBestNearPosition();
  this.setPosition('filler', fillerPos, config.layout.creepAvoid, 'creep');
  this.debugLog('baseBuilding', `Filler position ${fillerPos} costMatrix value before path ${this.data.costMatrix.get(fillerPos.x, fillerPos.y)}`);

  const pathFiller = this.getPath(route, 0, 'pathStart', 'filler', true);
  this.setCostMatrixPath(this.data.costMatrix, pathFiller);
  this.debugLog('baseBuilding', `Filler position ${fillerPos} costMatrix value after path ${this.data.costMatrix.get(fillerPos.x, fillerPos.y)}`);

  const fillerNearPositions = Array.from(fillerPos.findNearPosition());
  if (fillerNearPositions.length < 1) {
    this.clearMemory();
    throw new Error(`Can't set layout for room ${this.name}. Not enough space for filler area`);
  }

  const linkStoragePos = fillerNearPositions.shift();
  this.setPosition(STRUCTURE_LINK, linkStoragePos, config.layout.structureAvoid, 'structure', true);

  try {
    this.setPosition(STRUCTURE_POWER_SPAWN, fillerNearPositions.shift());

    this.setPosition(STRUCTURE_TOWER, fillerNearPositions.shift());
  } catch (e) {
    console.log(e.stack);
  }
};

Room.prototype.addTerminal = function() {
  const minerals = this.findMinerals();
  const extractorPosOrg = this.data.positions.creep[minerals[0].id][0];
  const extractorPos = new RoomPosition(extractorPosOrg.x, extractorPosOrg.y, extractorPosOrg.roomName);
  const getNearPathPos = (pos) => Array.from(pos.getAllAdjacentPositions()).find((p) => p.inPath() && !p.inPositions());
  try {
    for (const terminalPos of extractorPos.findNearPosition()) {
      const nearPathPos = getNearPathPos(terminalPos);
      if (nearPathPos) {
        this.setPosition(STRUCTURE_TERMINAL, terminalPos);
        this.debugLog('baseBuilding', 'set terminal in free spot');
        return;
      }
    }
  } catch (e) {
    this.log(`${e} ${JSON.stringify(extractorPos)} ${typeof extractorPos} ${JSON.stringify(extractorPosOrg)} ${typeof extractorPosOrg} ${extractorPos.findNearPosition}`);
  }
  this.log(`Can't find a position for the terminal`);
  return;
};

Room.prototype.updatePosition = function() {
  // this.debugLog('routing', 'updatePosition called');
  // this.debugLog('routing', `room.data: ${JSON.stringify(this.data)}`);
  // TODO don't like to delete it here: after deploy some are set (by getPath/buildPath) before the costMatrix is built
  this.data.positions = {creep: {}, structure: {}};
  this.data.costMatrix = this.getCostMatrix();
  this.initSetController();
  this.initSetSources();
  this.initSetMinerals();

  if (this.isMy()) {
    const startPos = this.initSetStorageAndPathStart();
    this.costMatrixSetSourcePath();
    this.setFillerArea(startPos.storagePos, startPos.route);
    const upgraderPos = this.data.positions.creep[this.controller.id][0];
    this.debugLog('baseBuilding', `Upgrader position ${upgraderPos} costMatrix value after setFillerArea ${this.data.costMatrix.get(upgraderPos.x, upgraderPos.y)}`);
  }
};

Room.prototype.setLabs = function(allPaths) {
  let lab1Pos;
  let lab2Pos;
  let pathI;
  let path;
  const validResultLabPosition = (p) => {
    return !p.isEqualTo(lab1Pos) && !p.isEqualTo(lab2Pos) && p.inRangeTo(lab2Pos, 2) && p.validPosition() &&
      path.slice(Math.max(0, pathI - 3), Math.min(path.length - 1, pathI + 3)).some((pp) => p.isNearTo(pp.x, pp.y));
  };

  const pathImax = this.getMemoryPath(allPaths[allPaths.length - 1].name).length;

  for (pathI = 1; pathI < pathImax; ++pathI) {
    for (const {name: pathName} of allPaths) {
      path = this.getMemoryPath(pathName);
      if (path.length <= pathI) {
        continue;
      }
      const pathPos = RoomPosition.fromJSON(path[pathI]);
      if ((this.data.positions.structure.lab || []).length === 0) {
        const nextDir = pathPos.getDirectionTo(path[pathI - 1].x, path[pathI - 1].y);
        if (nextDir % 2 === 1) { // Skip non-diagonal path section
          continue;
        }
        lab1Pos = pathPos.getAdjacentPosition(nextDir + 1);
        lab2Pos = pathPos.getAdjacentPosition(nextDir + 7);
        if (!lab1Pos.validPosition() || !lab2Pos.validPosition()) {
          continue;
        }
        const labResultPoss = Array.from(lab1Pos.getAllPositionsInRange(2)).filter(validResultLabPosition);
        if (labResultPoss.length < CONTROLLER_STRUCTURES.lab[8] - 2) {
          continue;
        }
        this.setPosition(STRUCTURE_LAB, lab1Pos);
        this.setPosition(STRUCTURE_LAB, lab2Pos);
        for (const pos of labResultPoss) {
          if (this.data.positions.structure.lab.length < CONTROLLER_STRUCTURES.lab[8]) {
            this.setPosition(STRUCTURE_LAB, pos);
          }
        }
        this.debugLog('baseBuilding', 'All labs set: ' + pathI);
        return;
      }
    }
  }
};

Room.prototype.checkPositions = function() {
  for (const type of [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_LINK, STRUCTURE_OBSERVER, STRUCTURE_NUKER, STRUCTURE_FACTORY]) {
    if ((this.data.positions.structure[type] || []).length < CONTROLLER_STRUCTURES[type][8]) {
      let output = 'Structures not found:\n';
      for (const type of Object.keys(this.data.positions.structure)) {
        output += `${type}: ${this.data.positions.structure[type].length}\n`;
      }
      this.log(output);
      return true;
    }
  }
  return false;
};

Room.prototype.setExtensionPos = function(structurePos, pathI) {
  this.setPosition('extension', structurePos, config.layout.structureAvoid);
  if (!this.data.positions.pathEndLevel) {
    this.data.positions.pathEndLevel = [0];
  }
  if (CONTROLLER_STRUCTURES.extension[this.data.positions.pathEndLevel.length] <= this.data.positions.structure.extension.length) {
    this.data.positions.pathEndLevel.push(pathI);
  }
};

Room.prototype.areEnergyStructuresPlaced = function() {
  return this.data.positions.structure.spawn.length < CONTROLLER_STRUCTURES.spawn[8] &&
    this.data.positions.structure.extension.length < CONTROLLER_STRUCTURES.extension[8];
};

Room.prototype.setPositionAux = function(structurePos) {
  for (const type of [STRUCTURE_TOWER, STRUCTURE_NUKER, STRUCTURE_OBSERVER, STRUCTURE_LINK, STRUCTURE_FACTORY]) {
    if ((this.data.positions.structure[type] || []).length < CONTROLLER_STRUCTURES[type][8]) {
      this.setPosition(type, structurePos, config.layout.structureAvoid);
      return true;
    }
  }
  return false;
};

Room.prototype.setStructuresIteratePos = function(structurePos, pathI, path) {
  if (structurePos.setSpawn(path, pathI)) {
    this.setPosition('spawn', structurePos, config.layout.structureAvoid);
    return true;
  }
  if (structurePos.setExtension()) {
    this.setExtensionPos(structurePos, pathI);
    return true;
  }
  if (this.areEnergyStructuresPlaced()) {
    return true;
  }

  if (this.setPositionAux(structurePos)) {
    return true;
  }

  if (this.checkPositions()) {
    return true;
  }

  this.data.positions.pathEnd = structurePos;
  this.debugLog('baseBuilding', 'All structures set: ' + pathI);
  return false;
};

Room.prototype.setStructures = function(path) {
  for (let pathI = 0; pathI < path.length; pathI++) {
    const pathPos = new RoomPosition(path[pathI].x, path[pathI].y, this.name);
    const structurePosIterator = pathPos.findNearPosition();
    for (const structurePos of structurePosIterator) {
      if (this.controller && this.controller.my && this.controller.pos.isNearTo(structurePos)) {
        continue;
      }
      if (this.setStructuresIteratePos(structurePos, pathI, path)) {
        continue;
      }
      return pathI;
    }
  }

  return -1;
};

Room.prototype.costMatrixSetSourcePath = function() {
  const sources = this.findSources();
  for (const source of sources) {
    const route = [{
      room: this.name,
    }];
    const path = this.getPath(route, 0, 'pathStart', source.id, true);
    this.setCostMatrixPath(this.data.costMatrix, path);
    this.setCostMatrixAvoidSources(this.data.costMatrix);
    const sourcer = this.data.positions.creep[source.id];
    this.data.costMatrix.set(sourcer.x, sourcer.y, config.layout.creepAvoid);
  }
};

Room.prototype.costMatrixSetMineralPath = function() {
  const minerals = this.findMinerals();
  for (const mineral of minerals) {
    const route = [{
      room: this.name,
    }];
    const path = this.getPath(route, 0, 'pathStart', mineral.id, true);
    this.setCostMatrixPath(this.data.costMatrix, path);
  }
};

Room.prototype.costMatrixPathFromStartToExit = function(exits) {
  return () => {
    for (const endDir in exits) {
      if (!endDir) {
        continue;
      }
      const end = exits[endDir];
      const route = [{
        room: this.name,
      }, {
        room: end,
      }];
      const path = this.getPath(route, 0, 'pathStart', undefined, true);
      this.setCostMatrixPath(this.data.costMatrix, path);
    }
  };
};

Room.prototype.costMatrixPathCrossings = function(exits) {
  return () => {
    for (const startDir in exits) {
      if (!startDir) {
        continue;
      }
      const start = exits[startDir];
      for (const endDir in exits) {
        if (!endDir) {
          continue;
        }
        const end = exits[endDir];
        if (start === end) {
          continue;
        }
        const route = [{
          room: start,
        }, {
          room: this.name,
        }, {
          room: end,
        }];
        const path = this.getPath(route, 1, undefined, undefined, true);
        this.setCostMatrixPath(this.data.costMatrix, path);
      }
    }
  };
};

const checkForSurroundingWalls = function(pos, valueAdd) {
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      if (pos.x + x >= 0 && pos.y + y >= 0 && pos.x + x < 50 && pos.y + y < 50) {
        const wall = new RoomPosition(pos.x + x, pos.y + y, pos.roomName);
        if (wall.checkForWall()) {
          valueAdd *= 0.5; // TODO some factor
        }
      }
    }
  }
  return valueAdd;
};

/**
 * checkForSpawnPosition - Checks if the position is in the
 * `memory.position.structure.spawn`.
 *
 * @param {object} pos - The position to check against memory
 * @return {boolean} - If pos is a spawn position
 **/
Room.prototype.checkForSpawnPosition = function(pos) {
  for (const spawnPos of this.data.positions.structure.spawn) {
    if (spawnPos.x === pos.x && spawnPos.y === pos.y) {
      return true;
    }
  }
  return false;
};

/**
 * checkForMisplacedSpawn - Compares the current spawn structures positions
 * with the positions for spawns in memory.
 * If a spawn is on an unknown position `room.memory.misplacedSpawn` is set
 * to true.
 *
 * @return {undefined}
 **/
Room.prototype.checkForMisplacedSpawn = function() {
  const spawns = this.findMySpawns();
  const spawnsCount = spawns.length;
  if (spawnsCount < config.myRoom.leastSpawnsToRebuildStructureSpawn) {
    return;
  }
  for (const spawn of spawns) {
    if (!this.checkForSpawnPosition(spawn.pos)) {
      this.log('Setting misplacedSpawn');
      this.memory.misplacedSpawn = true;
    }
  }
};

/**
 * getPathLength
 *
 * find longest path, calculate vert-/horizontal as 2 (new structures) and diagonal as 4
 *
 * @param {object} pathObject
 * @return {number}
 */
function getPathLength(pathObject) {
  let lastPos;
  let value = 0;
  for (const pos of pathObject.path) {
    let valueAdd = 0;
    if (!lastPos) {
      lastPos = new RoomPosition(pos.x, pos.y, pos.roomName);
      continue;
    }
    const direction = lastPos.getDirectionTo(pos.x, pos.y, pos.roomName);
    if (direction % 2 === 0) {
      valueAdd += 2;
    } else {
      valueAdd += 4;
    }

    value += checkForSurroundingWalls(pos, valueAdd);
    lastPos = new RoomPosition(pos.x, pos.y, pos.roomName);
  }
  return value;
}


Room.prototype.setupStructures = function() {
  const pathsController = _.filter(this.getMemoryPaths(), (object, key) => {
    return key.startsWith('pathStart-');
  });
  const pathsSorted = _.sortBy(pathsController, getPathLength);
  const path = this.getMemoryPath(pathsSorted[pathsSorted.length - 1].name);
  let pathI = this.setStructures(path);
  this.setLabs(pathsSorted);
  this.debugLog('baseBuilding', 'path: ' + pathsSorted[pathsSorted.length - 1].name + ' pathI: ' + pathI + ' length: ' + path.length);
  if (pathI === -1) {
    pathI = path.length - 1;
  }
  this.setMemoryPath('pathStart-universal', path.slice(0, pathI + 1), false);
  this.data.positions.version = config.layout.version;
};

Room.prototype.stepExecute = function(func, name) {
  if (!this.memory.setup.steps[name]) {
    func.bind(this)();
  }
  this.memory.setup.steps[name] = true;
  if (Game.cpu.getUsed() >= Game.cpu.limit) {
    return false;
  }
  return true;
};

Room.prototype.cleanupMemory = function() {
  delete this.memory.walls;
  delete this.memory.constants;
  delete this.memory.routing;
  delete this.memory.position;

  this.data.positions = {};
  this.data.routing = {};
  this.data.costMatrix = {};
  this.data.created = Game.time;
};

Room.prototype.setupFinalize = function() {
  this.log('Setup complete - storing data');
  this.memory.setup.completed = true;
  this.memory.position = this.data.positions;
  this.memory.routing = {};
  for (const pathName of Object.keys(this.data.routing)) {
    const item = this.data.routing[pathName];
    const memoryData = {
      path: Room.pathToString(item.path),
      created: item.created,
      fixed: item.fixed,
      name: item.name,
    };
    this.memory.routing[pathName] = memoryData;
  }
  this.setMemoryCostMatrix(this.data.costMatrix);
  this.log('Setup completed - storing data');
};

Room.prototype.setup = function() {
  this.debugLog('baseBuilding', `Setup`);
  if (this.memory.setup) {
    if (this.memory.setup.completed) {
      throw new Error('Setup called, while it was already completed');
    }
  }
  this.memory.setup = this.memory.setup || {steps: {}};

  for (const step of ['cleanupMemory', 'updatePosition']) {
    if (!this.stepExecute(this[step], step)) {
      return false;
    }
  }

  if (!this.controller) {
    this.log('Setup called without controller');
    return;
  }
  if (!this.stepExecute(this.costMatrixSetMineralPath, 'costMatrixSetMineralPath')) {
    return false;
  }
  const exits = Game.map.describeExits(this.name);
  if (!this.stepExecute(this.costMatrixPathFromStartToExit(exits), 'costMatrixPathFromStartToExit')) {
    return false;
  }

  if (!this.stepExecute(this.costMatrixPathCrossings(exits), 'costMatrixPathCrossings')) {
    return false;
  }

  for (const step of ['addTerminal', 'setupStructures', 'checkForMisplacedSpawn']) {
    if (!this.stepExecute(this[step], step)) {
      return false;
    }
  }

  this.setupFinalize();
  return true;
};
