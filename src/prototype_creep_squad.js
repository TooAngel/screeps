'use strict';

Creep.prototype.squadMove = function(squad, maxRange, moveRandom, role) {
  if (this.room.name === squad.moveTarget) {
    const nextExits = this.room.find(this.memory.routing.route[this.memory.routing.routePos].exit);
    if (nextExits.length < 1) {
      return false;
    }
    const nextExit = nextExits[Math.floor(nextExits.length / 2)];
    const range = this.pos.getRangeTo(nextExit.x, nextExit.y);
    if (range < maxRange) {
      Memory.squads[this.memory.squad][role][this.id].waiting = true;
      if (moveRandom) {
        this.moveRandom();
      }
      return true;
    }
  }
  return false;
};
