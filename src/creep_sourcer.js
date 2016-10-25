'use strict';

var helper = require('helper');

module.exports.buildRoad = true;
module.exports.killPrevious = true;

// TODO should be true, but flee must be fixed before 2016-10-13
module.exports.flee = false;

module.exports.get_part_config = function(room, energy, heal) {
  var parts = [MOVE, CARRY, WORK, WORK, WORK, WORK, MOVE, MOVE, WORK, HEAL, MOVE, HEAL, MOVE, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE];
  return room.get_part_config(energy, parts);
};

module.exports.preMove = function(creep, directions) {
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



  // TODO Check if this is working
  if (directions) {
    let pos = creep.pos.buildRoomPosition(directions.direction);
    creep.moveCreep(pos, (directions.direction + 3) % 8 + 1);
  }

  // TODO copied from nextroomer, should be extracted to a method or a creep flag
  // Remove structures in front
  if (!directions) {
    return false;
  }
  // TODO when is the forwardDirection missing?
  if (directions.forwardDirection) {
    let posForward = creep.pos.getAdjacentPosition(directions.forwardDirection);
    let structures = posForward.lookFor(LOOK_STRUCTURES);
    for (let structure of structures) {
      if (structure.structureType == STRUCTURE_ROAD) {
        continue;
      }
      if (structure.structureType == STRUCTURE_RAMPART && structure.my) {
        continue;
      }
      creep.dismantle(structure);
      creep.say('dismantle');
      break;
    }
  }
};

module.exports.energyBuild = function(room, energy, source, heal) {
  var max = 700;
  // TODO Only three parts for external sourcer (Double check how many parts)
  //  room.log('creep_sourcer.energyBuild source: ' + JSON.stringify(source));
  if (heal) {
    max = 1450;
  }
  energy = Math.max(200, Math.min(max, room.energyCapacityAvailable));
  return energy;
};

module.exports.died = function(name, memory) {
  console.log(name, 'died', memory.base, memory.source.roomName);
  delete Memory.creeps[name];
};

module.exports.action = function(creep) {
  // TODO Fix for sourcers without routing.targetId
  if (!creep.memory.routing.targetId) {
    if (!Game.rooms[creep.memory.source.roomName]) {
      creep.memory.routing.targetRoom = creep.memory.source.roomName;
      creep.memory.routing.reached = false;
      delete creep.memory.routing.route;
      return true;
    }

    let sourcePos = new RoomPosition(creep.memory.source.x, creep.memory.source.y, creep.memory.source.roomName);
    let sources = sourcePos.lookFor(LOOK_SOURCES);
    if (sources[0]) {
      creep.log('Reached, but not near source !!!!');
      creep.memory.routing.reached = false;
      creep.memory.routing.targetId = sources[0].id;
    } else {
      creep.log("!!! config_creep_routing sourcer No sources at source: " + creep.memory.source + ' targetId: ' + creep.memory.targetId);
    }
  }


  // TODO check source keeper structure for ticksToSpawn
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

  work(creep);
  return true;
};

function checkContainer(creep) {
  if (creep.room.name == creep.memory.base) {
    return false;
  }
  // TODO Not in base room
  var objects = creep.pos.findInRange(FIND_STRUCTURES, 0, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_CONTAINER) {
        return true;
      }
      return false;
    }
  });
  if (objects.length === 0) {
    if (creep.carry.energy >= 50) {
      let constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 0, {
        filter: function(object) {
          if (object.structureType != STRUCTURE_CONTAINER) {
            return false;
          }
          return true;
        }
      });
      if (constructionSites.length > 0) {
        let returnCode = creep.build(constructionSites[0]);
        if (returnCode != OK) {
          creep.log('build container: ' + returnCode);
        }
        return true;
      }

      let returnCode = creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
      if (returnCode == OK) {
        creep.log('Create cs for container');
        return true;
      }
      if (returnCode == ERR_INVALID_TARGET) {
        let constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 0);
        for (let constructionSite of constructionSites) {
          constructionSite.remove();
        }
        return false;
      }
      if (returnCode != ERR_FULL) {
        creep.log('Container: ' + returnCode + ' pos: ' + creep.pos);
      }
      return false;
    }
  }
  if (objects.length > 0) {
    let object = objects[0];
    if (object.hits < object.hitsMax) {
      creep.repair(object);
    }
  }
}

function killPreviousSourcerer(creep) {
  var other_sourcer = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.id == creep.id) {
        return false;
      }
      if (object.memory.role == 'sourcer' && object.memory.target_id == creep.memory.target_id) {
        return true;
      }
      return false;
    }
  });
  if (other_sourcer === null) {
    return false;
  }

  var range = creep.pos.getRangeTo(other_sourcer);
  if (range == 1) {
    if (other_sourcer.ticksToLive > creep.ticksToLive) {
      creep.log('sourcer: Kill me');
      creep.suicide();
    } else {
      //creep.log('Kill other sourcerer ' + range + ' ' + creep.name + ' ' + creep.memory.target_id);
      other_sourcer.memory.killed = true;
      creep.log('sourcer: Kill other');
      other_sourcer.suicide();
    }
  }
}

function work(creep) {
  creep.setNextSpawn();
  creep.spawnReplacement();
  let room = Game.rooms[creep.room.name];

  // TODO legacy stuff
  let targetId = creep.memory.target_id;
  if (creep.memory.routing) {
    targetId = creep.memory.routing.targetId;
  } else {
    console.log('No routing');
  }

  var source = Game.getObjectById(targetId);

  let target = source;
  let returnCode = creep.harvest(source);
  if (returnCode != OK && returnCode != ERR_NOT_ENOUGH_RESOURCES) {
    creep.log('harvest: ' + returnCode);
    return false;
  }

  checkContainer(creep);

  if (!creep.room.controller || !creep.room.controller.my || creep.room.controller.level >= 2) {
    creep.spawnCarry();
  }

  if (creep.room.name == creep.memory.base) {
    if (!creep.memory.link) {
      let links = creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
        filter: function(object) {
          if (object.structureType == STRUCTURE_LINK) {
            return true;
          }
          return false;
        }
      });
      if (links.length > 0) {
        creep.memory.link = links[0].id;
      }
    }

    let link = Game.getObjectById(creep.memory.link);
    creep.transfer(link, RESOURCE_ENERGY);
  }
}

module.exports.execute = function(creep) {
  creep.log('Execute!!!');
  creep.memory.routing.targetReached = true;
  work(creep);
  //  throw new Error();
};
