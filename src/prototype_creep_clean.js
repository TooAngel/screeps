'use strict';

Creep.prototype.handleStructurer = function() {
  if (!this.memory.routing.targetId) {
    return this.cleanSetTargetId();
  }

  const structure = Game.getObjectById(this.memory.routing.targetId);
  if (structure === null) {
    delete this.memory.routing.targetId;
    return;
  }

  const search = PathFinder.search(
    this.pos, {
      pos: structure.pos,
      range: 1,
    }, {
      maxRooms: 1,
    },
  );

  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }

  const pos = search.path[0];
  let returnCode = this.move(this.pos.getDirectionTo(pos));

  if (returnCode === ERR_NO_PATH) {
    this.moveRandom();
    //    delete this.memory.routing.targetId;
    return true;
  }
  if (returnCode !== OK && returnCode !== ERR_TIRED) {
    // this.log('move returnCode: ' + returnCode);
  }

  returnCode = this.dismantle(structure);
  if (returnCode === OK) {
    this.setNextSpawn();
    this.spawnCarry();
  }
};

Creep.prototype.cleanController = function() {
  const search = PathFinder.search(
    this.pos, {
      pos: this.room.controller.pos,
      range: 1,
    }, {
      maxRooms: 1,
    },
  );
  if (config.visualizer.enabled && config.visualizer.showPathSearches) {
    visualizer.showSearch(search);
  }
  for (const pos of search.path) {
    const posObject = new RoomPosition(pos.x, pos.y, this.room.name);
    const structures = posObject.findInRangePropertyFilter(FIND_STRUCTURES, 1, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_CONTAINER], {
      inverse: true,
      filter: (object) => object.ticksToDecay !== null,
    });

    if (structures.length > 0) {
      this.memory.routing.targetId = structures[0].id;
      this.memory.routing.reached = false;
      //      this.log('found on way to controller to dismantle: ' + structures[0].pos);
      this.moveTo(structures[0].pos);
      return true;
    }
  }
  return false;
};

Creep.prototype.cleanExits = function() {
  const exitDirs = [FIND_EXIT_TOP,
    FIND_EXIT_RIGHT,
    FIND_EXIT_BOTTOM,
    FIND_EXIT_LEFT,
  ];
  for (const exitDir of exitDirs) {
    const exits = this.room.find(exitDir);
    if (exits.length === 0) {
      continue;
    }
    const exit = exits[Math.floor(exits.length / 2)];
    const path = this.pos.findPathTo(exit);
    const posLast = path[path.length - 1];
    if (path.length === 0) {
      continue;
    }
    if (!exit.isEqualTo(posLast.x, posLast.y)) {
      const pos = new RoomPosition(posLast.x, posLast.y, this.room.name);
      const structure = pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_CONTAINER], {
        inverse: true,
        filter: (object) => object.ticksToDecay !== null,
      });

      if (structure !== null) {
        this.memory.routing.targetId = structure.id;
        this.log('new memory: ' + structure.id);
        return true;
      }
    }
  }
  return false;
};

Creep.prototype.cleanSetTargetId = function() {
  if (this.room.controller && !this.room.controller.my) {
    //    this.log('no targetId');
    if (this.cleanController()) {
      //      this.log('clean controller');
      return true;
    }
    if (this.cleanExits()) {
      //      this.log('clean exits');
      return true;
    }
    let structure = this.pos.findClosestByRangePropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_CONTROLLER, STRUCTURE_ROAD, STRUCTURE_CONTAINER], {
      inverse: true,
      filter: (object) => object.ticksToDecay !== null,
    });
    if (structure !== null) {
      const structures = structure.pos.lookFor('structure');

      if (structures.length > 0) {
        for (const structureLook of structures) {
          if (structure.structureType === STRUCTURE_RAMPART) {
            structure = structureLook;
            break;
          }
        }
      }

      this.log('structure: ' + structure.id);
      this.memory.routing.targetId = structure.id;
      // TODO use the proper pathing logic, just a workaround to fix for now
      this.moveTo(structure.pos);
      return true;
    }
  }
  this.memory.targetReached = true;
  this.log('Nothing found, suicide');
  this.suicide();
  //  return Creep.recycleCreep(this);
};
