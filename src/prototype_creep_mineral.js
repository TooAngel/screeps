'use strict';

/**
 * Check is a given lab as enough mineral for reaction
 *
 * @param {object} lab - The lab to check.
 * @param {string} mineralType - The mineral type to check.
 * @return {boolean} if the lab has enough of the mineral
 */
Creep.prototype.checkLabEnoughMineral = function (lab, mineralType) {
  if (lab.mineralAmount < LAB_REACTION_AMOUNT && !this.room.terminal.store[mineralType] && !this.carry[mineralType]) {
    if (config.debug.mineral) {
      this.log('Not enough', mineralType, 'stop reaction');
    }
    delete this.room.memory.reaction;
    return false;
  }
  return true;
};

Creep.prototype.getBoostParts = function () {
  const parts = {};
  for (const part of this.body) {
    if (part.boost) {
      return false;
    }
    parts[part.type] = true;
  }
  return parts;
};

Creep.prototype.boost = function () {
  if (!this.room.terminal || !this.room.terminal.my) {
    this.memory.boosted = true;
    return false;
  }

  const unit = roles[this.memory.role];
  if (!unit.boostActions) {
    return false;
  }

  // TODO boosting disabled, too many room.finds
  // const parts = this.getBoostParts();

  // let boost;
  // const findLabs = (lab) => lab.mineralType === boost && lab.mineralAmount > 30 && lab.energy > 20;
  // for (const part of Object.keys(parts)) {
  //   for (boost of Object.keys(BOOSTS[part])) {
  //     for (const action of Object.keys(BOOSTS[part][boost])) {
  //       this.log('boost: ' + part + ' ' + boost + ' ' + action);
  //       if (unit.boostActions.indexOf(action) > -1) {
  //         const labs = this.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_LAB], {
  //           filter: findLabs,
  //         });
  //         if (this.room.terminal.store[boost] || labs.length > 0) {
  //           const room = Game.rooms[this.room.name];
  //           room.memory.boosting = room.memory.boosting || {};
  //           room.memory.boosting[boost] = room.memory.boosting[boost] || {};
  //           room.memory.boosting[boost][this.id] = true;

  //           if (labs.length > 0) {
  //             let returnCode = this.moveToMy(labs[0].pos, 1);
  //             returnCode = labs[0].boostCreep(this);
  //             if (returnCode === OK) {
  //               const room = Game.rooms[this.room.name];
  //               delete room.memory.boosting[boost][this.id];
  //             }
  //             if (returnCode === ERR_NOT_IN_RANGE) {
  //               return true;
  //             }
  //             this.log('Boost returnCode: ' + returnCode + ' lab: ' + labs[0].pos);
  //             return true;
  //           }

  //           return false;
  //         }
  //       }
  //     }
  //   }
  // }

  // return false;
};
