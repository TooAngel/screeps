'use strict';

Room.prototype.initSetController = function() {
  if (this.controller) {
    const upgraderPos = this.controller.pos.getBestNearPosition({ignorePositions: true, ignorePath: true});
    this.setPosition(this.controller.id, upgraderPos, config.layout.creepAvoid, 'creep');
  }
};

Room.prototype.initSetSources = function() {
  const sources = this.findSources();
  for (const source of sources) {
    const sourcer = source.pos.getFirstNearPosition({ignorePath: true});
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
  let costMatrix = this.getMemoryCostMatrix();
  const upgraderPos = this.memory.position.creep[this.controller.id][0];
  const storagePos = upgraderPos.getBestNearPosition({ignorePath: true});
  this.setPosition(STRUCTURE_STORAGE, storagePos);
  costMatrix = this.getMemoryCostMatrix();
  this.debugLog('baseBuilding', `Storage position ${storagePos} costMatrix value before path ${costMatrix.get(storagePos.x, storagePos.y)}`);
  this.memory.position.creep.pathStart = [storagePos.getWorseNearPosition({ignorePath: true})];

  const route = [{
    room: this.name,
  }];
  const pathUpgrader = this.getPath(route, 0, 'pathStart', this.controller.id, true);
  this.setCostMatrixPath(costMatrix, pathUpgrader);
  this.setMemoryCostMatrix(costMatrix);
  this.debugLog('baseBuilding', `Upgrader position ${upgraderPos} costMatrix value after path ${costMatrix.get(upgraderPos.x, upgraderPos.y)}`);
  return {
    storagePos: storagePos,
    route: route,
  };
};

Room.prototype.setFillerArea = function(storagePos, route) {
  let costMatrix = this.getMemoryCostMatrix();

  const fillerPos = storagePos.getBestNearPosition();
  this.setPosition('filler', fillerPos, config.layout.creepAvoid, 'creep');
  costMatrix = this.getMemoryCostMatrix();
  this.debugLog('baseBuilding', `Filler position ${fillerPos} costMatrix value before path ${costMatrix.get(fillerPos.x, fillerPos.y)}`);

  const pathFiller = this.getPath(route, 0, 'pathStart', 'filler', true);
  this.setCostMatrixPath(costMatrix, pathFiller);
  this.setMemoryCostMatrix(costMatrix);
  this.debugLog('baseBuilding', `Filler position ${fillerPos} costMatrix value after path ${costMatrix.get(fillerPos.x, fillerPos.y)}`);

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
  const extractorPosOrg = this.memory.position.creep[minerals[0].id][0];
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
    console.log(`${e} ${JSON.stringify(extractorPos)} ${typeof extractorPos} ${JSON.stringify(extractorPosOrg)} ${typeof extractorPosOrg} ${extractorPos.findNearPosition}`);
  }
  this.log(`Can't find a position for the terminal`);
  return;
};

Room.prototype.updatePosition = function() {
  this.checkCache();
  delete this.memory.routing;
  delete this.memory.summaryCenter;

  const costMatrixBase = this.getCostMatrix();
  this.setMemoryCostMatrix(costMatrixBase);
  this.memory.position = {
    creep: {},
  };
  this.memory.position.structure = {
    storage: [],
    spawn: [],
    extension: [],
    tower: [],
    link: [],
    observer: [],
    lab: [],
    terminal: [],
    nuker: [],
    powerSpawn: [],
    extractor: [],
  };

  this.initSetController();
  this.initSetSources();
  this.initSetMinerals();

  if (this.controller && this.controller.my) {
    const startPos = this.initSetStorageAndPathStart();

    this.costMatrixSetSourcePath();
    this.setFillerArea(startPos.storagePos, startPos.route);
    const costMatrix = this.getMemoryCostMatrix();
    const upgraderPos = this.memory.position.creep[this.controller.id][0];
    this.debugLog('baseBuilding', `Upgrader position ${upgraderPos} costMatrix value after setFillerArea ${costMatrix.get(upgraderPos.x, upgraderPos.y)}`);
  }

  // find the most remote position to place the room summary visual
  let bestPosition = null;
  let bestScore = 0;
  const reservedPositions = this.getPositions();
  for (let y = 10; y <= 40; y += 10) {
    for (let x = 10; x <= 40; x += 10) {
      let score = 0;
      const pos = new RoomPosition(x, y, this.name);
      for (const pos2 of reservedPositions) {
        score += pos.getRangeTo(pos2);
      }
      if (score > bestScore) {
        bestScore = score;
        bestPosition = pos;
      }
    }
  }
  if (bestPosition && (bestPosition.x || bestPosition.y)) {
    this.memory.summaryCenter = {x: bestPosition.x, y: bestPosition.y};
  } else {
    this.memory.summaryCenter = {x: 10, y: 40};
  }
};

Room.prototype.setPosition = function(type, pos, value = config.layout.structureAvoid, positionType = 'structure', firstStructure = false) {
  const costMatrix = this.getMemoryCostMatrix();
  if (!this.memory.position[positionType]) {
    this.memory.position[positionType] = {};
  }
  if (!this.memory.position[positionType][type]) {
    this.memory.position[positionType][type] = [];
  }
  if (firstStructure) {
    this.memory.position[positionType][type].unshift(pos);
  } else {
    this.memory.position[positionType][type].push(pos);
  }
  this.debugLog('baseBuilding', `Increasing ${pos} ${type} ${positionType} with ${value}`);
  this.increaseCostMatrixValue(costMatrix, pos, value);
  this.setMemoryCostMatrix(costMatrix);
};

Room.prototype.setTowerFillerIterate = function(roomName, offsetDirection) {
  let linkSet = false;
  let towerFillerSet = false;
  let positionsFound = false;
  const path = this.getMemoryPath('pathStart-' + roomName);
  for (let pathIndex = path.length - 1; pathIndex >= 1; pathIndex--) {
    const posPath = path[pathIndex];
    const posPathObject = new RoomPosition(posPath.x, posPath.y, posPath.roomName);
    const posPathNext = path[pathIndex - 1];

    const directionNext = posPathObject.getDirectionTo(posPathNext.x, posPathNext.y, posPathNext.roomName);

    let pos;
    try {
      pos = posPathObject.getAdjacentPosition(directionNext + offsetDirection);
    } catch (e) {
      this.log(`setTowerFillerIterate ${e} ${posPathObject} ${directionNext} ${offsetDirection}`);
      continue;
    }

    if (!pos.checkTowerFillerPos()) {
      continue;
    }

    const terrain = pos.lookFor(LOOK_TERRAIN)[0];
    if (terrain === 'wall') {
      break;
    }

    if (!linkSet) {
      this.setPosition('link', pos, config.layout.structureAvoid);
      linkSet = true;
      continue;
    }
    if (!towerFillerSet) {
      this.setPosition('towerfiller', pos, config.layout.creepAvoid, 'creep');
      towerFillerSet = true;
      continue;
    }
    this.setPosition('tower', pos, config.layout.structureAvoid);
    positionsFound = true;
    break;
  }

  return positionsFound;
};

Room.prototype.setTowerFiller = function() {
  const exits = _.map(Game.map.describeExits(this.name));

  this.memory.position.creep.towerfiller = [];
  for (let index = 0; index < CONTROLLER_STRUCTURES.tower[8] - 1; index++) {
    const roomName = exits[index % exits.length];
    if (!roomName) {
      break;
    }
    for (let offsetDirection = 2; offsetDirection < 7; offsetDirection += 4) {
      if (this.setTowerFillerIterate(roomName, offsetDirection)) {
        break;
      }
    }
  }
};

Room.prototype.setLabs = function(allPaths) {
  const room = this;
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
      if (this.memory.position.structure.lab.length === 0) {
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
          if (this.memory.position.structure.lab.length < CONTROLLER_STRUCTURES.lab[8]) {
            this.setPosition(STRUCTURE_LAB, pos);
          }
        }
        room.debugLog('baseBuilding', 'All labs set: ' + pathI);
        return;
      }
    }
  }
};

Room.prototype.checkPositions = function() {
  for (const type of [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_LINK, STRUCTURE_OBSERVER, STRUCTURE_NUKER]) {
    if (this.memory.position.structure[type].length < CONTROLLER_STRUCTURES[type][8]) {
      this.log('Structures not found: ' +
        'spawns: ' + this.memory.position.structure.spawn.length + ' ' +
        'extensions: ' + this.memory.position.structure.extension.length + ' ' +
        'towers: ' + this.memory.position.structure.tower.length + ' ' +
        'links: ' + this.memory.position.structure.link.length + ' ' +
        'observer: ' + this.memory.position.structure.observer.length + ' ' +
        'lab: ' + this.memory.position.structure.lab.length + ' ' +
        'terminal: ' + this.memory.position.structure.terminal.length + ' ' +
        'nuker: ' + this.memory.position.structure.nuker.length,
      );
      return true;
    }
  }
  return false;
};

Room.prototype.setExtensionPos = function(structurePos, pathI) {
  this.setPosition('extension', structurePos, config.layout.structureAvoid);
  if (!this.memory.position.pathEndLevel) {
    this.memory.position.pathEndLevel = [0];
  }
  if (CONTROLLER_STRUCTURES.extension[this.memory.position.pathEndLevel.length] <= this.memory.position.structure.extension.length) {
    this.memory.position.pathEndLevel.push(pathI);
  }
};

Room.prototype.areEnergyStructuresPlaced = function() {
  return this.memory.position.structure.spawn.length < CONTROLLER_STRUCTURES.spawn[8] && this.memory.position.structure.extension.length < CONTROLLER_STRUCTURES.extension[8];
};

Room.prototype.setPositionAux = function(structurePos) {
  for (const type of [STRUCTURE_TOWER, STRUCTURE_NUKER, STRUCTURE_OBSERVER, STRUCTURE_LINK]) {
    if (this.memory.position.structure[type].length < CONTROLLER_STRUCTURES[type][8]) {
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

  this.memory.position.pathEnd = structurePos;
  this.debugLog('baseBuilding', 'All structures set: ' + pathI);
  return false;
};

Room.prototype.setStructures = function(path) {
  // this.setTowerFiller();

  for (let pathI = 0; pathI < path.length; pathI++) {
    const pathPos = new RoomPosition(path[pathI].x, path[pathI].y, this.name);
    const structurePosIterator = pathPos.findNearPosition();
    for (const structurePos of structurePosIterator) {
      if (this.setStructuresIteratePos(structurePos, pathI, path)) {
        continue;
      }
      return pathI;
    }
  }

  return -1;
};

Room.prototype.costMatrixSetSourcePath = function() {
  const costMatrix = this.getMemoryCostMatrix();
  const sources = this.findSources();
  for (const source of sources) {
    const route = [{
      room: this.name,
    }];
    const path = this.getPath(route, 0, 'pathStart', source.id, true);
    this.setCostMatrixPath(costMatrix, path);
    this.setCostMatrixAvoidSources(costMatrix);
    const sourcer = this.memory.position.creep[source.id];
    costMatrix.set(sourcer.x, sourcer.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.costMatrixSetMineralPath = function() {
  const costMatrix = this.getMemoryCostMatrix();
  const minerals = this.findMinerals();
  for (const mineral of minerals) {
    const route = [{
      room: this.name,
    }];
    const path = this.getPath(route, 0, 'pathStart', mineral.id, true);

    this.setCostMatrixPath(costMatrix, path);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.costMatrixPathFromStartToExit = function(exits) {
  return () => {
    const costMatrix = this.getMemoryCostMatrix();
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
      this.setCostMatrixPath(costMatrix, path);
      this.setMemoryCostMatrix(costMatrix);
    }
  };
};

Room.prototype.costMatrixPathCrossings = function(exits) {
  return () => {
    const costMatrix = this.getMemoryCostMatrix();
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
        this.setCostMatrixPath(costMatrix, path);
        this.setMemoryCostMatrix(costMatrix);
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

// find longest path, calculate vert-/horizontal as 2 (new structures) and diagonal as 4
const sorter = function(object) {
  let lastPos;
  let value = 0;
  for (const pos of object.path) {
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
};

/**
 * checkForSpawnPosition - Checks if the position is in the
 * `memory.position.structure.spawn`.
 *
 * @param {object} pos - The position to check against memory
 * @return {boolean} - If pos is a spawn position
 **/
Room.prototype.checkForSpawnPosition = function(pos) {
  for (const spawnPos of this.memory.position.structure.spawn) {
    if (spawnPos.x === pos.x && spawnPos.y === pos.y) {
      return true;
    }
  }
  return false;
};

/**
 * checkForMisplacedSpawn - Compares the current spawn structures positions
 * with the positions for spawns in memory.
 * If a spawn is on an unkown position `room.memory.misplacedSpawn` is set
 * to true.
 *
 * @return {undefined}
 **/
Room.prototype.checkForMisplacedSpawn = function() {
  const spawns = this.findMySpawns();
  for (const spawn of spawns) {
    if (!this.checkForSpawnPosition(spawn.pos)) {
      this.memory.misplacedSpawn = true;
    }
  }
};

Room.prototype.setupStructures = function() {
  const pathsController = _.filter(this.getMemoryPaths(), (object, key) => {
    return key.startsWith('pathStart-');
  });
  const pathsSorted = _.sortBy(pathsController, sorter);
  const path = this.getMemoryPath(pathsSorted[pathsSorted.length - 1].name);
  let pathI = this.setStructures(path);
  this.setLabs(pathsSorted);
  this.debugLog('baseBuilding', 'path: ' + pathsSorted[pathsSorted.length - 1].name + ' pathI: ' + pathI + ' length: ' + path.length);
  if (pathI === -1) {
    pathI = path.length - 1;
  }
  this.setMemoryPath('pathStart-harvester', path.slice(0, pathI + 1), true);
  this.memory.position.version = config.layout.version;
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
  delete this.memory.summaryCenter;
  cache.rooms[this.name] = {
    find: {},
    routing: {},
    costMatrix: {},
    created: Game.time,
  };
};

Room.prototype.setup = function() {
  if (this.memory.setup) {
    if (this.memory.setup.completed) {
      delete this.memory.setup;
    }
  }
  this.memory.setup = this.memory.setup || {
    steps: {},
  };

  if (!this.stepExecute(this.cleanupMemory, 'cleanupMemory')) {
    return false;
  }

  if (!this.stepExecute(this.updatePosition, 'updatePosition')) {
    return false;
  }

  const exits = Game.map.describeExits(this.name);
  if (this.controller) {
    if (!this.stepExecute(this.costMatrixSetMineralPath, 'costMatrixSetMineralPath')) {
      return false;
    }
    if (!this.stepExecute(this.costMatrixPathFromStartToExit(exits), 'costMatrixPathFromStartToExit')) {
      return false;
    }
  }

  if (!this.stepExecute(this.costMatrixPathCrossings(exits), 'costMatrixPathCrossings')) {
    return false;
  }

  if (!this.stepExecute(this.addTerminal, 'addTerminal')) {
    return false;
  }

  if (!this.stepExecute(this.setupStructures, 'setupStructures')) {
    return false;
  }

  if (!this.stepExecute(this.checkForMisplacedSpawn, 'checkForMisplacedSpawn')) {
    return false;
  }
  this.memory.setup.completed = true;
  return true;
};
