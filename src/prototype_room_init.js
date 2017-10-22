'use strict';

Room.prototype.initSetController = function() {
  if (this.controller) {
    const costMatrix = this.getMemoryCostMatrix();
    const upgraderPos = this.controller.pos.getBestNearPosition({ignorePositions: true, ignorePath: true});
    this.memory.position.creep[this.controller.id] = upgraderPos;
    costMatrix.set(upgraderPos.x, upgraderPos.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.initSetSources = function() {
  const sources = this.find(FIND_SOURCES);
  const costMatrix = this.getMemoryCostMatrix();
  for (const source of sources) {
    const sourcer = source.pos.getFirstNearPosition({ignorePath: true});
    this.memory.position.creep[source.id] = sourcer;
    // TODO E.g. E11S8 it happens that sourcer has no position
    if (sourcer) {
      const link = sourcer.getFirstNearPosition();
      this.memory.position.structure.link.push(link);
      costMatrix.set(link.x, link.y, config.layout.structureAvoid);
      this.setMemoryCostMatrix(costMatrix);
    }
  }
};

Room.prototype.initSetMinerals = function() {
  const costMatrix = this.getMemoryCostMatrix();
  const minerals = this.find(FIND_MINERALS);
  for (const mineral of minerals) {
    const extractor = mineral.pos.getFirstNearPosition();
    this.memory.position.creep[mineral.id] = extractor;
    this.memory.position.structure.extractor.push(mineral.pos);
    costMatrix.set(extractor.x, extractor.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.initSetStorageAndPathStart = function() {
  const costMatrix = this.getMemoryCostMatrix();
  const upgraderPos = this.memory.position.creep[this.controller.id];
  const storagePos = upgraderPos.getBestNearPosition({ignorePath: true});

  this.memory.position.structure.storage.push(storagePos);
  // TODO should also be done for the other structures
  costMatrix.set(storagePos.x, storagePos.y, config.layout.structureAvoid);
  this.setMemoryCostMatrix(costMatrix);

  this.memory.position.creep.pathStart = storagePos.getFirstNearPosition({ignorePath: true});

  const route = [{
    room: this.name,
  }];
  const pathUpgrader = this.getPath(route, 0, 'pathStart', this.controller.id, true);
  // TODO exclude the last position (creepAvoid) in all paths
  for (const pos of pathUpgrader) {
    if (this.memory.position.creep[this.controller.id].isEqualTo(pos.x, pos.y)) {
      continue;
    }
    costMatrix.set(pos.x, pos.y, config.layout.pathAvoid);
  }
  this.setMemoryCostMatrix(costMatrix);
  return {
    storagePos: storagePos,
    route: route,
  };
};

Room.prototype.setFillerArea = function(storagePos, route) {
  const costMatrix = this.getMemoryCostMatrix();

  const fillerPos = storagePos.getBestNearPosition();
  this.memory.position.creep.filler = fillerPos;
  costMatrix.set(fillerPos.x, fillerPos.y, config.layout.creepAvoid);
  this.setMemoryCostMatrix(costMatrix);

  const pathFiller = this.getPath(route, 0, 'pathStart', 'filler', true);
  this.setCostMatrixPath(costMatrix, pathFiller);
  this.setMemoryCostMatrix(costMatrix);

  const fillerNearPositions = Array.from(fillerPos.findNearPosition());
  if (fillerNearPositions.length < 4) {
    throw new Error(`Can't set layout for room ${this.name}. Not enough space for filler area`);
  }

  const linkStoragePos = fillerNearPositions.shift();
  this.memory.position.structure.link.unshift(linkStoragePos);
  costMatrix.set(linkStoragePos.x, linkStoragePos.y, config.layout.structureAvoid);
  this.setMemoryCostMatrix(costMatrix);

  this.setPosition(STRUCTURE_POWER_SPAWN, fillerNearPositions.shift());

  this.setPosition(STRUCTURE_TOWER, fillerNearPositions.shift());
};

Room.prototype.addTerminalToFillerArea = function() {
  const fillerPos = this.memory.position.creep.filler;
  const pathStart = this.memory.position.creep.pathStart;
  const getNearPathPos = (pos) => Array.from(pos.getAllAdjacentPositions()).find((p) => p.inPath() && !p.inPositions() || p.isEqualTo(pathStart));

  for (const terminalPos of fillerPos.findNearPosition()) {
    const nearPathPos = getNearPathPos(terminalPos);
    if (nearPathPos) {
      this.setPosition(STRUCTURE_TERMINAL, terminalPos);
      this.memory.position.creep.terminal = nearPathPos;
      this.log('set terminal in free spot');
      return;
    }
  }

  const nextPos = fillerPos.getFirstNearPosition();
  const trySwapPos = (structureType) => {
    const nearPathPos = getNearPathPos(this.memory.position.structure[structureType][0]);
    if (nearPathPos) {
      this.memory.position.structure.terminal.push(this.memory.position.structure[structureType][0]);
      this.memory.position.creep.terminal = nearPathPos;
      this.memory.position.structure[structureType][0] = nextPos;
      const costMatrix = this.getMemoryCostMatrix();
      costMatrix.set(nextPos.x, nextPos.y, config.layout.structureAvoid);
      this.setMemoryCostMatrix(costMatrix);
      return true;
    }
    return false;
  };

  if (trySwapPos(STRUCTURE_POWER_SPAWN)) {
    this.log(`set terminal instead ${STRUCTURE_POWER_SPAWN}`);
    return;
  }

  if (trySwapPos(STRUCTURE_TOWER)) {
    this.log(`set terminal instead ${STRUCTURE_TOWER}`);
    return;
  }

  if (trySwapPos(STRUCTURE_LINK)) {
    this.log(`set terminal instead ${STRUCTURE_LINK}`);
    return;
  }

  throw new Error(`Can't set layout for room ${this.name}. Can't set terminal near path`);
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
  this.memory.summaryCenter = {x: bestPosition.x, y: bestPosition.y};
};

Room.prototype.setPosition = function(type, pos, value = config.layout.structureAvoid, positionType = 'structure') {
  const costMatrix = this.getMemoryCostMatrix();
  this.memory.position[positionType][type].push(pos);
  costMatrix.set(pos.x, pos.y, value);
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

    const pos = posPathObject.getAdjacentPosition(directionNext + offsetDirection);

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
  let lab1Pos;
  let lab2Pos;
  let pathI;
  let path;
  const validResultLabPosition = (p) => {
    return !p.isEqualTo(lab1Pos) && !p.isEqualTo(lab2Pos) && p.inRangeTo(lab2Pos, 2) && p.validPosition() &&
      path.slice(Math.max(0, pathI - 3), Math.min(path.length - 1, pathI + 3)).some((pp) => p.isNearTo(pp.x, pp.y));
  };
  const isNear = (p1) => (p2) => p2.isNearTo(p1);

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
        for (let i = pathI; i < Math.min(path.length, pathI + 3); ++i) {
          const lastPathPos = RoomPosition.fromJSON(path[i]);
          if (labResultPoss.some(isNear(lastPathPos))) {
            this.memory.position.creep.labs = lastPathPos;
          }
        }
        console.log('All labs set: ' + pathI);
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
        'nuker: ' + this.memory.position.structure.nuker.length
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
  console.log('All structures set: ' + pathI);
  return false;
};

Room.prototype.setStructures = function(path) {
  this.setTowerFiller();

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
  const sources = this.find(FIND_SOURCES);
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
  const minerals = this.find(FIND_MINERALS);
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

Room.prototype.costMatrixPathCrossings = function(exits) {
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

const checkForSurroundingWalls = function(pos, valueAdd) {
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      const wall = new RoomPosition(pos.x + x, pos.y + y, pos.roomName);
      if (wall.checkForWall()) {
        valueAdd *= 0.5; // TODO some factor
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

/*
 * Places walls at spawn exits which are not on the path
 */
Room.prototype.blockWrongSpawnExits = function() {
  for (let spawnId = 0; spawnId < this.memory.position.structure.spawn.length; spawnId++) {
    const spawnMemory = this.memory.position.structure.spawn[spawnId];
    const spawn = new RoomPosition(spawnMemory.x, spawnMemory.y, spawnMemory.roomName);
    for (const adjacentPos of spawn.getAllAdjacentPositions()) {
      if (adjacentPos.validPosition()) {
        this.log('Blocking ', adjacentPos, ' with wall - Wrong spawn exit');
        this.memory.walls = this.memory.walls || {
          exit_i: 0,
          ramparts: [],
          layer_i: 0,
          // TODO as array?
          layer: {
            0: [],
          },
        };
        this.memory.walls.layer[0].push(adjacentPos);
      }
    }
  }
};

Room.prototype.setup = function() {
  delete this.memory.constants;
  this.log('costmatrix.setup called');
  this.memory.controllerLevel = {};
  this.updatePosition();

  const exits = Game.map.describeExits(this.name);
  if (this.controller) {
    this.costMatrixSetMineralPath();
    this.costMatrixPathFromStartToExit(exits);
  }

  this.costMatrixPathCrossings(exits);

  const pathsController = _.filter(this.getMemoryPaths(), (object, key) => {
    return key.startsWith('pathStart-');
  });
  const pathsSorted = _.sortBy(pathsController, sorter);
  const path = this.getMemoryPath(pathsSorted[pathsSorted.length - 1].name);
  this.addTerminalToFillerArea();
  let pathI = this.setStructures(path);
  this.setLabs(pathsSorted);
  this.log('path: ' + pathsSorted[pathsSorted.length - 1].name + ' pathI: ' + pathI + ' length: ' + path.length);
  if (pathI === -1) {
    pathI = path.length - 1;
  }

  this.setMemoryPath('pathStart-harvester', path.slice(0, pathI + 1), true);
  this.memory.position.version = config.layout.version;

  this.blockWrongSpawnExits();
};
