'use strict';

Room.prototype.setCostMatrixStructures = function(costMatrix, structures, value) {
  for (let structure of structures) {
    costMatrix.set(structure.pos.x, structure.pos.y, value);
  }
};

Room.prototype.getCostMatrixCallback = function(end, excludeStructures) {
  let costMatrix = this.getMemoryCostMatrix();
  if (!costMatrix) {
    this.updatePosition();
  }

  let room = this;
  let callbackInner = (roomName) => {
    let costMatrix = room.getMemoryCostMatrix().clone();
    // TODO the ramparts could be within existing walls (at least when converging to the newmovesim
    if (end) {
      costMatrix.set(end.x, end.y, 0);
    }

    if (excludeStructures) {
      // TODO excluding structures, for the case where the spawn is in the wrong spot (I guess this can be handled better)
      let structures = room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_ROAD, STRUCTURE_CONTAINER], true);
      this.setCostMatrixStructures(costMatrix, structures, config.layout.structureAvoid);
    }
    return costMatrix;
  };
  return callbackInner;
};

Room.prototype.setCostMatrixPath = function(costMatrix, path) {
  for (let pos of path) {
    costMatrix.set(pos.x, pos.y, config.layout.pathAvoid);
  }
};

Room.prototype.increaseCostMatrixValue = function(costMatrix, pos, value) {
  costMatrix.set(pos.x, pos.y, Math.max(costMatrix.get(pos.x, pos.y), value));
};

Room.prototype.getCostMatrix = function() {
  let costMatrix = new PathFinder.CostMatrix();
  // Keep distance to walls
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      let roomPos = new RoomPosition(x, y, this.name);
      let terrain = roomPos.lookFor(LOOK_TERRAIN)[0];
      let cost = costMatrix.get(x, y);
      if (terrain === 'wall') {
        costMatrix.set(roomPos.x, roomPos.y, 0xFF);
        for (let i = 1; i < 9; i++) {
          let pos = new RoomPosition(x, y, this.name).getAdjacentPosition(i);
          this.increaseCostMatrixValue(costMatrix, pos, config.layout.wallAvoid);
        }
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
