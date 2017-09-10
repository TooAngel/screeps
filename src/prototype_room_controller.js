'use strict';

Room.prototype.buildBase = function() {
  const resetCounters = function(room) {
    room.memory.controllerLevel.checkPathInterval = 1;
    room.memory.controllerLevel.checkWrongStructureInterval = 1;
    room.memory.controllerLevel.buildStructuresInterval = 1;
    room.memory.controllerLevel.buildBlockersInterval = 1;
  };

  this.memory.controllerLevel = this.memory.controllerLevel || {};

  if (!this.memory.controllerLevel['setup_level_' + this.controller.level]) {
    if (this.controller.level === 1) {
      if (!this.memory.position) {
        this.setup();
      }
    }
    resetCounters(this);
    this.memory.controllerLevel['setup_level_' + this.controller.level] = Game.time;
  }

  if (this.controller.level > 2 && this.exectueEveryTicks(this.memory.controllerLevel.checkPathInterval)) {
    if (this.checkPath(this)) {
      resetCounters(this);
    } else {
      this.memory.controllerLevel.checkPathInterval++;
    }
  }

  if (!this.memory.controllerLevel.checkWrongStructureInterval) {
    this.memory.controllerLevel.checkWrongStructureInterval = 1;
  }
  if (this.memory.walls && this.memory.walls.finished && this.exectueEveryTicks(this.memory.controllerLevel.checkWrongStructureInterval)) {
    if (this.checkWrongStructure(this)) {
      resetCounters(this);
    } else {
      this.memory.controllerLevel.checkWrongStructureInterval++;
    }
  }

  // TODO Add build ramparts and walls

  const room = this;
  const executeTask = function(name) {
    if (room[name]()) {
      room.memory.controllerLevel[name + 'Interval'] = 1;
    } else {
      room.memory.controllerLevel[name + 'Interval']++;
    }
  };

  if (!this.memory.controllerLevel.buildStructuresInterval) {
    this.memory.controllerLevel.buildStructuresInterval = 1;
  }
  if (this.exectueEveryTicks(this.memory.controllerLevel.buildStructuresInterval)) {
    executeTask('buildStructures');
  }

  if (!this.memory.controllerLevel.checkBlockersInterval) {
    this.memory.controllerLevel.checkBlockersInterval = 1;
  }
  if (!this.memory.controllerLevel.buildBlockersInterval) {
    this.memory.controllerLevel.buildBlockersInterval = 1;
  }
  if (this.memory.controllerLevel.buildStructuresInterval > 1) {
    if (this.exectueEveryTicks(this.memory.controllerLevel.checkBlockersInterval)) {
      executeTask('checkBlockers');
    }
    if (this.exectueEveryTicks(this.memory.controllerLevel.buildBlockersInterval)) {
      if (this.controller.level >= 2) {
        executeTask('buildBlockers');
      }
    }
  }

  // version: this.memory.position.version is maybe not the best idea
  if (!this.memory.position || this.memory.position.version !== config.layout.version) {
    this.setup();
  }
};

Room.prototype.clearRoom = function() {
  const structures = this.find(FIND_STRUCTURES);
  _.each(structures, (s) => s.destroy());

  const constructionSites = this.find(FIND_CONSTRUCTION_SITES);
  _.each(constructionSites, (cs) => cs.remove());

  const creeps = this.find(FIND_MY_CREEPS);
  _.each(creeps, (cs) => cs.suicide());
};
