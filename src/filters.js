'use strict';
global.filters = {};
global.filters.resources = {};
global.filters.resources.pickableResources = function(creep) {
  return (object) => creep.pos.isNearTo(object);
};
