'use strict';

Room.prototype.getConstructionSites = function() {
  if (!this.constructionSites) {
    this.constructionSites = JSON.parse(JSON.stringify(this.find(FIND_CONSTRUCTION_SITES)));
  }
  return this.constructionSites;
};

Room.prototype.getDroppedResources = function() {
  if (!this.droppedResources) {
    this.droppedResources = JSON.parse(JSON.stringify(this.find(FIND_DROPPED_RESOURCES)));
  }
  return this.droppedResources;
};

Room.prototype.getTransferableStructures = function() {
  if (!this.transferableStructures) {
    let room = this;
    this.transferableStructures = JSON.parse(JSON.stringify(this.find(FIND_STRUCTURES, {
      filter: function(object) {
        if (object.structureType == STRUCTURE_CONTROLLER) {
          return false;
        }
        if (object.structureType == STRUCTURE_ROAD) {
          return false;
        }
        if (object.structureType == STRUCTURE_WALL) {
          return false;
        }
        if (object.structureType == STRUCTURE_RAMPART) {
          return false;
        }
        if (object.structureType == STRUCTURE_OBSERVER) {
          return false;
        }
        if (object.structureType == STRUCTURE_ROAD) {
          return false;
        }
        if (object.structureType == STRUCTURE_WALL) {
          return false;
        }
        if (object.structureType == STRUCTURE_RAMPART) {
          return false;
        }

        if (object.structureType == STRUCTURE_LINK) {
          if (object.pos.isEqualTo(room.memory.position.structure.link[0].x, room.memory.position.structure.link[0].y)) {
            return false;
          }
          if (object.pos.isEqualTo(room.memory.position.structure.link[0].x, room.memory.position.structure.link[1].y)) {
            return false;
          }
          if (object.pos.isEqualTo(room.memory.position.structure.link[0].x, room.memory.position.structure.link[2].y)) {
            return false;
          }
        }
        return true;
      }
    })));
  }
  return this.transferableStructures;
};
