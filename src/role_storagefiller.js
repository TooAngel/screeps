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

roles.storagefiller.settings = {
  layoutString: 'MC',
  amount: [1, 4],
};

roles.storagefiller.action = function(creep) {
  if (!creep.memory.routing.targetId && creep.memory.routing.reached) {
    creep.memory.routing.reached = false;
    creep.memory.routing.targetId = 'filler';
  }
  if (creep.memory.routing.reached && creep.memory.routing.pathPos === 0) {
    creep.memory.routing.reached = false;
  }

  creep.setNextSpawn();
  creep.spawnReplacement(1);

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

  if (creep.room.controller.level === 4) {
    if (towers.length > 0) {
      if (creep.carry.energy === 0) {
        creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
      } else {
        creep.transfer(towers[0], RESOURCE_ENERGY);
      }
    }
  }

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

  var storage = creep.room.storage;
  var link = Game.getObjectById(creep.memory.link);
  if (link === null) {
    //creep.log('No link');
    return true;
  }

  let room = Game.rooms[creep.room.name];
  if (room.memory.attackTimer > 50 && room.controller.level > 6) {
    creep.withdraw(storage, RESOURCE_ENERGY);
    for (let tower of towers) {
      let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
      if (returnCode === OK) {
        return true;
      }
    }
    creep.transfer(link, RESOURCE_ENERGY);
  } else {
    link.transferEnergy(creep);
    for (let tower of towers) {
      let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
      if (returnCode === OK) {
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
