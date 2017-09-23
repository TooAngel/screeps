'use strict';

Room.prototype.initSetController = function() {
  if (this.controller) {
    const costMatrix = this.getMemoryCostMatrix();
    const upgraderPos = this.controller.pos.getBestNearPosition();
    this.memory.position.creep[this.controller.id] = upgraderPos;
    costMatrix.set(upgraderPos.x, upgraderPos.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.initSetSources = function() {
  const sources = this.find(FIND_SOURCES);
  const costMatrix = this.getMemoryCostMatrix();
  for (const source of sources) {
    const sourcer = source.pos.getBestNearPosition();
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
    const extractor = mineral.pos.getBestNearPosition();
    this.memory.position.creep[mineral.id] = extractor;
    this.memory.position.structure.extractor.push(mineral.pos);
    costMatrix.set(extractor.x, extractor.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.initSetStorageAndPathStart = function() {
  const costMatrix = this.getMemoryCostMatrix();
  const storagePos = this.memory.position.creep[this.controller.id].getBestNearPosition();
  this.memory.position.structure.storage.push(storagePos);
  // TODO should also be done for the other structures
  costMatrix.set(storagePos.x, storagePos.y, config.layout.structureAvoid);
  this.setMemoryCostMatrix(costMatrix);

  this.memory.position.creep.pathStart = storagePos.getBestNearPosition();

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
  // TODO reset all values if the first doesn't fit
  this.log('Testing fillerPos' + JSON.stringify(fillerPos));
  this.deleteMemoryPath('pathStart-filler');
  this.memory.position.creep.filler = fillerPos;
  costMatrix.set(fillerPos.x, fillerPos.y, config.layout.creepAvoid);
  this.setMemoryCostMatrix(costMatrix);
  const pathFiller = this.getPath(route, 0, 'pathStart', 'filler', true);
  for (const pos of pathFiller) {
    this.increaseCostMatrixValue(costMatrix, pos, config.layout.pathAvoid);
  }
  this.setMemoryCostMatrix(costMatrix);
  const linkStoragePosIterator = fillerPos.findNearPosition();
  for (const linkStoragePos of linkStoragePosIterator) {
    this.memory.position.structure.link.unshift(linkStoragePos);
    costMatrix.set(linkStoragePos.x, linkStoragePos.y, config.layout.structureAvoid);
    this.setMemoryCostMatrix(costMatrix);

    const powerSpawnPosIterator = fillerPos.findNearPosition();
    for (const powerSpawnPos of powerSpawnPosIterator) {
      this.memory.position.structure.powerSpawn.push(powerSpawnPos);
      costMatrix.set(powerSpawnPos.x, powerSpawnPos.y, config.layout.structureAvoid);
      this.setMemoryCostMatrix(costMatrix);

      const towerPosIterator = fillerPos.findNearPosition();
      for (const towerPos of towerPosIterator) {
        this.memory.position.structure.tower.push(towerPos);
        costMatrix.set(towerPos.x, towerPos.y, config.layout.structureAvoid);
        this.setMemoryCostMatrix(costMatrix);
        return;
      }
      this.memory.position.structure.powerSpawn.pop();
    }
    this.memory.position.structure.link.shift();
  }
};

Room.prototype.updatePosition = function() {
  this.checkCache();
  delete this.memory.routing;

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

    const sources = this.find(FIND_SOURCES);
    const costMatrix = this.getMemoryCostMatrix();
    for (const source of sources) {
      const route = [{
        room: this.name,
      }];
      const path = this.getPath(route, 0, 'pathStart', source.id, true);
      for (const pos of path) {
        const posObject = new RoomPosition(pos.x, pos.y, this.name);
        const sourcer = this.memory.position.creep[source.id];
        if (posObject.isEqualTo(sourcer.x, sourcer.y)) {
          continue;
        }

        costMatrix.set(pos.x, pos.y, config.layout.pathAvoid);
      }
      const sourcer = this.memory.position.creep[source.id];
      costMatrix.set(sourcer.x, sourcer.y, config.layout.creepAvoid);
      this.setMemoryCostMatrix(costMatrix);
    }
    this.setFillerArea(startPos.storagePos, startPos.route);
  }
};

Room.prototype.setPosition = function(type, pos, value, positionType = 'structure') {
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

Room.prototype.checkLabStructures = function(structurePos, pathPos) {
  if (this.memory.position.structure.lab.length < CONTROLLER_STRUCTURES.lab[8]) {
    this.setPosition('lab', structurePos, config.layout.structureAvoid);
    return true;
  }
  if (this.memory.position.structure.terminal.length < CONTROLLER_STRUCTURES.terminal[8]) {
    this.setPosition('terminal', structurePos, config.layout.structureAvoid);
    this.memory.position.pathEnd = [pathPos];
    return true;
  }
  if (this.memory.position.structure.lab.length < CONTROLLER_STRUCTURES.lab[8] ||
    this.memory.position.structure.terminal.length < CONTROLLER_STRUCTURES.terminal[8]) {
    this.log('Structures not found: ' +
      'lab: ' + this.memory.position.structure.lab.length + ' ' +
      'terminal: ' + this.memory.position.structure.terminal.length
    );
    return true;
  }
  if (!this.memory.position.pathEnd) {
    this.log('Room not completly build');
  }
};

Room.prototype.setLabsTerminal = function(path) {
  for (let pathI = path.length - 1; pathI > 0; pathI--) {
    const pathPos = new RoomPosition(path[pathI].x, path[pathI].y, this.name);
    const structurePosIterator = pathPos.findNearPosition();
    for (const structurePos of structurePosIterator) {
      if (this.checkLabStructures(structurePos, pathPos)) {
        continue;
      }
      console.log('All labs/terminal set: ' + pathI);
      return pathI;
    }
  }

  return -1;
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

Room.prototype.setStructuresCheck = function(pathI) {
  if (!this.memory.position.pathEnd) {
    this.log('Room not completly build');
  }
  console.log('All structures set: ' + pathI);
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

  this.setStructuresCheck(pathI);
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
  // TODO This is the path to the extractor, we should change this to getting the right path via ID (e.g. if there are more than two sources this could change)
  const pathLB = this.getMemoryPath(pathsController[4].name);
  this.setLabsTerminal(pathLB);
  let pathI = this.setStructures(path);
  this.log('path: ' + pathsSorted[pathsSorted.length - 1].name + ' pathI: ' + pathI + ' length: ' + path.length);
  if (pathI === -1) {
    pathI = path.length - 1;
  }

  this.setMemoryPath('pathStart-harvester', path.slice(0, pathI + 1), true);
  this.memory.position.version = config.layout.version;
};
