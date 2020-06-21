Room.prototype.getFriends = function() {
  return this.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return brain.isFriend(object.owner.username);
    },
  });
};

Room.prototype.getEnemys = function() {
  return this.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      return !brain.isFriend(object.owner.username);
    },
  });
};
