'use strict';

/*
 * planer builds up construction sites
 *
 * Moves to the construction sites, does random walk to prevent traffic jam
 * builds up the structure
 */

roles.planer = {};
roles.planer.stayInRoom = true;

roles.planer.getPartConfig = function(room) {
  let datas = {layout: [MOVE, MOVE, CARRY, WORK],
    maxEnergyUsed: 3000,
    minEnergyStored: 250};
  return room.getPartConfig(datas);
};

roles.planer.action = function(creep) {
  var methods = [Creep.getEnergy];

  methods.push(Creep.constructTask);
  methods.push(Creep.buildRoads);
  if (creep.room.memory.misplacedSpawn) {
    methods.push(Creep.transferEnergy);
    methods.push(Creep.repairStructure);
  } else {
    methods.push(Creep.recycleCreep);
  }
  methods.push(Creep.upgradeControllerTask);

  return Creep.execute(creep, methods);
};

roles.planer.execute = function(creep) {
  creep.log('!!!! Execute !!!');
  let methods = [Creep.getEnergy];

  methods.push(Creep.constructTask);
  methods.push(Creep.buildRoads);
  if (creep.room.memory.misplacedSpawn) {
    methods.push(Creep.transferEnergy);
    methods.push(Creep.repairStructure);
  } else {
    methods.push(Creep.recycleCreep);
  }
  methods.push(Creep.upgradeControllerTask);

  return Creep.execute(creep, methods);
};
