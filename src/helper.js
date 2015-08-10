'use strict';

function check_for_source_or_wall(pos) {
  var look_items = pos.look();
  for (var look_item in look_items) {
    if (look_items[look_item].type == 'source') {
      return true;
    }
    if (look_items[look_item].type == 'terrain' &&
      look_items[look_item].terrain == 'wall') {
      return true;
    }
  }
  return false;
}


module.exports = {
  getAvoids: function(room, target, inRoom) {
    // TODO Only the matrix is enough?
    let callback = room.getMatrixCallback();

    if (room.memory.costMatrix && room.memory.costMatrix.base) {
      callback = function(roomName) {
        let costMatrix = PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
        if (target && target.pos) {
          costMatrix.set(target.pos.x, target.pos.y, 0);
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
      room.log('No costmatrix.base?');
      room.updatePosition();
    }
    if (true) return callback;


    var x;
    var y;

    var avoid = [];
    if (!target) {
      target = {};
    }

    var source_keepers = room.find(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        return object.owner.username == 'Source Keeper';
      }
    });

    for (var source_keepers_id in source_keepers) {
      avoid.push(source_keepers[source_keepers_id].pos);
    }

    var sources = room.find(FIND_SOURCES, {
      filter: function(object) {
        return object.id != target.source_id;
      }
    });

    if (!target.sources) {
      for (var sources_id in sources) {
        if (target.source_id == sources[sources_id].id || target.targetId == sources[sources_id].id) {
          continue;
        }

        if (room.memory.layout) {
          var pos = room.memory.layout['sourcer-' + sources[sources_id].id][0];
          avoid.push(new RoomPosition(pos.x, pos.y, room.name));
        } else {
          for (x = -1; x < 2; x++) {
            for (y = -1; y < 2; y++) {
              var source = sources[sources_id];
              avoid.push(new RoomPosition(source.pos.x + x, source.pos.y + y, room.name));
            }
          }
        }
      }
    }

    if (room.controller && !target.controller && room.controller.id != target.targetId) {
      if (room.memory.layout) {
        avoid.push(new RoomPosition(room.memory.layout.builder[0].x, room.memory.layout.builder[0].y, room.name));
      } else {
        for (x = -1; x < 2; x++) {
          for (y = -1; y < 2; y++) {
            avoid.push(new RoomPosition(room.controller.pos.x + x, room.controller.pos.y + y, room.name));
          }
        }
      }
    }

    if (room.memory.layout) {
      if (!target.filler) {
        avoid.push(new RoomPosition(room.memory.layout.filler[0].x, room.memory.layout.filler[0].y, room.name));
      }
    }

    if (room.memory.layout && room.memory.layout.towerFiller) {
      if (!target.towerFiller) {
        for (let towerFillerPos of room.memory.layout.towerFiller) {
          avoid.push(new RoomPosition(towerFillerPos.x, towerFillerPos.y, room.name));
        }
      }
    }


    var callbackNew = function(roomName, costMatrix) {
      if (!costMatrix) {
        costMatrix = new PathFinder.CostMatrix();
        let structures = room.find(FIND_STRUCTURES, {
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
        let constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
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
      let walls = room.find(FIND_STRUCTURES, {
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
  },

  find_attack_creep: function(object) {
    let friends = [];
    try {
      friends = require('friends');
    } catch (error) {

    }

    if (object.owner.username == 'Source Keeper') {
      return false;
    }

    if (friends.indexOf(object.owner.username) >= 0) {
      console.log('friend found');
      return false;
    }

    for (var item in object.body) {
      var part = object.body[item];
      if (part.energy === 0) {
        continue;
      }
      if (part.type == 'attack') {
        return true;
      }
      if (part.type == 'ranged_attack') {
        return true;
      }
      if (part.type == 'heal') {
        return true;
      }
      if (part.type == 'work') {
        return true;
      }
      if (part.type == 'claim') {
        return true;
      }
    }
    return true;
    // TODO defender stop in rooms with (non attacking) enemies
    //    return false;
  },

  transferables: function(object) {
    if (object.structureType == STRUCTURE_RAMPART) {
      return false;
    }
    if (!object.my) {
      return false;
    }
    if (object.structureType == STRUCTURE_CONTROLLER) {
      return false;
    }
    if (object.structureType == STRUCTURE_EXTENSION) {
      return object.energy < object.energyCapacity;
    }
    if (object.structureType == STRUCTURE_LINK) {
      return object.energy < object.energyCapacity;
    }
    if (object.structureType == STRUCTURE_SPAWN) {
      return object.energy < object.energyCapacity;
    }
    if (object.structureType == STRUCTURE_STORAGE) {
      return object.store.energy < object.storeCapacity;
    }
    if (object.structureType == STRUCTURE_TOWER) {
      return object.energy < object.energyCapacity;
    }
    if (object.structureType == STRUCTURE_POWER_SPAWN) {
      return false;
    }
    if (object.structureType == STRUCTURE_OBSERVER) {
      return false;
    }
    console.log('helper.transferables', object.structureType, JSON.stringify(object));
  },

  transferablesFull: function(object) {
    if (object.structureType == STRUCTURE_RAMPART) {
      return false;
    }
    if (object.structureType == STRUCTURE_CONTROLLER) {
      return false;
    }
    if (object.structureType == STRUCTURE_EXTENSION) {
      return object.energy > 0;
    }
    if (object.structureType == STRUCTURE_LINK) {
      return object.energy > 0;
    }
    if (object.structureType == STRUCTURE_SPAWN) {
      return object.energy > 0;
    }
    if (object.structureType == STRUCTURE_STORAGE) {
      return object.store.energy > 0;
    }
    if (object.structureType == STRUCTURE_TOWER) {
      return false;
    }
    if (object.structureType == STRUCTURE_POWER_SPAWN) {
      return false;
    }
    if (object.structureType == STRUCTURE_OBSERVER) {
      return false;
    }
    console.log('helper.transferablesFull', object.structureType, JSON.stringify(object));
  }
};
