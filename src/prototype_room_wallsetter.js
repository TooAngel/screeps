'use strict';

Room.prototype.buildBlockers = function() {
  //   this.log('buildBlockers: ' + this.memory.controllerLevel.buildBlockersInterval);

  var spawns = this.findPropertyFilter(FIND_MY_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]);
  if (spawns.length === 0) {
    return false;
  }

  if (this.closeExitsByPath()) {
    return true;
  }
  return this.checkRamparts();
};

Room.prototype.checkRamparts = function() {
  var room = Game.rooms[this.name];
  if (!room.memory.walls) {
    return false;
  }
  for (var rampart of room.memory.walls.ramparts) {
    var pos = new RoomPosition(rampart.x, rampart.y, rampart.roomName);
    pos.createConstructionSite(STRUCTURE_RAMPART);
  }
};

Room.prototype.checkExitsAreReachable = function() {
  // Make sure every exit is reachable

  let inLayer = function(room, pos) {
    for (let i = 0; i < room.memory.walls.layer_i; i++) {
      for (let j in room.memory.walls.layer[i]) {
        let position = room.memory.walls.layer[i][j];
        if (pos.x === position.x && pos.y === position.y) {
          return true;
        }
      }
    }
    return false;
  };
  let costMatrixBase = this.getMemoryCostMatrix();

  let exits = this.find(FIND_EXIT);
  let room = this;
  var callbackNew = function(roomName) {
    let costMatrix = room.getMemoryCostMatrix();
    return costMatrix;
  };
  for (let exit of exits) {
    //     console.log(exit);
    let room = this;

    let targets = [{
      pos: this.controller.pos,
      range: 1
    }];

    let search = PathFinder.search(
      exit,
      targets, {
        roomCallback: callbackNew,
        maxRooms: 1
      }
    );

    if (search.incomplete) {
      search = PathFinder.search(
        exit,
        targets, {
          maxRooms: 1
        }
      );
      for (let pathPos of search.path) {
        if (inLayer(this, pathPos)) {
          this.memory.walls.ramparts.push(pathPos);
          costMatrixBase.set(pathPos.x, pathPos.y, 0);
          this.setMemoryCostMatrix(costMatrixBase);
        }
      }
    }
  }
};

Room.prototype.closeExitsByPath = function() {
  let inLayer = function(room, pos) {
    for (var i = 0; i < room.memory.walls.layer_i; i++) {
      for (var j in room.memory.walls.layer[i]) {
        var position = room.memory.walls.layer[i][j];
        if (pos.isEqualTo(position.x, position.y)) {
          return true;
        }
      }
    }
    return false;
  };

  if (this.memory.walls && this.memory.walls.finished) {
    return false;
  }

  if (!this.memory.walls || !this.memory.walls.layer) {
    this.log('closeExitsByPath: Reset walls');
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
  if (!this.memory.walls.layer[this.memory.walls.layer_i]) {
    this.memory.walls.layer[this.memory.walls.layer_i] = [];
  }
  // this.log('closeExitsByPath layer: ' + this.memory.walls.layer_i + ' exit: ' + this.memory.walls.exit_i + ' walls: ' + this.memory.walls.layer[this.memory.walls.layer_i].length);

  var ignores = [];
  for (var i = 0; i < this.memory.walls.layer_i; i++) {
    ignores = ignores.concat(this.memory.walls.layer[i]);
  }

  var exits = this.find(FIND_EXIT);
  if (this.memory.walls.exit_i >= exits.length) {
    this.memory.walls.exit_i = 0;
    this.memory.walls.layer_i++;
    this.log('Increase layer');
    if (this.memory.walls.layer_i >= config.layout.wallThickness) {
      this.log('Wall setup finished');
      this.memory.walls.finished = true;

      // TODO disabled, too many ramparts
      //       this.checkExitsAreReachable();

      return false;
    }
    return true;
  }

  let room = this;
  var callbackNew = function(roomName, costMatrix) {
    if (!costMatrix) {
      costMatrix = new PathFinder.CostMatrix();
    }
    for (let avoidIndex in room.memory.walls.ramparts) {
      let avoidPos = room.memory.walls.ramparts[avoidIndex];
      costMatrix.set(avoidPos.x, avoidPos.y, 0xFF);
    }
    for (let avoidIndex in room.memory.walls.layer[room.memory.walls.layer_i]) {
      let avoidPos = room.memory.walls.layer[room.memory.walls.layer_i][avoidIndex];
      costMatrix.set(avoidPos.x, avoidPos.y, 0xFF);
    }

    return costMatrix;
  };

  var exit = exits[this.memory.walls.exit_i];

  let targets = [{
    pos: this.controller.pos,
    range: 1
  }];
  let sources = this.find(FIND_SOURCES);
  for (let sourceId in sources) {
    targets.push({
      pos: sources[sourceId].pos,
      range: 1
    });
  }

  let search = PathFinder.search(
    exit,
    targets, {
      roomCallback: callbackNew,
      maxRooms: 1
    }
  );

  if (search.incomplete) {
    this.memory.walls.exit_i++;
    return true;
  }

  var path = search.path;
  var pos_last = path[path.length - 1];
  let posLastObject = new RoomPosition(pos_last.x, pos_last.y, this.name);

  // TODO check if incomplete just solves the issue
  let wayFound = false;
  for (let targetId in targets) {
    if (posLastObject.getRangeTo(targets[targetId]) === 1) {
      wayFound = true;
      //      this.log('Way found true: ' + !search.incomplete);
      break;
    }
    //    this.log('Way found false: ' + search.incomplete);
  }
  if (!wayFound) {
    this.memory.walls.exit_i++;
    return true;
  }

  let wallPlaceable = function(pos) {
    let exit = pos.findClosestByRange(FIND_EXIT);
    let range = pos.getRangeTo(exit);
    return range > 1;
  };

  for (let pathPosPlain of path) {
    var pathPos = new RoomPosition(pathPosPlain.x, pathPosPlain.y, this.name);
    if (wallPlaceable(pathPos)) {
      if (inLayer(this, pathPos)) {
        continue;
      }

      var structure = STRUCTURE_WALL;
      let costMatrixBase = this.getMemoryCostMatrix();
      if (pathPos.inPath() || pathPos.inPositions()) {
        structure = STRUCTURE_RAMPART;
        costMatrixBase.set(pathPos.x, pathPos.y, 0);
        this.memory.walls.ramparts.push(pathPos);
      } else {
        costMatrixBase.set(pathPos.x, pathPos.y, 0xff);
      }
      this.setMemoryCostMatrix(costMatrixBase);
      this.memory.walls.layer[this.memory.walls.layer_i].push(pathPos);
      var returnCode = pathPos.createConstructionSite(structure);
      if (returnCode === ERR_FULL) {
        return false;
      }
      if (returnCode === ERR_INVALID_TARGET) {
        return false;
      }
      this.log('Placing ' + structure + ' with ' + returnCode + ' at ' + JSON.stringify(pathPos));
      return true;
    }
  }
  // I guess when the position is near to the exit (e.g. source on x: 47
  // TODO I think this can break the setup, It will find the way to this source which is in the walls / ramparts and skip the others
  this.memory.walls.exit_i++;
  return true;
};
