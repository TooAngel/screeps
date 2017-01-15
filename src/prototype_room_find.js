Room.prototype.findBlockingStructures = function() {
  return this.find(FIND_STRUCTURES, {
    filter: s => !_.include([STRUCTURE_RAMPART,
      STRUCTURE_ROAD,
      STRUCTURE_CONTAINER
    ], s.structureType)
  });

};
