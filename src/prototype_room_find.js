// TODO I think we should get rid of findPropertyFilter and have specific finds
// like this
Room.prototype.findOtherPlayerCreeps = function() {
  return this.findPropertyFilter(FIND_HOSTILE_CREEPS, 'owner.username', ['Invader'], {inverse: true});
};

Room.prototype.getObservers = function() {
  return this.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_OBSERVER}});
};
