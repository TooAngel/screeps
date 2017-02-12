'use strict';

/**
 * Provides structure memory.
 */
Object.defineProperty(Structure.prototype, 'memory', {
  get: function() {
    if (Memory.structures === undefined) {
      Memory.structures = {};
    }
    if (Memory.structures[this.id] === undefined) {
      Memory.structures[this.id] = {};
    }
    return Memory.structures[this.id];
  },
  set: function(v) {
    return _.set(Memory, 'structures.' + this.id, v);
  },
  configurable: true,
  enumerable: false
});

Object.noviceCheck = function(object) {
  if (object !== undefined && object !== null) {
    if (object.pos.x === 0 || object.pos.y === 0 || object.pos.x === 49 || object.pos.y === 49) {
      return true;
    }
  }
  return false;
};
