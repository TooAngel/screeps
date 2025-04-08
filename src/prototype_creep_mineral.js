'use strict';

/**
 * Check is a given lab as enough mineral for reaction
 *
 * @param {object} lab - The lab to check.
 * @param {string} mineralType - The mineral type to check.
 * @return {boolean} if the lab has enough of the mineral
 */
Creep.prototype.checkLabEnoughMineral = function(lab, mineralType) {
  if (lab.mineralAmount < LAB_REACTION_AMOUNT && !this.room.terminal.store[mineralType] && !this.carry[mineralType]) {
    if (config.debug.mineral) {
      this.log('Not enough', mineralType, 'stop reaction');
    }
    delete this.room.memory.reaction;
    return false;
  }
  return true;
};

Creep.prototype.getBoostParts = function() {
  const parts = {};
  for (const part of this.body) {
    if (part.boost) {
      return false;
    }
    parts[part.type] = true;
  }
  return parts;
};

Creep.prototype.boost = function() {
  if (!this.room.memory.boosts) {
    this.memory.boosted = true;
    return false;
  }
  const boost = this.room.memory.boosts[this.name];
  if (!boost) {
    this.memory.boosted = true;
    return false;
  }
  if (!boost.lab) {
    this.memory.boosted = true;
    delete this.room.memory.boosts[this.name];
    return false;
  }
  this.log(`${JSON.stringify(boost)}`);
  const lab = Game.getObjectById(boost.lab);
  this.moveToMy(lab.pos);
  const response = lab.boostCreep(this);
  this.log(response);
  if (response === ERR_NOT_ENOUGH_RESOURCES) {
    this.memory.boosted = true;
    delete this.room.memory.boosts[this.name];
    return false;
  }
  if (response === OK) {
    this.log('BOOSTED');
    this.memory.boosted = true;
    delete this.room.memory.boosts[this.name];
    return false;
  }
  return true;
};
