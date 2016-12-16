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
