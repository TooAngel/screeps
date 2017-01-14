'use strict';

Room.prototype.initSetController = function() {
  if (this.controller) {
    let costMatrix = this.getMemoryCostMatrix();
    let upgraderPos = this.controller.pos.findNearPosition().next().value;
    this.memory.position.creep[this.controller.id] = upgraderPos;
    costMatrix.set(upgraderPos.x, upgraderPos.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.initSetSources = function() {
  let sources = this.find(FIND_SOURCES);
  let costMatrix = this.getMemoryCostMatrix();
  for (let source of sources) {
    let sourcer = source.pos.findNearPosition().next().value;
    this.memory.position.creep[source.id] = sourcer;
    // TODO E.g. E11S8 it happens that sourcer has no position
    if (sourcer) {
      let link = sourcer.findNearPosition().next().value;
      this.memory.position.structure.link.push(link);
      costMatrix.set(link.x, link.y, config.layout.structureAvoid);
      this.setMemoryCostMatrix(costMatrix);
    }
  }
};

Room.prototype.initSetMinerals = function() {
  let costMatrix = this.getMemoryCostMatrix();
  let minerals = this.find(FIND_MINERALS);
  for (let mineral of minerals) {
    let extractor = mineral.pos.findNearPosition().next().value;
    this.memory.position.creep[mineral.id] = extractor;
    this.memory.position.structure.extractor.push(mineral.pos);
    costMatrix.set(extractor.x, extractor.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.initSetStorageAndPathStart = function() {
  let costMatrix = this.getMemoryCostMatrix();
  let storagePos = this.memory.position.creep[this.controller.id].findNearPosition().next().value;
  this.memory.position.structure.storage.push(storagePos);
  // TODO should also be done for the other structures
  costMatrix.set(storagePos.x, storagePos.y, config.layout.structureAvoid);
  this.setMemoryCostMatrix(costMatrix);

  this.memory.position.creep.pathStart = storagePos.findNearPosition().next().value;

  let route = [{
    room: this.name
  }];
  let pathUpgrader = this.getPath(route, 0, 'pathStart', this.controller.id, true);
  // TODO exclude the last position (creepAvoid) in all paths
  for (let pos of pathUpgrader) {
    if (this.memory.position.creep[this.controller.id].isEqualTo(pos.x, pos.y)) {
      continue;
    }
    costMatrix.set(pos.x, pos.y, config.layout.pathAvoid);
  }
  this.setMemoryCostMatrix(costMatrix);
  return {
    storagePos: storagePos,
    route: route
  };
};

Room.prototype.setFillerArea = function(storagePos, route) {
  let costMatrix = this.getMemoryCostMatrix();
  let fillerPosIterator = storagePos.findNearPosition();
  for (let fillerPos of fillerPosIterator) {
    // TODO reset all values if the first doesn't fit
    this.log('Testing fillerPos' + JSON.stringify(fillerPos));
    this.deleteMemoryPath('pathStart-filler');
    this.memory.position.creep.filler = fillerPos;
    costMatrix.set(fillerPos.x, fillerPos.y, config.layout.creepAvoid);
    this.setMemoryCostMatrix(costMatrix);
    let pathFiller = this.getPath(route, 0, 'pathStart', 'filler', true);
    for (let pos of pathFiller) {
      this.increaseCostMatrixValue(costMatrix, pos, config.layout.pathAvoid);
    }
    this.setMemoryCostMatrix(costMatrix);
    let linkStoragePosIterator = fillerPos.findNearPosition();
    for (let linkStoragePos of linkStoragePosIterator) {
      this.memory.position.structure.link.unshift(linkStoragePos);

      let powerSpawnPosIterator = fillerPos.findNearPosition();
      for (let powerSpawnPos of powerSpawnPosIterator) {
        this.memory.position.structure.powerSpawn.push(powerSpawnPos);

        let towerPosIterator = fillerPos.findNearPosition();
        for (let towerPos of towerPosIterator) {
          this.memory.position.structure.tower.push(towerPos);
          return;
        }
        this.memory.position.structure.powerSpawn.pop();
      }
      this.memory.position.structure.link.shift();
    }
  }
};

Room.prototype.updatePosition = function() {
  cache.rooms[this.name] = {};
  delete this.memory.routing;

  let costMatrixBase = this.getCostMatrix();
  this.setMemoryCostMatrix(costMatrixBase);
  this.memory.position = {
    creep: {}
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
    extractor: []
  };

  this.initSetController();
  this.initSetSources();
  this.initSetMinerals();

  if (this.controller && this.controller.my) {
    let startPos = this.initSetStorageAndPathStart();

    let sources = this.find(FIND_SOURCES);
    let costMatrix = this.getMemoryCostMatrix();
    for (let source of sources) {
      let route = [{
        room: this.name
      }];
      let path = this.getPath(route, 0, 'pathStart', source.id, true);
      for (let pos of path) {
        let posObject = new RoomPosition(pos.x, pos.y, this.name);
        let sourcer = this.memory.position.creep[source.id];
        if (posObject.isEqualTo(sourcer.x, sourcer.y)) {
          continue;
        }

        costMatrix.set(pos.x, pos.y, config.layout.pathAvoid);
      }
      let sourcer = this.memory.position.creep[source.id];
      costMatrix.set(sourcer.x, sourcer.y, config.layout.creepAvoid);
      this.setMemoryCostMatrix(costMatrix);
    }
    this.setFillerArea(startPos.storagePos, startPos.route);
  }
};

Room.prototype.setTowerFiller = function() {
  let exits = _.map(Game.map.describeExits(this.name));

  this.memory.position.creep.towerfiller = [];

  for (let index = 0; index < CONTROLLER_STRUCTURES.tower[8] - 1; index++) {
    let roomName = exits[index % exits.length];
    if (!roomName) {
      break;
    }
    for (let offsetDirection = 2; offsetDirection < 7; offsetDirection += 4) {
      let linkSet = false;
      let towerFillerSet = false;
      let positionsFound = false;
      let path = this.getMemoryPath('pathStart' + '-' + roomName);
      for (let pathIndex = path.length - 1; pathIndex >= 1; pathIndex--) {
        let posPath = path[pathIndex];
        let posPathObject = new RoomPosition(posPath.x, posPath.y, posPath.roomName);
        let posPathNext = path[pathIndex - 1];

        let directionNext = posPathObject.getDirectionTo(posPathNext.x, posPathNext.y, posPathNext.roomName);

        let offset = (directionNext + offsetDirection - 1) % 8 + 1;
        let pos = posPathObject.buildRoomPosition(offset);
        if (pos.x <= 4 || pos.x >= 45 || pos.y <= 4 || pos.y >= 45) {
          continue;
        }

        if (pos.inPositions()) {
          continue;
        }

        if (pos.inPath()) {
          continue;
        }

        let terrain = pos.lookFor(LOOK_TERRAIN)[0];
        if (terrain === 'wall') {
          break;
        }

        if (!linkSet) {
          this.memory.position.structure.link.push(pos);
          linkSet = true;
          continue;
        }
        if (!towerFillerSet) {
          this.memory.position.creep.towerfiller.push(pos);
          towerFillerSet = true;
          continue;
        }
        this.memory.position.structure.tower.push(pos);
        positionsFound = true;
        break;
      }

      if (positionsFound) {
        break;
      }
    }
  }
};

Room.prototype.setLabsTerminal = function(path) {
  let costMatrix = this.getMemoryCostMatrix();
  for (let pathI = path.length - 1; pathI > 0; pathI--) {
    let pathPos = new RoomPosition(path[pathI].x, path[pathI].y, this.name);
    let structurePosIterator = pathPos.findNearPosition();
    for (let structurePos of structurePosIterator) {
      if (this.memory.position.structure.lab.length < CONTROLLER_STRUCTURES.lab[8]) {
        this.memory.position.structure.lab.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        continue;
      }
      if (this.memory.position.structure.terminal.length < CONTROLLER_STRUCTURES.terminal[8]) {
        this.memory.position.structure.terminal.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        this.memory.position.pathEnd = [pathPos];
        continue;
      }
      if (this.memory.position.structure.lab.length < CONTROLLER_STRUCTURES.lab[8] ||
        this.memory.position.structure.terminal.length < CONTROLLER_STRUCTURES.terminal[8]) {
        this.log('Structures not found: ' +
          'lab: ' + this.memory.position.structure.lab.length + ' ' +
          'terminal: ' + this.memory.position.structure.terminal.length
        );
        continue;
      }
      if (!this.memory.position.pathEnd) {
        this.log('Room not completly build');
      }
      console.log('All labs/terminal set: ' + pathI);
      this.setMemoryCostMatrix(costMatrix);
      return pathI;
    }
  }
  this.setMemoryCostMatrix(costMatrix);

  return -1;
};

Room.prototype.setStructures = function(path) {
  this.setTowerFiller();

  let costMatrix = this.getMemoryCostMatrix();
  let pathI;
  for (pathI in path) {
    let pathPos = new RoomPosition(path[pathI].x, path[pathI].y, this.name);
    let structurePosIterator = pathPos.findNearPosition();
    for (let structurePos of structurePosIterator) {
      if (structurePos.setSpawn(pathPos, path[+pathI + 1])) {
        this.memory.position.structure.spawn.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        continue;
      }
      if (structurePos.setExtension()) {
        this.memory.position.structure.extension.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        if (!this.memory.position.pathEndLevel) {
          this.memory.position.pathEndLevel = [0];
        }
        if (CONTROLLER_STRUCTURES.extension[this.memory.position.pathEndLevel.length] <= this.memory.position.structure.extension.length) {
          this.memory.position.pathEndLevel.push(pathI);
        }
        continue;
      }
      if (this.memory.position.structure.spawn.length < CONTROLLER_STRUCTURES.spawn[8] && this.memory.position.structure.extension.length < CONTROLLER_STRUCTURES.extension[8]) {
        continue;
      }

      // TODO Build labs, terminal, nuker ... at the path to extractor / mineral or the next path which diverge from the harvester path
      if (this.memory.position.structure.tower.length < CONTROLLER_STRUCTURES.tower[8]) {
        this.memory.position.structure.tower.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        continue;
      }
      if (this.memory.position.structure.nuker.length < CONTROLLER_STRUCTURES.nuker[8]) {
        this.memory.position.structure.nuker.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        continue;
      }
      if (this.memory.position.structure.observer.length < CONTROLLER_STRUCTURES.observer[8]) {
        this.memory.position.structure.observer.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        continue;
      }

      if (this.memory.position.structure.link.length < CONTROLLER_STRUCTURES.link[8]) {
        this.memory.position.structure.link.push(structurePos);
        costMatrix.set(structurePos.x, structurePos.y, config.layout.structureAvoid);
        continue;
      }

      if (this.memory.position.structure.spawn.length < CONTROLLER_STRUCTURES.spawn[8] ||
        this.memory.position.structure.extension.length < CONTROLLER_STRUCTURES.extension[8] ||
        this.memory.position.structure.tower.length < CONTROLLER_STRUCTURES.tower[8] ||
        this.memory.position.structure.link.length < CONTROLLER_STRUCTURES.link[8] ||
        this.memory.position.structure.observer.length < CONTROLLER_STRUCTURES.observer[8] ||
        this.memory.position.structure.nuker.length < CONTROLLER_STRUCTURES.nuker[8]) {
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
        continue;
      }
      if (!this.memory.position.pathEnd) {
        this.log('Room not completly build');
      }
      //      let pathIndex = _.findIndex(path, i => i.x === this.memory.position.pathEnd[0].x && i.y === this.memory.position.pathEnd[0].y);
      //      this.memory.position.path = path.slice(0, pathIndex);
      //      return positions;
      console.log('All structures set: ' + pathI);
      this.setMemoryCostMatrix(costMatrix);
      return pathI;
    }
  }
  this.setMemoryCostMatrix(costMatrix);

  return -1;
};

Room.prototype.costMatrixSetMineralPath = function() {
  let costMatrix = this.getMemoryCostMatrix();
  // TODO which first minerals or sources? Maybe order by length of path
  let minerals = this.find(FIND_MINERALS);
  for (let mineral of minerals) {
    let route = [{
      room: this.name
    }];
    let path = this.getPath(route, 0, 'pathStart', mineral.id, true);
    this.setCostMatrixPath(costMatrix, path);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.costMatrixPathFromStartToExit = function(exits) {
  let costMatrix = this.getMemoryCostMatrix();
  for (let endDir in exits) {
    let end = exits[endDir];
    let route = [{
      room: this.name
    }, {
      room: end
    }];
    let path = this.getPath(route, 0, 'pathStart', undefined, true);
    this.setCostMatrixPath(costMatrix, path);
    this.setMemoryCostMatrix(costMatrix);
  }
};

Room.prototype.setup = function() {
  delete this.memory.constants;
  this.log('costmatrix.setup called');
  this.memory.controllerLevel = {};
  this.updatePosition();

  let costMatrix = this.getMemoryCostMatrix();
  let exits = Game.map.describeExits(this.name);
  if (this.controller) {
    this.costMatrixSetMineralPath();
    this.costMatrixPathFromStartToExit(exits);
  }

  for (let startDir in exits) {
    let start = exits[startDir];
    for (let endDir in exits) {
      let end = exits[endDir];
      if (start === end) {
        continue;
      }
      let route = [{
        room: start
      }, {
        room: this.name
      }, {
        room: end
      }];
      let path = this.getPath(route, 1, undefined, undefined, true);
      this.setCostMatrixPath(costMatrix, path);
      this.setMemoryCostMatrix(costMatrix);
    }
  }

  // find longest path, calculate vert-/horizontal as 2 (new structures) and diagonal as 4
  let sorter = function(object) {
    let last_pos;
    let value = 0;
    for (let pos of object.path) {
      let valueAdd = 0;
      if (!last_pos) {
        last_pos = new RoomPosition(pos.x, pos.y, pos.roomName);
        continue;
      }
      let direction = last_pos.getDirectionTo(pos.x, pos.y, pos.roomName);
      if (direction % 2 === 0) {
        valueAdd += 2;
      } else {
        valueAdd += 4;
      }

      for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
          let wall = new RoomPosition(pos.x + x, pos.y + y, pos.roomName);
          let terrains = wall.lookFor(LOOK_TERRAIN);
          if (terrains === 'wall') {
            valueAdd *= 0.5; // TODO some factor
          }
        }
      }
      value += valueAdd;
      last_pos = new RoomPosition(pos.x, pos.y, pos.roomName);
    }
    return value;
  };

  let paths_controller = _.filter(this.getMemoryPaths(), function(object, key) {
    return key.startsWith('pathStart-');
  });
  let paths_sorted = _.sortBy(paths_controller, sorter);
  let path = this.getMemoryPath(paths_sorted[paths_sorted.length - 1].name);
  let pathLB = this.getMemoryPath(paths_controller[4].name);
  let pathL = this.setLabsTerminal(pathLB);
  let pathI = this.setStructures(path);
  this.log('path: ' + path.name + ' pathI: ' + pathI + ' length: ' + path.length);
  if (pathI === -1) {
    pathI = path.length - 1;
  }

  this.setMemoryPath('pathStart-harvester', path.slice(0, pathI + 1), true);
  this.memory.position.version = config.layout.version;
};
