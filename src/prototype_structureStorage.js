StructureStorage.prototype.isLow = function() {
  return this.store.energy < config.storage.lowValue;
};
