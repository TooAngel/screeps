'use strict';

Room.prototype.getCostMatrixCallback = function(end, excludeStructures) {
  let callback = this.getMatrixCallback(end);
  if (cache.rooms[this.name] && cache.rooms[this.name].costMatrix && cache.rooms[this.name].costMatrix.base) {
    let room = this;
    callback = function(end) {
      let callbackInner = function(roomName) {
        let costMatrix = this.getMemoryCostMatrix();
        // TODO the ramparts could be within existing walls (at least when converging to the newmovesim
        costMatrix.set(end.x, end.y, 0);

        if (excludeStructures) {
          // TODO excluding structures, for the case where the spawn is in the wrong spot (I guess this can be handled better)
          let structures = room.find(FIND_STRUCTURES, {
            filter: function(object) {
              if (object.structureType == STRUCTURE_RAMPART) {
                return false;
              }
              if (object.structureType == STRUCTURE_ROAD) {
                return false;
              }
              if (object.structureType == STRUCTURE_CONTAINER) {
                return false;
              }
              return true;
            }
          });
          for (let structure of structures) {
            costMatrix.set(structure.pos.x, structure.pos.y, config.layout.structureAvoid);
          }
        }
        return costMatrix;
      };
      return callbackInner;
    };
  } else {
    this.log('getCostMatrixCallback updatePosition');
    this.updatePosition();
  }
};

Room.prototype.getCostMatrix = function() {
  let costMatrix = new PathFinder.CostMatrix();
  // Keep distance to walls
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      let roomPos = new RoomPosition(x, y, this.name);
      let terrain = roomPos.lookFor(LOOK_TERRAIN)[0];
      let cost = costMatrix.get(x, y);
      if (terrain == 'wall') {
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
