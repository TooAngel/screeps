'use strict';

Creep.prototype.pickupEnergy = function() {
  // TODO Extract to somewhere (also in creep_harvester, creep_carry, config_creep_resources)
  let creep = this;
  let pickableResources = function(object) {
    return creep.pos.getRangeTo(object.pos.x, object.pos.y) < 2;
  };

  let resources = _.filter(this.room.memory.droppedResources, pickableResources);

  if (resources.length > 0) {
    let returnCode = this.pickup(resources[0]);
    return returnCode == OK;
  }

  let containers = this.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_CONTAINER) {
        return true;
      }
      return false;
    }
  });
  if (containers.length > 0) {
    let returnCode = this.withdraw(containers[0], RESOURCE_ENERGY);
    if (returnCode == OK) {
      return true;
    }
  }

  let sourcers = this.pos.findInRange(FIND_MY_CREEPS, 1, {
    filter: function(object) {
      if (object.memory.role == 'sourcer') {
        return true;
      }
      return false;
    }
  });
  if (sourcers.length > 0) {
    let returnCode = sourcers[0].transfer(this, RESOURCE_ENERGY);
    if (returnCode == OK) {
      return true;
    }
  }

  return false;
};

// After introduction of `routing` take the direction to transfer to
Creep.prototype.transferToCreep = function(direction) {
  // TODO Only forward proper
  for (var index = -1; index < 2; index++) { // Only forward
    let indexCalc = (+direction + 7 + index) % 8 + 1;
    let adjacentPos = this.pos.getAdjacentPosition(indexCalc);
    if (adjacentPos.x < 0 || adjacentPos.y < 0) {
      continue;
    }
    if (adjacentPos.x > 49 || adjacentPos.y > 49) {
      continue;
    }
    var creeps = adjacentPos.lookFor('creep');
    for (var name in creeps) {
      var other_creep = creeps[name];
      if (!Game.creeps[other_creep.name]) {
        continue;
      }
      // Do we want this?
      if (Game.creeps[other_creep.name].memory.role == 'powertransporter') {
        continue;
      }
      if (other_creep.carry.energy == other_creep.carryCapacity) {
        continue;
      }
      var return_code = this.transfer(other_creep, RESOURCE_ENERGY);
      if (return_code == OK) {
        // return true;
        return this.carry.energy * 0.5 <= other_creep.carryCapacity - other_creep.carry.energy;
      }
    }
  }
  return false;
};

Creep.prototype.transferToStructures = function() {
  let transferred = false;

  let creep = this;

  let filterTransferrables = function(object) {
    if (object.structureType == STRUCTURE_TERMINAL && (object.store.energy || 0) > 10000) {
      return false;
    }
    let factor = 0.9;
    if (creep.memory.role == 'harvester') {
      factor = 0.4;
    }
    if (object.structureType == STRUCTURE_TOWER && object.energy > factor * object.energyCapacity) {
      return false;
    }

    if (creep.memory.role == 'harvester' && object.structureType == STRUCTURE_STORAGE) {
      return false;
    }

    if (creep.memory.role == 'harvester' && object.structureType == STRUCTURE_LINK) {
      return false;
    }

    if ((object.structureType == STRUCTURE_LAB ||
        object.structureType == STRUCTURE_EXTENSION ||
        object.structureType == STRUCTURE_SPAWN ||
        object.structureType == STRUCTURE_NUKER ||
        object.structureType == STRUCTURE_POWER_SPAWN ||
        object.structureType == STRUCTURE_LINK) &&
      object.energy == object.energyCapacity) {
      return false;
    }

    return creep.pos.getRangeTo(object.pos) < 2;
  };

  let structures = _.filter(creep.room.memory.transferableStructures, filterTransferrables);

  if (structures.length > 0) {
    let returnCode = -1;
    for (let structure of structures) {
      //       let resource = 'energy';
      for (let resource in this.carry) {
        returnCode = this.transfer(structure, resource);
        if (returnCode == OK) {
          return {
            moreStructures: structures.length > 1,
            // TODO handle different type of resources on the structure side
            transferred: Math.min(this.carry[resource], structure.energyCapacity - structure.energy)
          };
        }
        this.log('TransferToStructure: ' + returnCode + ' pos: ' + structure.pos + ' resource: ' + resource);
      }
    }
  }
  return false;
};


function get_structure(creep) {
  // creep.log('findClosestByPath - now range');

  // var stack = new Error().stack;
  // console.log(stack);

  // var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
  var structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
    filter: function(object) {
      if (object.energy == object.energyCapacity) {
        return false;
      }
      // TODO disabled high cpu
      // if (!object.isActive()) {
      // return false;
      // }
      if (!object.my) {
        return false;
      }
      if (object.structureType == 'extension') {
        return true;
      }
      if (object.structureType == 'spawn') {
        return true;
      }
      if (object.structureType == STRUCTURE_TOWER) {
        // TODO: If the room has to less energy, should be adapted some how
        if (creep.room.energyAvailable < 1000) {
          // if (creep.memory.role == 'harvester') {
          return false;
        }
        return object.energy < 10;
      }
      return false;
    }
  });
  return structure;
}

Creep.prototype.transferMy = function() {
  var pos;
  var structures;
  var structure;
  var creeps;
  var other_creep;
  var offset;
  var index;
  var return_code;
  var name;

  for (let direction = 1; direction < 9; direction++) {
    let adjacentPos = this.pos.getAdjacentPosition(direction);
    if (adjacentPos.x < 0 || adjacentPos.y < 0) {
      continue;
    }
    if (adjacentPos.x > 49 || adjacentPos.y > 49) {
      continue;
    }
    creeps = adjacentPos.lookFor('creep');
    for (name in creeps) {
      other_creep = creeps[name];
      if (!other_creep.my) {
        continue;
      }
      if (other_creep.carry.energy == other_creep.carryCapacity) {
        continue;
      }
      return_code = this.transfer(other_creep, RESOURCE_ENERGY);
      return return_code === 0;
    }
  }
  return false;
};

Creep.prototype.getEnergy = function() {
  if (this.carry.energy == this.carryCapacity) {
    return false;
  }
  this.say('energy');

  var target = this.pos.findClosestByRange(FIND_DROPPED_ENERGY, {
    filter: function(object) {
      return object.energy > 12;
    }
  });
  if (target !== null) {
    this.say('dropped');
    var energy_range = this.pos.getRangeTo(target);
    if (energy_range <= 1) {
      this.pickup(target);
      return false;
    }
    if (target.energy > 20 && energy_range < 18 && this.carry.energy === 0) {
      if (!this.memory.routing) {
        this.memory.routing = {};
      }
      if (!this.memory.routing.cache) {
        this.memory.routing.cache = {};
      }
      if (!this.memory.routing.cache[target.id]) {
        let search = PathFinder.search(
          this.pos, {
            pos: target.pos,
            range: 1
          }, {
            roomCallback: this.room.getAvoids(this.room, {}, true),
            maxRooms: 0
          }
        );
        if (search.path.length === 0 || search.incomplete) {
          this.say('deir');
          this.moveRandom();
          return true;
        }
        this.memory.routing.cache[target.id] = search;
      }


      let path = this.memory.routing.cache[target.id].path;
      let pos = _.findIndex(path, i => i.x == this.pos.x && i.y == this.pos.y);
      // if (pos < 0) {
      // this.log(JSON.stringify(path));
      // this.say('no path pos');
      // delete this.memory.routing.cache[target.id];
      // return true;
      // }
      // this.log(pos);
      if (!path[pos + 1]) {
        this.log('config_creep_resources.getEnergy EOP pos: ' + pos + ' path: ' + JSON.stringify(path) + ' target: ' + target.pos + ' pos: ' + this.pos);
        this.say('EOP');
        delete this.memory.routing.cache[target.id];
        this.moveRandom();
        return true;
      }
      if (this.pos.getRangeTo(path[pos + 1].x, path[pos + 1].y) > 1) {
        delete this.memory.routing.cache[target.id];
        return true;
      }
      this.say('de:' + this.pos.getDirectionTo(path[pos + 1].x, path[pos + 1].y), true);
      if (!this.pos.getDirectionTo(path[pos + 1].x, path[pos + 1].y)) {
        this.log(pos + ' ' + this.pos.getDirectionTo(path[pos + 1].x, path[pos + 1].y) + ' ' + JSON.stringify(path));
        this.say('no path pos');
        delete this.memory.routing.cache[target.id];
        return true;
      }
      let returnCode = this.move(this.pos.getDirectionTo(path[pos + 1].x, path[pos + 1].y));
      return true;
    }
  }

  let hostileStructures = this.room.find(FIND_HOSTILE_STRUCTURES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_CONTROLLER) {
        return false;
      }
      if (object.structureType == STRUCTURE_STORAGE && object.store.energy === 0) {
        return false;
      }
      if (object.energy === 0) {
        return false;
      }
      return true;
    }
  });
  hostileStructures = _.sortBy(hostileStructures, function(object) {
    if (object.structureType == STRUCTURE_STORAGE) {
      return 1;
    }
    return 2;
  });
  if (hostileStructures.length > 0 && !this.carry.energy) {
    let structure = hostileStructures[0];
    let range = this.pos.getRangeTo(structure);
    if (this.carry.energy === 0 || range < 5) {
      this.say('hostile');
      this.moveTo(structure);
      this.withdraw(structure, RESOURCE_ENERGY);
      return true;

    }

  }

  var range = null;
  var item = this.pos.findClosestByRange(FIND_SOURCES_ACTIVE);

  if (item === null) {
    if (this.carry.energy === 0) {
      var source = this.pos.findClosestByRange(FIND_SOURCES);
      this.moveTo(source, {
        reusePath: 5,
        ignoreCreeps: true,
        costCallback: this.room.getAvoids(this.room)

      });
      return true;
    } else {
      return false;
    }
  }

  range = this.pos.getRangeTo(item);
  this.say('range:' + range, true);
  if (this.carry.energy > 0 && range > 1) {
    return false;
  }

  if (range == 1) {
    let sourcers = this.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter: function(object) {
        let creep = Game.getObjectById(object.id);
        if (creep.memory.role == 'sourcer' && creep.carry.energy > 0) {
          return true;
        }
        return false;
      }
    });
    if (sourcers.length > 0) {
      let returnCode = sourcers[0].transfer(this, RESOURCE_ENERGY);
      this.say('rr:' + returnCode);
      if (returnCode == OK) {
        return true;
      }
    }
  }

  if (typeof(this.memory.target) != 'undefined') {
    delete this.memory.target;
  }

  if (range == 1) {
    this.harvest(item);
    if (this.carry.energy >= this.carryCapacity) {
      var creep = this;
      var creep_without_energy = this.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: function(object) {
          return object.carry.energy === 0 && object.id != creep.id;
        }
      });
      range = this.pos.getRangeTo(creep_without_energy);

      if (range == 1) {
        this.transfer(creep_without_energy, RESOURCE_ENERGY);
      }
    }
    // TODO Somehow we move before preMove, canceling here
    this.cancelOrder('move');
    this.cancelOrder('moveTo');
    return true;
  } else {
    if (!this.memory.routing) {
      this.memory.routing = {};
    }
    this.memory.routing.reverse = false;

    this.moveByPathMy([{
      'name': this.room.name
    }], 0, 'pathStart', item.id, true, undefined);
    return true;
  }
};

Creep.prototype.repairStructure = function() {
  var structure = null;
  var range = null;
  var i = null;
  var structures = null;

  this.say('repair', true);

  if (this.memory.target) {
    var to_repair = Game.getObjectById(this.memory.target);
    if (!to_repair || to_repair === null) {
      delete this.memory.target;
    } else {
      if (to_repair instanceof ConstructionSite) {
        this.build(to_repair);

        let search = PathFinder.search(
          this.pos, {
            pos: to_repair.pos,
            range: 3
          }, {
            roomCallback: this.room.getAvoids(this.room, {}, true),
            maxRooms: 0
          }
        );

        if (search.incomplete) {
          this.moveTo(to_repair);
          return true;
        }

        if (!this.pos.getDirectionTo(search.path[0])) {
          this.moveRandom();
          return true;
        }

        this.say('cs:' + this.pos.getDirectionTo(search.path[0]));
        let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
        return true;
      } else if (to_repair.hits < 10000 || to_repair.hits < this.memory.step + 10000) {
        this.repair(to_repair);
        if (this.fatigue === 0) {
          range = this.pos.getRangeTo(to_repair);
          if (range <= 3) {
            this.moveRandom();
          } else {
            let search = PathFinder.search(
              this.pos, {
                pos: to_repair.pos,
                range: 3
              }, {
                roomCallback: this.room.getAvoids(this.room, {}, true),
                maxRooms: 0
              }
            );

            if (!this.pos.getDirectionTo(search.path[0])) {
              this.say('rep: random');
              this.moveRandom();
              return true;
            }

            if (search.incomplete) {
              this.say('repi');
              this.moveTo(to_repair.pos);
              return true;
            }

            this.say('rep: ' + this.pos.getDirectionTo(search.path[0]));

            let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
            this.memory.lastPosition = this.pos;
            if (returnCode == OK) {
              return true;
            }
            if (returnCode == ERR_NO_PATH) {
              this.memory.move_wait = 0;
              this.log(JSON.stringify(search));
              this.log('No path : ' + JSON.stringify(search));
              returnCode = this.moveTo(to_repair, {
                ignoreCreeps: true,
                costCallback: this.room.getAvoids(this.room, {
                  power: true
                })
              });
            }
            this.log('config_creep_resources.repairStructure moveByPath.returnCode: ' + returnCode + ' search: ' + JSON.stringify(search) + ' start: ' + JSON.stringify(this.pos) + ' end: ' + JSON.stringify(to_repair.pos));
            return true;
          }
        }
      } else {
        delete this.memory.target;
      }
    }
  }

  let nukes = this.room.find(FIND_NUKES);
  if (nukes.length > 0) {
    let spawns = this.room.find(FIND_MY_STRUCTURES, {
      filter: function(object) {
        if (object.structureType != STRUCTURE_SPAWN) {
          return false;
        }
        return true;
      }
    });
    if (spawns.length > 0) {
      for (let spawn of spawns) {
        let found = false;
        let rampart;
        structures = spawn.pos.lookFor(LOOK_STRUCTURES);
        for (structure of structures) {
          if (structure.structureType == STRUCTURE_RAMPART) {
            if (structure.hits < 1100000) {
              found = true;
              rampart = structure;
              break;
            }
          }
        }
        if (found) {
          this.memory.target = rampart.id;
          this.memory.step = 1200000;
          return true;
        }
      }
    }
  }

  // Repair low ramparts
  let lowRamparts = this.pos.findInRange(FIND_STRUCTURES, 4, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_RAMPART && object.hits < 10000) {
        return true;
      }
      return false;
    }
  });

  if (lowRamparts.length > 0) {
    let search = PathFinder.search(
      this.pos, {
        pos: lowRamparts[0].pos,
        range: 3
      }, {
        roomCallback: this.room.getAvoids(this.room, {}, true),
        maxRooms: 0
      }
    );
    //     this.log('LowRampart: ' + lowRamparts[0].pos + ' search: ' + JSON.stringify(search));
    let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    this.repair(lowRamparts[0]);
    this.moveRandom();
    return true;
  }

  // Build construction sites
  var target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (object.structureType == 'constructedWall') {
        return true;
      }
      if (object.structureType == 'rampart') {
        return true;
      }
      return false;
    }
  });

  if (target !== null) {
    this.say('cs');
    range = this.pos.getRangeTo(target);

    if (range <= 3) {
      this.build(target);
      this.memory.step = 0;
      var targetNew = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
        filter: function(object) {
          if (object.id == target.id) {
            return false;
          }
          if (object.structureType == 'constructedWall') {
            return true;
          }
          if (object.structureType == 'rampart') {
            return true;
          }
          return false;
        }
      });
      if (targetNew !== null) {
        target = targetNew;
      }
    }
    let ignoreCreepsSwitch = true;
    let last_pos = this.memory.lastPosition;
    if (this.memory.lastPosition && this.pos.isEqualTo(new RoomPosition(last_pos.x, last_pos.y, this.room.name))) {
      this.memory.move_wait++;
      if (this.memory.move_wait > 5) {
        ignoreCreepsSwitch = false;
      }
    } else {
      this.memory.move_wait = 0;
    }

    let search = PathFinder.search(
      this.pos, {
        pos: target.pos,
        range: 3
      }, {
        roomCallback: this.room.getAvoids(this.room, {}, true),
        maxRooms: 0
      }
    );
    this.log('ConstructionSite: ' + target.pos + ' search: ' + JSON.stringify(search));
    // for (let x = 19; x < 31; x++) {
    // for (let y = 2; y < 7; y++) {
    // let costmatrix = this.room.getAvoids(this.room, {}, true)(this.room.name);
    // this.log(x + ',' + y + ' ' + costmatrix.get(x, y));
    // }
    // }
    let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    this.memory.lastPosition = this.pos;
    this.memory.target = target.id;
    return true;
  }

  var creep = this;
  structure = this.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: function(object) {

      // Newbie zone walls have no hits
      if (!object.hits) {
        return false;
      }

      if (object.hits >= Math.min(creep.memory.step, object.hitsMax)) {
        return false;
      }

      if (object.structureType == 'constructedWall') {
        return true;
      }

      if (object.structureType == 'rampart') {
        return true;
      }
      return false;
    }
  });
  if (structure && structure !== null) {
    this.memory.target = structure.id;
    return true;
  }

  if (this.memory.step === 0) {
    this.memory.step = this.room.controller.level * 10000;
  }
  this.memory.step = (this.memory.step * 1.1) + 1;

  //   this.log('Nothing found: ' + this.memory.step);
  return false;

};

Creep.prototype.construct = function() {
  this.say('construct', true);
  var target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);

  if (target === null) {
    return false;
  }

  var range = this.pos.getRangeTo(target);
  if (range <= 3) {
    let returnCode = this.build(target);
    if (returnCode == OK) {
      if (range == 1) {
        this.move(((this.pos.getDirectionTo(target) + 3) % 8) + 1);
      } else {
        this.moveRandom(true);
      }
      return true;
    }
    if (returnCode == ERR_NOT_ENOUGH_RESOURCES) {
      return true;
    }
    if (returnCode == ERR_INVALID_TARGET) {
      this.log('config_creep_resource construct: ' + returnCode + ' ' + JSON.stringify(target.pos));
      this.moveRandom();
      let filterSpawns = function(object) {
        return object.structureType == STRUCTURE_SPAWN;
      };

      let structures = target.pos.lookFor('structure');
      for (let structureId in structures) {
        let structure = structures[structureId];
        if (structure.structureType == STRUCTURE_SPAWN) {
          let spawns = this.room.find(FIND_STRUCTURES, {
            filter: filterSpawns
          });
          if (spawns.length <= 1) {
            target.remove();
            return true;
          }
        }
        this.log('Destroying: ' + structure.structureType);
        structure.destroy();
      }
      return true;
    }
    this.log('config_creep_resource construct: ' + returnCode + ' ' + JSON.stringify(target.pos));
  } else {
    let callback = this.room.getMatrixCallback;

    if (this.room.memory.costMatrix && this.room.memory.costMatrix.base) {
      let room = this.room;
      let creep = this;
      callback = function(end) {
        let callbackInner = function(roomName) {
          let costMatrix = PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
          costMatrix.set(creep.pos.x, creep.pos.y, 0);

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

          return costMatrix;
        };
        return callbackInner;
      };
    }

    let search = PathFinder.search(
      this.pos, {
        pos: target.pos,
        range: 3
      }, {
        roomCallback: callback(target.pos),
        maxRooms: 0
      }
    );

    if (search.incomplete) {
      this.moveTo(target.pos);
      return true;
    }

    if (range > 5 && search.path.length == 1) {
      // TODO extract to a method and make sure, e.g. creep doesn't leave the room
      this.moveRandom();
      return true;
    }

    // TODO Stuck?
    if (!this.pos.getDirectionTo(search.path[0])) {
      this.moveRandom();
      return true;
    }

    let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    if (returnCode != ERR_TIRED) {
      this.memory.lastPosition = this.pos;
    }
  }
  return true;

};

Creep.prototype.transferEnergyMy = function() {
  var exitDir;

  if (!this.memory.target) {
    var structure = get_structure(this);
    if (structure === null) {
      // this.log('transferEnergyMy: no structure');
      if (this.room.storage && this.room.storage.my) {
        this.memory.target = this.room.storage.id;
      } else {
        return false;
      }
    } else {
      this.memory.target = structure.id;
    }
  }

  var target = Game.getObjectById(this.memory.target);
  if (!target) {
    this.log('transferEnergyMy: Can not find target');
    delete this.memory.target;
    return false;
  }

  this.say('transferEnergy');
  var range = this.pos.getRangeTo(target);
  // this.log('target: ' + target.pos + ' range: ' + range);
  if (range == 1) {
    let returnCode = this.transfer(target, RESOURCE_ENERGY);
    if (returnCode != OK) {
      // TODO Enable and check again
      // this.log('transferEnergyMy: ' + returnCode + ' ' +
      // target.structureType + ' ' + target.pos);
    }
    delete this.memory.target;
  } else {
    let search = PathFinder.search(
      this.pos, {
        pos: target.pos,
        range: 1
      }, {
        roomCallback: this.room.getAvoids(this.room, {
          scout: true
        }, true),
        maxRooms: 1
      }
    );
    if (search.path.length === 0) {
      this.moveRandom();
      return true;
    }
    if (search.incomplete) {
      this.say('tr:incompl', true);
      let search = PathFinder.search(
        this.pos, {
          pos: target.pos,
          range: 1
        }, {
          maxRooms: 1
        });
      let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    } else {
      this.say('tr:' + this.pos.getDirectionTo(search.path[0]), true);
      let returnCode = this.move(this.pos.getDirectionTo(search.path[0]));
    }
  }
  return true;
};
