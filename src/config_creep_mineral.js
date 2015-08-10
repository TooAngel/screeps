'use strict';

var helper = require('helper');

Creep.prototype.boost = function() {
  if (!this.room.terminal || !this.room.terminal.my) {
    this.memory.boosted = true;
    return false;
  }

  var unit = require('creep_' + this.memory.role);
  if (!unit.boostActions) {
    return false;
  }

  let parts = {};
  for (let part of this.body) {
    if (part.boost) {
      return false;
    }
    parts[part.type] = true;
  }

  let boost;
  let findLabs = function(object) {
    if (object.structureType != STRUCTURE_LAB) {
      return false;
    }
    if (object.mineralType != boost) {
      return false;
    }
    if (object.mineralAmount > 30 && object.energy > 20) {
      return true;
    }
    return false;
  };
  // TODO boosting disabled, too many room.finds
  if (true) return false;
  //this.log(JSON.stringify(parts));
  for (let part in parts) {
    for (boost in BOOSTS[part]) {
      for (let action in BOOSTS[part][boost]) {
        this.log('boost: ' + part + ' ' + boost + ' ' + action);
        if (unit.boostActions.indexOf(action) > -1) {
          let labs = this.room.find(FIND_STRUCTURES, {
            filter: findLabs
          });
          if (this.room.terminal.store[boost] || labs.length > 0) {
            //            this.log('Could boost with: ' + part + ' ' + boost + ' ' + action + ' terminal: ' + this.room.terminal.store[boost] + ' lab: ' + JSON.stringify(labs));
            let room = Game.rooms[this.room.name];
            room.memory.boosting = room.memory.boosting || {};
            room.memory.boosting[boost] = room.memory.boosting[boost] || {};
            room.memory.boosting[boost][this.id] = true;


            if (labs.length > 0) {
              let search = PathFinder.search(
                this.pos, {
                  pos: labs[0].pos,
                  range: 1
                }, {
                  roomCallback: helper.getAvoids(this.room, {}, true),
                  maxRooms: 1
                }
              );

              this.move(this.pos.getDirectionTo(search.path[0]));
              let returnCode = labs[0].boostCreep(this);
              if (returnCode == OK) {
                let room = Game.rooms[this.room.name];
                delete room.memory.boosting[boost][this.id];
              }
              if (returnCode == ERR_NOT_IN_RANGE) {
                return true;
              }
              this.log('Boost returnCode: ' + returnCode + ' lab: ' + labs[0].pos);
              return true;
            }

            return false;
          }
        }
      }
    }
  }

  return false;
};
