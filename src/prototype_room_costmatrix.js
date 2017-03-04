'use strict';

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
          costMatrix.set(pos.x, pos.y, Math.max(costMatrix.get(pos.x, pos.y), config.layout.wallAvoid));
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

Room.prototype.getAvoids = function(target, inRoom) {
  // TODO Only the matrix is enough?
  let callback = this.getMatrixCallback();

  if (this.memory.costMatrix && this.memory.costMatrix.base) {
    let room = this;
    callback = (roomName) => {
      let costMatrix = PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
      if (target && target.pos) {
        costMatrix.set(target.pos.x, target.pos.y, 0);
      }
      let structures = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_RAMPART, STRUCTURE_ROAD], true);
      for (let structure of structures) {
        costMatrix.set(structure.pos.x, structure.pos.y, 255);
      }

      // Noobie walls
      let walls = room.find(FIND_STRUCTURES, {
        filter: function(object) {
          if (object.structureType === STRUCTURE_WALL && !object.hits) {
            return true;
          }
          return false;
        }
      });
      for (let wall of walls) {
        costMatrix.set(wall.pos.x, wall.pos.y, 255);
      }

      if (target && target.scout) {
        let structures = room.find(FIND_STRUCTURES, {
          filter: function(object) {
            if (object.structureType === STRUCTURE_WALL) {
              return true;
            }
            return false;
          }
        });
        for (let structure of structures) {
          costMatrix.set(structure.pos.x, structure.pos.y, 255);
        }
      }
      return costMatrix;
    };
  } else {
    //    this.log('No costmatrix.base?');
    this.updatePosition();
  }
  return callback;
};
