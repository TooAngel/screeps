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
  if (!this.memory.controllerLevel['setup_level_' + this.controller.level]) {
    if (Game.cpu.tickLimit > Game.cpu.bucket) {
      this.debugLog('baseBuilding', `Skipping room_controller.js execution CPU limit: ${Game.cpu.limit} tickLimit: ${Game.cpu.tickLimit} bucket: ${Game.cpu.bucket}`);
      return true;
    }
    if (this.controller.level === 1 || this.controller.level === 2) {
      if (!this.setup()) {
        return true;
      }
    }
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

Room.prototype.buildBase = function() {
  this.memory.controllerLevel = this.memory.controllerLevel || {};
  if (this.buildBaseUnseenControllerLevel()) {
    return;
  }

  this.buildBaseCheckPath();

  if (!this.memory.controllerLevel.checkWrongStructureInterval) {
    this.memory.controllerLevel.checkWrongStructureInterval = 1;
  }
  if (this.memory.walls && this.memory.walls.finished && this.executeEveryTicks(this.memory.controllerLevel.checkWrongStructureInterval)) {
    if (this.checkWrongStructure(this)) {
      resetCounters(this);
    } else {
      this.memory.controllerLevel.checkWrongStructureInterval++;
    }
  }

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

  // version: this.memory.position.version is maybe not the best idea
  if (!this.memory.position || this.memory.position.version !== config.layout.version) {
    this.debugLog('baseBuilding', 'New layout version, rebuilding');
    this.setup();
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
