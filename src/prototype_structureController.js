StructureController.prototype.isAboutToDowngrade = function() {
  return this.ticksToDowngrade < (CONTROLLER_DOWNGRADE[this.level] * config.controller.aboutToDowngradePercent / 100);
};
