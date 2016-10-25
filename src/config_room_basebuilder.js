'use strict';

function posIsIn(pos, array) {
  if (!array) {
    return false;
  }

  for (let posCheck of array) {
    // TODO when does this happen?
    if (posCheck === null) {
      console.log('Pos is not in array', pos, posCheck, JSON.stringify(array));
      throw new Error();
      //      continue;
    }
    if (pos.x == posCheck.x && pos.y == posCheck.y) {
      return true;
    }
  }
  return false;
}


Room.prototype.destroyStructure = function(structure) {
  if (structure.structureType == STRUCTURE_WALL) {
    if (!this.memory.walls) {
      return false;
    }
    if (!this.memory.walls.finished) {
      this.log('Wall setup not yet finished:' + structure.structureType + ' ' + JSON.stringify(structure.pos));
      return false;
    }
    for (let layerId in this.memory.walls.layer) {
      let layer = this.memory.walls.layer[layerId];
      for (let pos of layer) {
        if (structure.pos.isEqualTo(pos.x, pos.y)) {
          if (!structure.pos.inRamparts()) {
            return false;
          }
        }
      }
    }
    this.log('destroyStructure: wall not found in memory, destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos));
    structure.destroy();
    return true;
  }
  if (structure.structureType == STRUCTURE_ROAD) {
    for (let pathName in this.memory.routing) {
      let path = this.memory.routing[pathName];
      for (let pos of Room.stringToPath(path.path)) {
        if (structure.pos.isEqualTo(pos.x, pos.y)) {
          return false;
        }
      }
    }
    this.log('destroyStructure: road not found in paths, destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos));
    structure.destroy();
    return true;
  }
  if (structure.structureType == STRUCTURE_RAMPART) {
    return false;
  }

  if (posIsIn(structure.pos, this.memory.position.structure[structure.structureType])) {
    return false;
  }

  let structures = this.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == structure.structureType;
    }
  });

  let structuresMin = 0;
  if (structure.structureType == STRUCTURE_SPAWN) {
    structuresMin = 1;
  }

  if (structures.length > structuresMin) {
    this.log('Destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos));
    structure.destroy();
    return true;
  }
  this.log('Not destroying: ' + structure.structureType + ' ' + JSON.stringify(structure.pos) + ' ' + structures.length + ' ' + structuresMin);
  return false;
};


Room.prototype.checkPath = function() {
  this.log('checkPath: ' + this.memory.controllerLevel.checkPathInterval);

  // TODO this shouldn't happen if the base setup is proper
  if (!this.memory.routing || !this.memory.routing['pathStart-harvester'] || !this.memory.routing['pathStart-harvester'].path) {
    this.log('checkPath skipped, no memory: ' + JSON.stringify(this.memory.routing));
    return false;
  }

  let path = Room.stringToPath(this.memory.routing['pathStart-harvester'].path);
  let filterSpawns = function(object) {
    return object.structureType == STRUCTURE_SPAWN;
  };
  for (let pos of path) {
    let roomPos = new RoomPosition(pos.x, pos.y, this.name);
    let structures = roomPos.lookFor('structure');

    for (let structure of structures) {
      if (structure.structureType == STRUCTURE_ROAD) {
        continue;
      }
      if (structure.structureType == STRUCTURE_RAMPART) {
        continue;
      }
      console.log('checkPath: ' + pos);
      if (this.destroyStructure(structure)) {
        return true;
      }
    }
  }
  return false;
};

Room.prototype.checkWrongStructure = function() {
  this.log('checkWrongStructure: ' + this.memory.controllerLevel.checkWrongStructureInterval);
  if (this.memory.underSiege && this.controller.level >= 3) {
    this.log('checkWrongStructure: underSiege');
    return false;
  }
  // TODO Building up underSiege, maybe check for underSiege
  //if (this.controller.level < 6) {
  //  this.log('checkWrongStructure: controller.level < 6');
  //  return false;
  //}

  let structures = this.find(FIND_STRUCTURES);

  for (let structure of structures) {
    if (structure.structureType == STRUCTURE_RAMPART) {
      continue;
    }
    if (structure.structureType == STRUCTURE_CONTROLLER) {
      continue;
    }

    if (this.destroyStructure(structure)) {
      return true;
    }
  }
  return false;
};


Room.prototype.clearPosition = function(pos, structure) {
  let posStructures = pos.lookFor('structure');
  let returnValue = false;
  for (let posStructureIndex in posStructures) {
    let posStructure = posStructures[posStructureIndex];
    if (posStructure.structureType == STRUCTURE_ROAD) {
      continue;
    }
    if (posStructure.structureType == STRUCTURE_RAMPART) {
      continue;
    }
    if (posStructure.structureType == structure) {
      returnValue = {
        destoyed: false
      };
      continue;
    }
    return this.destroyStructure(posStructure);
  }
  return returnValue;
};


Room.prototype.setupStructure = function(structure) {
  var structures = this.find(FIND_MY_STRUCTURES, {
    filter: {
      structureType: structure
    }
  });

  var constructionsites = this.find(FIND_CONSTRUCTION_SITES, {
    filter: {
      structureType: structure
    }
  });

  // Only build one spawn at a time, especially for reviving
  if (structure == STRUCTURE_SPAWN) {
    if (constructionsites.length > 0) {
      return true;
    }
  }

  // Complete storage before building something else - 2016-10-16
  if (structure == STRUCTURE_STORAGE) {
    if (constructionsites.length > 0) {
      return true;
    }
  }

  var diff = CONTROLLER_STRUCTURES[structure][this.controller.level] -
    (structures.length + constructionsites.length);
  if (diff <= 0) {
    return false;
  }

  var max = CONTROLLER_STRUCTURES[structure][this.controller.level];
  for (let pos of(this.memory.position.structure[structure] || [])) {
    // TODO special case e.g. when powerSpawn can't be set on costmatrix.setup - need to be fixed there
    if (!pos) {
      continue;
    }
    var posObject = new RoomPosition(pos.x, pos.y, this.name);

    let clear = this.clearPosition(posObject, structure);
    if (clear) {
      if (clear.destoyed) {
        return true;
      } else {
        continue;
      }
    }

    let returnCode = posObject.createConstructionSite(structure);
    if (returnCode == OK) {
      this.log('Build: ' + structure + ' ' + JSON.stringify(posObject));
      return true;
    }
    if (returnCode == ERR_FULL) {
      this.log('setup createConstrustionSite too many constructionSites');
      return true;
    }
    if (returnCode == ERR_INVALID_TARGET) {
      this.log('setup createConstrustionSite invalid target: ' + structure + ' ' + JSON.stringify(posObject));
      continue;
    }
    if (returnCode == ERR_RCL_NOT_ENOUGH) {
      this.log(structure + ' ' + this.controller.level + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level]);
      this.log('setup createConstrustionSite ERR_RCL_NOT_ENOUGH structure: ' + structure + ' ' + CONTROLLER_STRUCTURES[structure][this.controller.level] + ' ' + structures.length + ' ' + constructionsites.length);
    }

    this.log('setup createConstrustionSite returnCode: ' + returnCode + ' structure: ' + structure);
  }
  return false;

};


Room.prototype.buildStructures = function() {
  // TODO reduce noise
  //  this.log('buildStructures: ' + this.memory.controllerLevel.buildStructuresInterval);
  if (!this.memory.position) {
    this.log('No position buildStructures');
    this.setup();
    return false;
  }

  if (!this.memory.position.structure) {
    this.log('No structure positions: ' + JSON.stringify(this.memory.position));
    return false;
  }


  if (this.controller === null || !this.controller.my) {
    this.log('No controller');
    return false;
  }


  if (Object.keys(Game.constructionSites).length >= 100) {
    return false;
  }

  let constructionSites = this.find(FIND_CONSTRUCTION_SITES, {
    filter: function(object) {
      if (object.structureType == STRUCTURE_RAMPART) {
        return false;
      }
      if (object.structureType == STRUCTURE_WALL) {
        return false;
      }
      return true;
    }
  });
  if (constructionSites.length > 3) {
    //    this.log('basebuilder.setup: Too many construction sites');
    return true;
  }

  if (this.setupStructure('spawn')) {
    return true;
  }
  if (this.setupStructure(STRUCTURE_TOWER)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_STORAGE)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_LINK)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_EXTENSION)) {
    return true;
  }

  let linkConstructionsSites = this.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: {
      structureType: STRUCTURE_LINK
    }
  });
  if (!this.storage || linkConstructionsSites.length > 0) {
    return false;
  }
  if (this.setupStructure(STRUCTURE_POWER_SPAWN)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_EXTRACTOR)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_OBSERVER)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_LAB)) {
    return true;
  }

  if (this.setupStructure(STRUCTURE_TERMINAL)) {
    return true;
  }
  if (this.setupStructure(STRUCTURE_NUKER)) {
    return true;
  }

  return false;
};

let structureExist = function(pos, structureType) {
  let structures = pos.lookFor(LOOK_STRUCTURES);
  for (let structure of structures) {
    if (structure.structureType == structureType) {
      return true;
    }
  }
  return false;
};

Room.prototype.checkBlockers = function() {
  if (this.controller.level == 1) {
    return false;
  }
  //  this.log('checkBlockers: ' + this.memory.controllerLevel.checkBlockersInterval + ' ' + this.controller.level + ' ' + this.memory.walls);
  if (this.controller.level >= 2 && (!this.memory.walls || !this.memory.walls.layer)) {
    this.log('checkBlockers: reset walls');
    this.memory.walls = {
      exit_i: 0,
      ramparts: [],
      layer_i: 0,
      // TODO as array?
      layer: {
        0: []
      }
    };
  }

  for (let layer in this.memory.walls.layer) {
    for (let blocker of this.memory.walls.layer[layer]) {
      let pos = new RoomPosition(blocker.x, blocker.y, this.name);

      let structureType = STRUCTURE_WALL;
      if (pos.inRamparts()) {
        structureType = STRUCTURE_RAMPART;
      }

      if (structureExist(pos, structureType)) {
        continue;
      }
      let returnCode = pos.createConstructionSite(structureType);
      if (returnCode != OK && returnCode != ERR_FULL) {
        this.log('Build ' + structureType + ' at ' + pos + ' with ' + returnCode);
        return true;
      }
    }
  }
  return false;
};
