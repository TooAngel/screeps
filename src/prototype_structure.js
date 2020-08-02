'use strict';

// TODO Do we need this?

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
    _.set(Memory, 'structures.' + this.id, v);
  },
  configurable: true,
  enumerable: false,
});
