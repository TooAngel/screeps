'use strict';

Room.prototype.setCostMatrixStructures = function(costMatrix, structures, value) {
  for (let structure of structures) {
    costMatrix.set(structure.pos.x, structure.pos.y, value);
  }
};

Room.prototype.getCostMatrixCallback = function(end, excludeStructures, oneRoom, allowExits) {
  let costMatrix = this.getMemoryCostMatrix();
  if (!costMatrix) {
    this.updatePosition();
  }

  let callbackInner = (roomName) => {
    if (oneRoom && roomName !== this.name) {
      return false;
    }
    let room = Game.rooms[roomName];
    if (!room) {
      return;
    }
    let costMatrix = room.getMemoryCostMatrix();
    if (!costMatrix) {
      return;
    }
    costMatrix = costMatrix.clone();
    // TODO the ramparts could be within existing walls (at least when converging to the newmovesim
    if (end) {
      costMatrix.set(end.x, end.y, 0);
    }

    if (excludeStructures) {
      // TODO excluding structures, for the case where the spawn is in the wrong spot (I guess this can be handled better)
      let structures = room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTAINER], true);
      this.setCostMatrixStructures(costMatrix, structures, config.layout.structureAvoid);

      // TODO repairer got stuck at walls, why?
      let constructionSites = room.findPropertyFilter(FIND_CONSTRUCTION_SITES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTAINER], true);
      this.setCostMatrixStructures(costMatrix, constructionSites, config.layout.structureAvoid);
    }

    if (allowExits) {
      let openExits = function(x, y) {
        costMatrix.set(x, y, new RoomPosition(x, y, room.name).lookFor(LOOK_TERRAIN)[0] === 'wall' ? 0xff : 0);
      };
      for (let i = 0; i < 50; i++) {
        openExits(i, 0);
        openExits(i, 49);
        openExits(0, i);
        openExits(49, i);
      }
    }
    return costMatrix;
  };
  return callbackInner;
};

Room.prototype.setCostMatrixPath = function(costMatrix, path) {
  for (let i = 0; i < path.length - 1; i++) {
    let pos = path[i];
    costMatrix.set(pos.x, pos.y, config.layout.pathAvoid);
  }
  this.setCostMatrixAvoidSources(costMatrix);
};

Room.prototype.increaseCostMatrixValue = function(costMatrix, pos, value) {
  costMatrix.set(pos.x, pos.y, Math.max(costMatrix.get(pos.x, pos.y), value));
};

Room.prototype.setCostMatrixAvoidSources = function(costMatrix) {
  const sources = this.find(FIND_SOURCES);
  for (let source of sources) {
    for (let pos of source.pos.getAllPositionsInRange(2)) {
      this.increaseCostMatrixValue(costMatrix, pos, config.layout.sourceAvoid);
    }
  }
  return sources;
};

Room.prototype.getCostMatrix = function() {
  let costMatrix = new PathFinder.CostMatrix();
  // Keep distance to walls
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      let roomPos = new RoomPosition(x, y, this.name);
      if (roomPos.checkForWall()) {
        costMatrix.set(roomPos.x, roomPos.y, 0xFF);
        for (let pos of roomPos.getAllPositionsInRange(1)) {
          this.increaseCostMatrixValue(costMatrix, pos, config.layout.wallAvoid);
        }
      }
    }
  }

  this.setCostMatrixAvoidSources(costMatrix);

  const lairs = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_KEEPER_LAIR]);
  if (lairs.length > 0) {
    const minerals = this.find(FIND_MINERALS);
    const sources = this.find(FIND_SOURCES);
    for (let obj of [...lairs, ...sources, ...minerals]) {
      for (let pos of obj.pos.getAllPositionsInRange(config.layout.skLairAvoidRadius)) {
        this.increaseCostMatrixValue(costMatrix, pos, config.layout.skLairAvoid);
      }
    }
  }

  for (let i = 0; i < 50; i++) {
    let value = config.layout.borderAvoid;
    costMatrix.set(i, 0, Math.max(costMatrix.get(i, 0), 0xFF));
    costMatrix.set(i, 49, Math.max(costMatrix.get(i, 49), 0xFF));
    costMatrix.set(0, i, Math.max(costMatrix.get(0, i), 0xFF));
    costMatrix.set(49, i, Math.max(costMatrix.get(49, i), 0xFF));

    for (let j = 1; j < 5; j++) {
      costMatrix.set(i, 0 + j, Math.max(costMatrix.get(i, 0 + j), value));
      costMatrix.set(i, 49 - j, Math.max(costMatrix.get(i, 49 - j), value));
      costMatrix.set(0 + j, i, Math.max(costMatrix.get(0 + j, i), value));
      costMatrix.set(49 - j, i, Math.max(costMatrix.get(49 - j, i), value));
    }
  }

  return costMatrix;
};
