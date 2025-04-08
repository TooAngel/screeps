'use strict';

/*
 * builder builds up construction sites
 *
 * Moves to the construction sites, does random walk to prevent traffic jam
 * builds up the structure
 */

roles.builder = {};
roles.builder.boostActions = ['build', 'capacity'];

roles.builder.settings = {
  layoutString: 'MCW',
  amount: [2, 1, 1],
  maxLayoutAmount: 20,
};

roles.builder.action = function(creep) {
  const methods = [Creep.getEnergy];

  methods.push(Creep.constructTask);
  if (creep.room.memory.misplacedSpawn) {
    methods.push(Creep.transferEnergy);
    methods.push(Creep.repairStructure);
  }
  methods.push(Creep.upgradeControllerTask);

  return Creep.execute(creep, methods);
};
