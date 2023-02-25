'use strict';

/*
 * Harvesting sources is done by sourcer
 *
 * Moves to the source and gets energy
 * In external rooms builds a container
 * In internal rooms transfers to the link
 *
 * If 'threshold' energy is in the container or on the ground
 * a carry is called
 */

roles.sourcer = {};

roles.sourcer.settings = {
  param: ['energyCapacityAvailable'],
  prefixString: {
    300: 'MW',
    600: 'MWC',
  },
  layoutString: {
    300: 'W',
    650: 'MW',
  },
  amount: {
    300: [1],
    350: [2],
    450: [3],
    550: [4],
    650: [1, 4],
    700: [2, 4],
  },
  maxLayoutAmount: {
    300: 1,
  },
};

roles.sourcer.buildRoad = true;
roles.sourcer.killPrevious = true;

// TODO should be true, but flee must be fixed before 2016-10-13
roles.sourcer.flee = false;

/**
 * updates sourcer settings
 *
 * @param {object} room - this room to spawn in
 * @param {object} creep - the creep role
 * @return {boolean|{amount: number[], maxLayoutAmount: number, layoutString: string}|{amount: number[], maxLayoutAmount: number, layoutString: string, suffixString: string, prefixString: string}}
 */
roles.sourcer.updateSettings = function(room, creep) {
  if (!room.storage) {
    return false;
  }
  const target = creep.routing && creep.routing.targetRoom ? creep.routing.targetRoom : room.name;
  const inBase = (target === room.name);
  if (!inBase && (global.data.rooms[target] || {}).sourceKeeperRoom) {
    return {
      prefixString: 'MC',
      layoutString: 'MW',
      suffixString: 'MH',
      amount: [5, 10],
      maxLayoutAmount: 1,
    };
  }
  if (creep.routing.type === 'commodity') {
    return {
      layoutString: 'MWC',
      amount: [1, 1, 1],
      maxLayoutAmount: 30,
    };
  }
  return false;
};

roles.sourcer.preMove = function(creep, directions) {
  return creep.preMoveExtractorSourcer(directions);
};

/**
 * getSource - Gets the source from heap data, or sets if missing
 *
 * @param {object} creep - The creep
 * @return {object} - The tower
 **/
function getSource(creep) {
  if (!creep.data.source) {
    const source = Game.getObjectById(creep.memory.routing.targetId);
    creep.data.source = source.id;
  }
  return Game.getObjectById(creep.data.source);
}

/**
 * harvest
 *
 * @param {object} creep
 * @return {boolean}
 */
function harvest(creep) {
  const source = getSource(creep);
  const returnCode = creep.harvest(source);
  if (returnCode === OK) {
    return true;
  }
  if (returnCode === ERR_NOT_ENOUGH_RESOURCES) {
    return true;
  }

  if (returnCode === ERR_NOT_OWNER) {
    creep.log('Suiciding, someone else reserved the controller');
    creep.memory.killed = true;
    creep.suicide();
    return false;
  }

  if (returnCode === ERR_NO_BODYPART) {
    creep.room.checkRoleToSpawn('defender', 2, undefined, creep.room.name);
    creep.respawnMe();
    creep.suicide();
    return false;
  }

  if (returnCode === ERR_TIRED) {
    return false;
  }
  creep.log('harvest: ' + returnCode);
  return false;
}

/**
 * transferToLink
 *
 * @param {object} creep
 */
function transferToLink(creep) {
  const link = creep.getCloseByLink();
  if (link) {
    creep.transfer(link, RESOURCE_ENERGY);
  }
}

/**
 * getContainer - Gets the container from heap data, or sets if missing
 *
 * @param {object} creep - The creep
 * @return {object} - The container
 **/
function getContainer(creep) {
  if (!creep.data.container) {
    const structures = creep.pos.findInRange(FIND_STRUCTURES, 0, {filter: {structureType: STRUCTURE_CONTAINER}});
    if (structures.length === 0) {
      return;
    }
    creep.data.container = structures[0].id;
  }
  return Game.getObjectById(creep.data.container);
}

/**
 * getContainerConstructionSite - Gets the container construction site from heap data, or sets if missing
 *
 * @param {object} creep - The creep
 * @return {object} - The container
 **/
function getContainerConstructionSite(creep) {
  if (!creep.data.containerConstructionSite) {
    const constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 0, {filter: {structureType: STRUCTURE_CONTAINER}});
    if (constructionSites.length === 0) {
      return;
    }
    creep.data.containerConstructionSite = constructionSites[0].id;
  }
  return Game.getObjectById(creep.data.containerConstructionSite);
}

/**
 * maintainContainer
 *
 * @param {object} creep
 * @return {boolean|void}
 */
function maintainContainer(creep) {
  if (creep.inBase()) {
    return creep.room.controller.level < 6;
  }

  const container = getContainer(creep);
  if (container) {
    if (container.hits < container.hitsMax) {
      creep.repair(container);
    }
    return;
  }

  const containerConstructionSite = getContainerConstructionSite(creep);
  if (containerConstructionSite) {
    creep.build(containerConstructionSite);
    return;
  }

  const returnCode = creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
  if (returnCode === ERR_INVALID_TARGET) {
    const constructionSites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 0);
    for (const constructionSite of constructionSites) {
      constructionSite.remove();
    }
    return false;
  }
}

roles.sourcer.preMove = function(creep) {
  creep.pickupEnergyFromGround();
};

roles.sourcer.action = function(creep) {
  creep.setNextSpawn();
  if (creep.memory.routing.type !== 'commodity' || creep.memory.routing.reached || Game.getSource(creep).lastCooldown < 50) {
    creep.spawnReplacement();
  }

  creep.checkForSourceKeeper();

  if (!harvest(creep)) {
    return false;
  }
  maintainContainer(creep);
  creep.spawnCarry();
  if (creep.inBase()) {
    transferToLink(creep);
  } else {
    creep.selfHeal();
  }
  return true;
};
