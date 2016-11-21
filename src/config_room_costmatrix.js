'use strict';

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


Room.prototype.getAvoids = function(target, inRoom) {
  // TODO Only the matrix is enough?
  let callback = this.getMatrixCallback();

  if (this.memory.costMatrix && this.memory.costMatrix.base) {
    let room = this;
    callback = function(roomName) {
      let costMatrix = PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
      if (target && target.pos) {
        costMatrix.set(target.pos.x, target.pos.y, 0);
      }

      let structures = room.find(FIND_STRUCTURES, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_RAMPART) {
            return false;
          }
          if (object.structureType == STRUCTURE_ROAD) {
            return false;
          }
          return true;
        }
      });
      for (let structure of structures) {
        costMatrix.set(structure.pos.x, structure.pos.y, 255);
      }

      // Noobie walls
      let walls = room.find(FIND_STRUCTURES, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_WALL && !object.hits) {
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
            if (object.structureType == STRUCTURE_WALL) {
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
    this.log('No costmatrix.base?');
    this.updatePosition();
  }
  if (true) return callback;


  var x;
  var y;

  var avoid = [];
  if (!target) {
    target = {};
  }

  var source_keepers = this.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return object.owner.username == 'Source Keeper';
    }
  });

  for (var source_keepers_id in source_keepers) {
    avoid.push(source_keepers[source_keepers_id].pos);
  }

  var sources = this.find(FIND_SOURCES, {
    filter: function(object) {
      return object.id != target.source_id;
    }
  });

  if (!target.sources) {
    for (var sources_id in sources) {
      if (target.source_id == sources[sources_id].id || target.targetId == sources[sources_id].id) {
        continue;
      }

      if (this.memory.layout) {
        var pos = this.memory.layout['sourcer-' + sources[sources_id].id][0];
        avoid.push(new RoomPosition(pos.x, pos.y, this.name));
      } else {
        for (x = -1; x < 2; x++) {
          for (y = -1; y < 2; y++) {
            var source = sources[sources_id];
            avoid.push(new RoomPosition(source.pos.x + x, source.pos.y + y, this.name));
          }
        }
      }
    }
  }

  if (this.controller && !target.controller && this.controller.id != target.targetId) {
    if (this.memory.layout) {
      avoid.push(new RoomPosition(this.memory.layout.builder[0].x, this.memory.layout.builder[0].y, this.name));
    } else {
      for (x = -1; x < 2; x++) {
        for (y = -1; y < 2; y++) {
          avoid.push(new RoomPosition(this.controller.pos.x + x, this.controller.pos.y + y, this.name));
        }
      }
    }
  }

  if (this.memory.layout) {
    if (!target.filler) {
      avoid.push(new RoomPosition(this.memory.layout.filler[0].x, this.memory.layout.filler[0].y, this.name));
    }
  }

  if (this.memory.layout && this.memory.layout.towerFiller) {
    if (!target.towerFiller) {
      for (let towerFillerPos of this.memory.layout.towerFiller) {
        avoid.push(new RoomPosition(towerFillerPos.x, towerFillerPos.y, this.name));
      }
    }
  }


  var callbackNew = function(roomName, costMatrix) {
    if (!costMatrix) {
      costMatrix = new PathFinder.CostMatrix();
      let structures = this.find(FIND_STRUCTURES, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_ROAD) {
            return false;
          }
          if (object.structureType == STRUCTURE_RAMPART) {
            return false;
          }
          return true;
        }
      });
      for (let i in structures) {
        let structure = structures[i];
        costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
      }
      let constructionSites = this.find(FIND_CONSTRUCTION_SITES, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_ROAD) {
            return false;
          }
          if (object.structureType == STRUCTURE_RAMPART) {
            return false;
          }
          return true;
        }
      });
      for (let i in constructionSites) {
        let constructionSite = constructionSites[i];
        costMatrix.set(constructionSite.pos.x, constructionSite.pos.y, 0xFF);
      }
    }
    for (var avoidIndex in avoid) {
      let avoidPos = avoid[avoidIndex];
      costMatrix.set(avoidPos.x, avoidPos.y, 0xFF);
    }

    // Ignore walls (maybe only disable the newbie ones)
    let walls = this.find(FIND_STRUCTURES, {
      filter: function(object) {
        return object.structureType == STRUCTURE_WALL;
      }
    });
    for (let wallId in walls) {
      let wall = walls[wallId];
      costMatrix.set(wall.pos.x, wall.pos.y, 0xFF);
    }

    // Disable exits, if inRoom
    if (inRoom) {
      for (var i = 0; i < 50; i++) {
        costMatrix.set(i, 0, 0xFF);
        costMatrix.set(i, 49, 0xFF);
        costMatrix.set(0, i, 0xFF);
        costMatrix.set(49, i, 0xFF);
      }
    }

    return costMatrix;
  };

  return callbackNew;
};
