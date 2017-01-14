'use strict';

function existInArray(array, item) {
  for (var i in array) {
    if (array[i].role === item.role) {
      return true;
    }
  }
  return false;
}

Creep.prototype.handleSourcer = function() {
  this.setNextSpawn();
  this.spawnReplacement();
  let room = Game.rooms[this.room.name];
  let targetId = this.memory.routing.targetId;
  var source = Game.getObjectById(targetId);

  let target = source;
  let returnCode = this.harvest(source);
  if (returnCode != OK && returnCode != ERR_NOT_ENOUGH_RESOURCES) {
    this.log('harvest: ' + returnCode);
    return false;
  }

  this.buildContainer();

  if (!this.room.controller || !this.room.controller.my || this.room.controller.level >= 2) {
    this.spawnCarry();
  }

  if (this.inBase()) {
    if (!this.memory.link) {
      let links = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
        filter: function(object) {
          if (object.structureType === STRUCTURE_LINK) {
            return true;
          }
          return false;
        }
      });
      if (links.length > 0) {
        this.memory.link = links[0].id;
      }
    }

    let link = Game.getObjectById(this.memory.link);
    this.transfer(link, RESOURCE_ENERGY);
  }
};

Creep.prototype.spawnCarry = function() {
  var energyThreshold = Game.rooms[this.memory.base].controller.level * config.sourcer.spawnCarryLevelMultiplier;
  var waitTime = config.sourcer.spawnCarryWaitTime;

  var spawn = {
    role: 'carry',
    routing: {
      targetRoom: this.memory.routing.targetRoom,
      targetId: this.memory.routing.targetId,
    }
  };

  // Spawn carry
  var energies = this.pos.lookFor(LOOK_ENERGY);
  if (energies.length === 0) {
    let containers = this.pos.findInRange(FIND_STRUCTURES, 0, {
      filter: function(object) {
        if (object.structureType != STRUCTURE_CONTAINER) {
          return false;
        }
        // TODO hardcoded for now, half of the container? Good idea?
        if (object.store.energy < 1000) {
          return false;
        }
        return true;
      }
    });
    if (containers.length === 0) {
      return false;
    }
  }

  if (energies.length > 0 && energies[0].amount < 50) {
    return false;
  }

  if (this.inBase()) {
    if (energies.length > 0 && energies[0].amount < energyThreshold) {
      return false;
    }
  }

  if (!existInArray(Game.rooms[this.memory.base].memory.queue, spawn)) {
    if (typeof(this.memory.wait) === 'undefined') {
      this.memory.wait = 0;
    }
    if (this.memory.wait <= 0) {
      Game.rooms[this.memory.base].checkRoleToSpawn('carry', 2, this.memory.routing.targetId, this.memory.routing.targetRoom);
      this.memory.wait = waitTime;
    }
  }
  this.memory.wait -= 1;
};
