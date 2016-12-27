'use strict';

// TODO totally ugly copy&baste to migrate creep_nextroomer to role_nextroomer
Creep.prototype.handleNextroomer = function() {

  function checkForRampart(coords) {
    let pos = new RoomPosition(coords.x, coords.y, coords.roomName);
    let structures = pos.lookFor('structure');
    return _.find(structures, (s) => s.structureType === STRUCTURE_RAMPART);
  }

  function buildRamparts(creep) {
    let ramparts = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: {
        structureType: STRUCTURE_RAMPART
      }
    });

    // TODO Guess this should be higher
    let rampartMinHits = 10000;

    creep.say('checkRamparts');
    let posRampart = checkForRampart(creep.pos);
    if (posRampart) {
      if (posRampart.hits < rampartMinHits) {
        creep.repair(posRampart);
        return true;
      }
    } else {
      creep.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_RAMPART);
      return true;
    }

    let room = Game.rooms[creep.room.name];
    let linkPosMem = room.memory.position.structure.link[1];
    if (creep.pos.getRangeTo(linkPosMem.x, linkPosMem.y) > 1) {
      linkPosMem = room.memory.position.structure.link[2];
    }

    let links = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: function(object) {
        return object.structureType == STRUCTURE_LINK;
      }
    });
    if (links.length) {
      creep.say('dismantle');
      creep.log(JSON.stringify(links));
      creep.dismantle(links[0]);
      return true;
    }

    creep.say('cr');
    let towerRampart = checkForRampart(linkPosMem);
    if (towerRampart) {
      creep.say('tr');
      if (towerRampart.hits < rampartMinHits) {
        creep.repair(towerRampart);
        return true;
      }
    } else {
      let returnCode = creep.room.createConstructionSite(linkPosMem.x, linkPosMem.y, STRUCTURE_RAMPART);
      creep.log('Build tower rampart: ' + returnCode);
      return true;
    }
    return false;
  }

  function defendTower(creep, source) {
    let room = Game.rooms[creep.room.name];
    let constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
    if (constructionSites.length > 0) {
      for (let constructionSiteId in constructionSites) {
        creep.build(constructionSites[constructionSiteId]);
      }
      return true;
    }

    let towers = creep.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: {
        structureType: STRUCTURE_TOWER
      }
    });

    if (towers.length > 0) {
      if (buildRamparts(creep)) {
        return true;
      }

      for (let towerId in towers) {
        let tower = towers[towerId];
        if (tower.energy === tower.energyCapacity) {
          room.memory.underSiege = false;
          return false;
        } else {
          let returnCode = creep.transfer(tower, RESOURCE_ENERGY);
          if (returnCode === OK) {
            return true;
          }

          //if (returnCode === ERR_FULL) {}
          // Don't know what to do
          creep.say(returnCode);
          return true;
        }
      }
      return buildRamparts(creep);
    } else if (buildRamparts(creep)) {
      return true;
    }

    let linkPosMem = room.memory.position.structure.link[1];

    if (creep.pos.getRangeTo(linkPosMem.x, linkPosMem.y) > 2) {
      linkPosMem = room.memory.position.structure.link[2];
    }
    let linkPos = new RoomPosition(linkPosMem.x, linkPosMem.y, linkPosMem.roomName);
    let returnCode = linkPos.createConstructionSite(STRUCTURE_TOWER);
    if (returnCode === ERR_RCL_NOT_ENOUGH) {
      delete room.memory.underSiege;
    }
    creep.log('Build tower: ' + returnCode);
  }

  function stayAtSource(creep, source) {
    if (creep.carry.energy < creep.carryCapacity - 30) {
      let returnCode = creep.harvest(source);
      if (returnCode === OK) {
        if (creep.carry.energy >= 0) {
          var creepWithoutEnergy = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: function(object) {
              return (object.carry.energy === 0 && object.id !== creep.id);
            }
          });
          let range = creep.pos.getRangeTo(creepWithoutEnergy);

          if (range === 1) {
            creep.transfer(creepWithoutEnergy, RESOURCE_ENERGY);
          }
        }
        return true;
      }
    }
    return defendTower(creep, source);
  }

  function underSiege(creep) {
    let room = Game.rooms[creep.room.name];
    if (creep.memory.targetId) {
      let sourcerPosMem = room.memory.position.creep[creep.memory.targetId];
      let source = Game.getObjectById(creep.memory.targetId);
      if (creep.pos.isEqualTo(sourcerPosMem.x, sourcerPosMem.y)) {
        return stayAtSource(creep, source);
      } else {
        delete creep.memory.targetId;
      }
    }

    let sources = room.find(FIND_SOURCES);
    for (var sourceId in sources) {
      let source = sources[sourceId];
      let sourcerPosMem = room.memory.position.creep[source.id];
      let sourcerPos = new RoomPosition(sourcerPosMem.x, sourcerPosMem.y, sourcerPosMem.roomName);

      if (creep.pos.isEqualTo(sourcerPos.x, sourcerPos.y)) {
        creep.memory.targetId = source.id;
        return stayAtSource(creep, source);
      }

      let creeps = sourcerPos.lookFor('creep');
      if (!creeps.length) {
        creep.moveTo(sourcerPos.x, sourcerPos.y);
        return true;
      }
    }
    return false;
  }

  function settle(creep) {
    let room = Game.rooms[creep.room.name];
    let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
    if (hostileCreeps.length) {
      room.memory.underSiege = true;
      if (creep.room.controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[creep.room.controller.level] / 10 || creep.room.controller.level == 1) {
        let methods = [Creep.getEnergy, Creep.upgradeControllerTask];
        return Creep.execute(creep, methods);
      }
    }

    room.memory.wayBlocked = false;
    if (room.memory.underSiege && room.controller && room.controller.level >= 3) {
      creep.log('underSiege: ' + room.memory.attack_timer);
      return underSiege(creep);

    }

    if (creep.carry.energy > 0) {
      var towers = creep.room.find(FIND_STRUCTURES, {
        filter: function(object) {
          return (object.structureType === STRUCTURE_TOWER &&
            object.energy < 10);

        }
      });
      if (towers.length) {
        creep.moveTo(towers[0]);
        creep.transfer(towers[0], RESOURCE_ENERGY);
        return true;
      }
    }

    if (_.sum(creep.carry) === 0) {
      let hostileStructures = creep.room.find(FIND_HOSTILE_STRUCTURES, {
        filter: function(object) {
          let table = {
            [STRUCTURE_RAMPART]: true,
            [STRUCTURE_EXTRACTOR]: true,
            [STRUCTURE_WALL]: true,
            [STRUCTURE_CONTROLLER]: true
          };
          return !table[object.structureType];
        }
      });

      if (hostileStructures.length) {

        let structure = _.max(hostileStructures, s => s.structureType === STRUCTURE_STORAGE);

        if (structure.structureType === STRUCTURE_STORAGE) {
          if (structure.store.energy === 0) {
            structure.destroy();
            return true;
          }
        } else if (!structure.energy) {
          structure.destroy();
          return true;
        }
        creep.say('ho: ' + structure.pos, true);
        creep.log(structure.structureType);
        creep.moveTo(structure);
        creep.withdraw(structure, RESOURCE_ENERGY);
        return true;
      }
    }

    if (creep.room.energyCapacityAvailable < 300) {
      let constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES, {
        filter: function(object) {
          let table = {
            [STRUCTURE_LAB]: true,
            [STRUCTURE_NUKER]: true,
            [STRUCTURE_TERMINAL]: true
          };
          return table[object.structureType] || false;
        }

      });
      for (let cs of constructionSites) {
        cs.remove();
      }
    }

    let methods = [Creep.getEnergy];
    if (creep.room.controller.ticksToDowngrade < 1500) {
      methods.push(Creep.upgradeControllerTask);
    }

    let structures = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: function(object) {
        let table = {
          [STRUCTURE_RAMPART]: false,
          [STRUCTURE_CONTROLLER]: false
        };
        return table[object.structureType] || true;
      }
    });

    if (creep.room.controller.level >= 3 && structures.length > 0) {
      methods.push(Creep.constructTask);
    }

    if (creep.room.controller.level < 8) {
      methods.push(Creep.upgradeControllerTask);
    }

    methods.push(Creep.transferEnergy);
    return Creep.execute(creep, methods);
  }

  return settle(this);
};
