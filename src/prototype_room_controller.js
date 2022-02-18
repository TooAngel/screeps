'use strict';

const resetCounters = function(room) {
  if (!room.memory.controllerLevel) {
    // After deleting room memory this was an issue
    room.memory.controllerLevel = {};
  }
  room.memory.controllerLevel.checkPathInterval = 1;
  room.memory.controllerLevel.checkWrongStructureInterval = 1;
  room.memory.controllerLevel.buildStructuresInterval = 1;
  room.memory.controllerLevel.buildBlockersInterval = 1;
};

Room.prototype.buildBaseUnseenControllerLevel = function() {
  this.memory.controllerLevel = this.memory.controllerLevel || {};
  if (!this.memory.controllerLevel['setup_level_' + this.controller.level]) {
    if (Game.cpu.tickLimit > Game.cpu.bucket) {
      this.debugLog('baseBuilding', `Skipping room_controller.js execution CPU limit: ${Game.cpu.limit} tickLimit: ${Game.cpu.tickLimit} bucket: ${Game.cpu.bucket}`);
      return true;
    }
    // TODO I don't think we need this here, after change to heap
    this.updateCostMatrix();
    resetCounters(this);
    this.memory.controllerLevel['setup_level_' + this.controller.level] = Game.time;
  }
};

const executeTask = function(room, name) {
  if (room[name]()) {
    room.memory.controllerLevel[name + 'Interval'] = 1;
  } else {
    room.memory.controllerLevel[name + 'Interval']++;
  }
};

Room.prototype.buildBaseCheckPath = function() {
  if (this.controller.level > 2 && this.executeEveryTicks(this.memory.controllerLevel.checkPathInterval)) {
    if (this.checkPath(this)) {
      resetCounters(this);
    } else {
      if (!this.memory.controllerLevel) {
        // After deleting room memories this ran into an issue
        resetCounters(this);
      }
      this.memory.controllerLevel.checkPathInterval++;
    }
  }
};

/**
 * checkWrongStructures
 *
 * @param {object} room
 */
function checkWrongStructures(room) {
  if (!room.memory.controllerLevel.checkWrongStructureInterval) {
    room.memory.controllerLevel.checkWrongStructureInterval = 1;
  }
  if (room.memory.walls && room.memory.walls.finished && room.executeEveryTicks(room.memory.controllerLevel.checkWrongStructureInterval)) {
    if (room.checkWrongStructure(room)) {
      resetCounters(room);
    } else {
      room.memory.controllerLevel.checkWrongStructureInterval++;
    }
  }
}

Room.prototype.buildBase = function() {
  // version: this.memory.position.version is maybe not the best idea
  if (this.data.positions.version !== config.layout.version) {
    this.debugLog('baseBuilding', 'New layout version, rebuilding');
    this.memory = {};
    this.data.routing = {};
    this.data.positions = {};
    this.setup();
  } else if (!this.memory.setup || !this.memory.setup.completed) {
    this.setup();
  }
  if (this.buildBaseUnseenControllerLevel()) {
    return;
  }

  this.buildBaseCheckPath();
  checkWrongStructures(this);

  if (!this.memory.controllerLevel.buildStructuresInterval) {
    this.memory.controllerLevel.buildStructuresInterval = 1;
  }
  if (this.executeEveryTicks(this.memory.controllerLevel.buildStructuresInterval)) {
    executeTask(this, 'buildStructures');
  }

  if (!this.memory.controllerLevel.checkBlockersInterval) {
    this.memory.controllerLevel.checkBlockersInterval = 1;
  }
  if (!this.memory.controllerLevel.buildBlockersInterval) {
    this.memory.controllerLevel.buildBlockersInterval = 1;
  }
  if (this.memory.controllerLevel.buildStructuresInterval > 1) {
    if (this.executeEveryTicks(this.memory.controllerLevel.checkBlockersInterval)) {
      executeTask(this, 'checkBlockers');
    }
    if (this.executeEveryTicks(this.memory.controllerLevel.buildBlockersInterval)) {
      if (this.controller.level >= 2) {
        executeTask(this, 'buildBlockers');
      }
    }
  }
};

Room.prototype.clearRoom = function() {
  const structures = this.findStructures();
  _.each(structures, (s) => s.destroy());

  const constructionSites = this.findConstructionSites();
  _.each(constructionSites, (cs) => cs.remove());

  const creeps = this.findMyCreeps();
  _.each(creeps, (cs) => cs.suicide());
};
