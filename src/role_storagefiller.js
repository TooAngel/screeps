'use strict';

/*
 * storagefiller should be present on RCL > 4
 *
 * Normal:
 * Gets the energy from the link and transfers it to the tower of storage
 *
 * Under attack:
 * Gets the energy from the storage and transfers it to the link
 */

roles.storagefiller = {};
roles.storagefiller.killPrevious = true;

roles.storagefiller.getPartConfig = function(room, energy, heal) {
  var parts = [MOVE, CARRY, CARRY, CARRY, CARRY];
  return room.getPartConfig(energy, parts);
};

roles.storagefiller.energyBuild = function(room, energy) {
  return 200;
};

roles.storagefiller.action = function(creep) {
  creep.setNextSpawn();
  creep.spawnReplacement(1);

  if (!creep.memory.link) {
    var links = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
      filter: {
        structureType: STRUCTURE_LINK
      }
    });
    if (links.length === 0) {
      return true;
    }
    creep.memory.link = links[0].id;
  }

  let towers = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
    filter: function(object) {
      if (object.structureType != STRUCTURE_TOWER) {
        return false;
      }
      if (object.energy > 0.5 * object.energyCapacity) {
        return false;
      }
      return true;
    }
  });

  var storage = creep.room.storage;
  var link = Game.getObjectById(creep.memory.link);
  if (link === null) {
    //creep.log('No link');
    return true;
  }

  let room = Game.rooms[creep.room.name];
  if (room.memory.attack_timer > 50 && room.controller.level > 6) {
    creep.withdraw(storage, RESOURCE_ENERGY);
    for (let tower of towers) {
      let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
      if (returnCode == OK) {
        return true;
      }
    }
    creep.transfer(link, RESOURCE_ENERGY);
  } else {
    link.transferEnergy(creep);
    for (let tower of towers) {
      let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
      if (returnCode == OK) {
        return true;
      }
    }
    for (let resource in creep.carry) {
      creep.transfer(storage, resource);
    }
  }
  return true;
};

roles.storagefiller.execute = function(creep) {
  //  creep.log('Execute called, why?');
  //  creep.log(new Error().stack);
};
