'use strict';

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY];
  return room.get_part_config(energy, parts);
};

module.exports.energyBuild = function(room, energy) {
  return Math.max(1000, energy);
};

function execute(creep) {
  let costCallback = function(roomName, costmatrix) {
    if (roomName == 'E33N8') {
      costmatrix.set(25, 7, 0xFF);
      costmatrix.set(24, 9, 0xFF);
    }
    if (roomName == 'E33N9') {
      costmatrix.set(31, 24, 0xFF);
    }
    return costmatrix;
  };


  if (creep.carry.energy === 0 || (creep.room.name == 'E36N11' && creep.carry.energy < creep.carryCapacity)) {
    if (creep.room.name == 'E36N11') {
      let structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_STORAGE && object.store.energy > 0) {
            return true;
          }
          if (object.energy > 0) {
            return true;
          }
          return false;
        },
        ignoreCreeps: true,
        costCallback: costCallback
      });
      creep.moveTo(structure.pos, {
        ignoreCreeps: true,
        costCallback: costCallback
      });
      creep.withdraw(structure, RESOURCE_ENERGY);
    } else {
      let storageGet = new RoomPosition(27, 19, 'E36N11');
      creep.moveTo(storageGet, {
        ignoreCreeps: true,
        costCallback: costCallback
      });

    }
  } else {
    if (creep.room.name == 'E33N8') {
      let structure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_STORAGE) {
            return true;
          }
          if (object.structureType == STRUCTURE_TERMINAL) {
            return false;
          }
          if (object.structureType == STRUCTURE_LINK) {
            return false;
          }
          if (object.structureType == STRUCTURE_TOWER) {
            return false;
          }
          if (object.energy < object.energyCapacity) {
            return true;
          }
          return false;
        },
        ignoreCreeps: true,
        costCallback: costCallback
      });
      if (structure !== null) {
        creep.moveTo(structure.pos, {
          ignoreCreeps: true,
          costCallback: costCallback
        });
        creep.transfer(structure, RESOURCE_ENERGY);
      } else {
        creep.moveRandom();
      }

    } else {
      let storageSet = new RoomPosition(25, 8, 'E33N8');
      creep.moveTo(storageSet, {
        ignoreCreeps: true,
        costCallback: costCallback
      });

    }
  }
}


module.exports.execute = function(creep) {
  execute(creep);
};
