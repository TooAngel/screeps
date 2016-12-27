'use strict';

/**
 * Provides structure memory.
 */
Object.defineProperty(Structure.prototype, "memory", {
  get: function () {
    if(Memory.structures === undefined) {
      Memory.structures = {};
    }
    if(Memory.structures[this.id] === undefined) {
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

Structure.prototype.getFutureEnergy = function() {
  if (this.memory.futureEnergy === undefined) {
    return 0;
  }
  return this.memory.futureEnergy;
};

Structure.prototype.changeFutureEnergy = function(amount) {
  let total = this.getFutureEnergy() + amount;
  if (total < 0) {
    total = 0;
  }
  this.memory.futureEnergy = total;
};
