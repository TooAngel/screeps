'use strict';

module.exports.buildRoad = true;
module.exports.flee = true;

module.exports.boostActions = ['capacity'];

let pickup = function(creep, reverse) {
  if (creep.room.name == creep.memory.base && creep.memory.routing.pathPos < 2) {
    return reverse;
  }

  if (_.sum(creep.carry) < creep.carryCapacity) {

    // TODO Extract to somewhere (also in creep_harvester, creep_carry, config_creep_resources)
    let pickableResources = function(object) {
      return creep.pos.getRangeTo(object.pos.x, object.pos.y) < 2;
    };

    let resources = _.filter(creep.room.memory.droppedResources, pickableResources);

    if (resources.length > 0) {
      creep.pickup(resources[0]);
      return _.sum(creep.carry) + resources[0].amount > 0.5 * creep.carryCapacity;
    }

    if (creep.room.name == creep.memory.routing.targetRoom) {
      let containers = creep.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_CONTAINER) {
            return true;
          }
          return false;
        }
      });
      for (let container of containers) {
        let returnCode = creep.withdraw(container, RESOURCE_ENERGY);
        if (returnCode == OK) {}
        return container.store.energy > 10;
      }
    }
  }
  return reverse;
};


module.exports.preMove = function(creep, directions) {
  // Misplaced spawn
  if (creep.room.memory.misplacedSpawn || creep.room.controller.level < 3) {
    creep.say('mis', true);
    let targetId = creep.memory.target_id;
    if (creep.memory.routing) {
      targetId = creep.memory.routing.targetId;
    } else {
      console.log('No routing');
    }

    var source = Game.getObjectById(targetId);
    // TODO better the position from the room memory
    creep.moveTo(source.pos);
    if (creep.pos.getRangeTo(source.pos) > 1) {
      return true;
    }
  }


  if (!creep.room.controller) {
    var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        if (object.owner.username == 'Source Keeper') {
          return true;
        }
        return false;
      }
    });
    if (target !== null) {
      let range = creep.pos.getRangeTo(target);
      if (range > 6) {
        creep.memory.routing.reverse = false;
      }
      if (range < 6) {
        creep.memory.routing.reverse = true;
      }
    }
  }

  // TODO When does this happen? (Not on path?) - Handle better
  if (!directions) {
    creep.say('No directions');
    return false;
  }

  let reverse = checkForTransfer(creep, directions.forwardDirection);

  let carryPercentage = 0.1;
  if (creep.room.name == creep.memory.routing.targetRoom) {
    carryPercentage = 0.8;
  }
  if (creep.room.name == creep.memory.base) {
    carryPercentage = 0.0;
  }

  if (_.sum(creep.carry) > carryPercentage * creep.carryCapacity) {
    reverse = true;
    if (creep.room.name == creep.memory.base) {
      let transferred = creep.transferToStructures();
      if (transferred) {
        if (transferred.moreStructures) {
          return true;
        }
        reverse = creep.carry.energy - transferred.transferred > 0;
      } else if (!creep.room.storage && creep.memory.routing.pathPos === 0) {
        creep.say('Drop');
        creep.drop(RESOURCE_ENERGY);
        reverse = false;
      }
    }
    if (reverse) {
      // Have to invert the direction
      let directionTransferInvert = (+directions.backwardDirection + 7) % 8 + 1;
      if (directionTransferInvert && directionTransferInvert !== null) {
        reverse = !creep.transferToCreep(directionTransferInvert);
      }
    }
  }

  creep.memory.routing = creep.memory.routing || {
    // Some legacy values
    targetRoom: creep.memory.target,
    targetId: creep.memory.targetId || creep.memory.target_id
  };

  reverse = pickup(creep, reverse);
  if (reverse) {
    //     creep.log('reverse');
    directions.direction = directions.backwardDirection;
  } else {
    //     creep.log('not reverse');
    directions.direction = directions.forwardDirection;
  }
  creep.memory.routing.reverse = reverse;
};



module.exports.action = function(creep) {
  // TODO log when this happens, carry is getting energy from the source
  //   creep.log('ACTION');
  let source = Game.getObjectById(creep.memory.routing.targetId);
  if (source === null || (!creep.memory.targetId && creep.pos.getRangeTo(source.pos) > 1)) {
    creep.say('sfener');
    creep.memory.routing.reached = false;
    creep.memory.routing.reverse = true;

    let resource = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    if (resource !== null) {
      creep.memory.routing.targetId = resource.id;
      // TODO Use pathfinder
      creep.moveTo(resource);
      let returnCode = creep.pickup(resource, resource.amount - 1);
      return true;
    }
  }
  // TODO this should be last position => reverse - In preMove make sure a reverse stays if it is set here
  let reverse = false;
  reverse = pickup(creep, reverse);

  if (!reverse) {
    creep.harvest(source);
  }

  if (!creep.room.controller) {
    var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
      filter: function(object) {
        if (object.owner.username == 'Source Keeper') {
          return true;
        }
        return false;
      }
    });
    if (target !== null) {
      let range = creep.pos.getRangeTo(target);
      if (range < 5) {
        delete creep.memory.routing.reached;
        creep.memory.routing.reverse = true;
      }
    }
  }

  creep.memory.routing.reached = false;
  creep.memory.routing.reverse = true;

  return true;
};

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, CARRY];

  let partConfig = room.get_part_config(energy - 150, parts);
  partConfig.unshift(WORK);
  partConfig.unshift(MOVE);

  return partConfig;
};

module.exports.energyRequired = function(room) {
  // TODO make the factor dependent on e.g. room.storage or waiting duration in queue
  return Math.max(250, Math.min(room.controller.level * config.carry.size, room.energyCapacityAvailable - 300));
};

module.exports.energyBuild = function(room, energy) {
  return Math.max(250, Math.min(room.controller.level * config.carry.size, room.energyCapacityAvailable - 300));
};

function checkForTransfer(creep, direction) {
  if (!direction) {
    return false;
  }

  var pos;
  var creeps;
  var other_creep;
  var index_calc;
  var offset;
  var new_path;

  //  for (var direction = 1; direction < 9; direction++) {
  let adjacentPos = creep.pos.getAdjacentPosition(direction);

  if (adjacentPos.x < 0 || adjacentPos.y < 0) {
    return false;
  }
  if (adjacentPos.x > 49 || adjacentPos.y > 49) {
    return false;
  }

  creeps = adjacentPos.lookFor('creep');

  for (var name in creeps) {
    other_creep = creeps[name];
    if (!Game.creeps[other_creep.name]) {
      continue;
    }
    if (other_creep.carry.energy < 50) {
      continue;
    }
    if (Game.creeps[other_creep.name].memory.role == 'carry') {
      return other_creep.carry.energy + creep.carry.energy >= creep.carryCapacity;
    }
    if (Game.creeps[other_creep.name].memory.role == 'resourcecleaner') {
      return true;
    }
    continue;
  }
  //  }
  return false;
}


function carry(creep) {
  creep.say('carry');
  creep.pickupEnergy();
  // Previous room or start
  var start = 'Start';

  var target = Game.getObjectById(creep.memory.target_id);

  if (target === null) {
    creep.log('target null: ' + creep.memory.target_id);
    let resources = creep.room.find(FIND_DROPPED_RESOURCES);

    if (resources.length === 0) {
      creep.log('No resources found, do not know what to do');
      return false;
    }

    let resources_max = 0;
    let resource;
    for (resource of resources) {
      if (resource.amount > resources_max) {
        resources_max = resource.amount;
      }
    }
    var structure = resource.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.ticksToDecay === null) {
          return false;
        }
        if (object.structureType == 'controller') {
          return false;
        }
        if (object.structureType == 'road') {
          return false;
        }
        return true;
      }
    });

    if (structure !== null) {
      target = structure;
      creep.memory.target_id = structure.id;
    } else {
      //TODO don't know
    }
  }

  let returnCode;
  creep.say('ct: ' + checkForTransfer(creep));
  if (creep.room.name == creep.memory.base) {
    returnCode = creep.moveByPathMy(undefined, checkForTransfer(creep) || _.sum(creep.carry) > 0);
  } else {
    returnCode = creep.moveByPathMy(undefined, checkForTransfer(creep) || _.sum(creep.carry) > creep.carryCapacity / 2);
  }
  creep.harvest(target);
  //TODO Structurer case, when the path don't lead to the energy
  if (returnCode && _.sum(creep.carry) === 0 && creep.pos.getRangeTo(target) <= 2) {
    creep.say('2sfener');
    let resources = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3);
    if (resources.length > 0) {
      creep.moveTo(resources[0]);
      creep.pickup(resources[0]);
    }
  }
  return true;
}

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
  let target = Game.getObjectById(creep.memory.routing.targetId);
  if (target === null) {
    delete creep.memory.routing.targetId;
  }
  //  var reverse = check_for_transfer(creep);
  //  if (_.sum(creep.carry)) {
  //    if (creep.room.name == creep.memory.base) {
  //      if (creep.transferToStructures()) {
  //        return true;
  //      }
  //    }
  //    reverse = true;
  //
  //  }
  //
  //  creep.move_to_target_room(carry, reverse);

};
