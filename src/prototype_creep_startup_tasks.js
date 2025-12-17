'use strict';

/**
 * Startup Task System for Creeps
 *
 * This file implements a priority-based task execution system used during room startup
 * and as fallback behaviors when creeps have no specific objectives.
 *
 * The core concept:
 * - Static methods on Creep define individual startup tasks
 * - Creep.execute() runs tasks in priority order until one succeeds
 * - Roles compose their behavior by arranging tasks in desired priority
 *
 * Usage in roles:
 * ```javascript
 * const methods = [Creep.getEnergy, Creep.constructTask, Creep.upgradeControllerTask];
 * return Creep.execute(creep, methods);
 * ```
 *
 * When used:
 * - Room startup: When primary objectives aren't available
 * - Fallback behavior: When specific role tasks complete
 * - Emergency situations: When creeps need basic productive tasks
 */

// ============================================================================
// CONSTANTS
// ============================================================================

// Controller upgrade task constants
const CONTROLLER_UPGRADE_RANGE = 3;
const ENERGY_PICKUP_RANGE = 10;

// Repair task constants
const RAMPART_NUKE_PROTECTION_HITS = 1100000;
const REPAIR_STEP_BONUS = 10000;
const REPAIR_STEP_MULTIPLIER = 1.1;
const INITIAL_REPAIR_STEP_MULTIPLIER = 10000;

// Movement and positioning constants
const ADJACENT_RANGE = 1;
const REPAIR_RANGE = 3;

// ============================================================================
// TASK EXECUTION SYSTEM
// ============================================================================

/**
 * Execute startup tasks in priority order
 *
 * Runs through an array of task functions, executing each until one returns true.
 * This implements a priority-based task system where the first successful task
 * determines the creep's action for this tick.
 *
 * @param {Creep} creep - The creep to execute tasks for
 * @param {Function[]} methods - Array of task functions in priority order
 * @return {boolean} - True if any task was executed successfully
 */
Creep.execute = function(creep, methods) {
  for (const method of methods) {
    if (method(creep)) {
      return true;
    }
  }
  return false;
};

// ============================================================================
// SIMPLE STARTUP TASKS (Delegating Wrappers)
// ============================================================================

/**
 * Construction task - builds construction sites
 * @param {Creep} creep - The creep to execute the task
 * @return {boolean} - True if construction was attempted
 */
Creep.constructTask = function(creep) {
  creep.creepLog('construct');
  return creep.construct();
};

/**
 * Energy transfer task - transfers energy to structures
 * @param {Creep} creep - The creep to execute the task
 * @return {boolean} - True if energy transfer was attempted
 */
Creep.transferEnergy = function(creep) {
  return creep.transferEnergy();
};

/**
 * Energy gathering task - collects energy from sources
 * @param {Creep} creep - The creep to execute the task
 * @return {boolean} - True if energy gathering was attempted
 */
Creep.getEnergy = function(creep) {
  return creep.getEnergy();
};

/**
 * Structure repair task - repairs damaged structures
 * @param {Creep} creep - The creep to execute the task
 * @return {boolean} - True if repair was attempted
 */
Creep.repairStructure = function(creep) {
  return creep.repairStructure();
};

/**
 * Creep recycling task - returns creep to spawn for recycling
 * @param {Creep} creep - The creep to execute the task
 * @return {boolean} - Always returns true
 */
Creep.recycleCreep = function(creep) {
  if (creep.memory.role === 'builder') {
    if (creep.room.buildStructures()) {
      creep.memory.recycle = false;
    }
  }

  let spawn = creep.pos.findClosestByRangeSpawn();
  if (!spawn) {
    spawn = Game.rooms[creep.memory.base].findSpawn()[0];
  }
  if (spawn) {
    if (creep.room === spawn.room) {
      creep.moveToMy(spawn.pos);
    } else {
      // TODO make use of the proper routing logic
      creep.moveTo(spawn);
    }
    creep.say('recycle');
    const response = spawn.recycleCreep(creep);
    if (response === OK) {
      creep.memory.recycle = true;
    }
  }
  return true;
};

// ============================================================================
// COMPLEX STARTUP TASKS (Substantial Logic)
// ============================================================================

/**
 * Try to pick up nearby dropped energy while at controller
 * @param {Creep} creep - The creep to check for nearby energy
 * @return {Resource|false} - The resource picked up or false if none found
 */
function pickupNearbyEnergyAtController(creep) {
  const resources = creep.pos.findInRangeDroppedEnergy(ENERGY_PICKUP_RANGE);
  if (resources.length > 0) {
    const resource = resources[0];
    creep.pickup(resource);
    return resource;
  }
  return false;
}

/**
 * Controller upgrade task - upgrades room controller with energy
 * @param {Creep} creep - The creep to execute the task
 * @return {boolean} - True if upgrade was attempted
 */
Creep.upgradeControllerTask = function(creep) {
  creep.creepLog('upgradeControllerTask');
  // Stop all controller upgrades when trapped - let controller die
  if (Memory.trapped && Memory.trapped.isTrapped) {
    return false;
  }
  if (creep.carry.energy === 0) {
    return false;
  }

  const range = creep.pos.getRangeTo(creep.room.controller);
  if (range <= CONTROLLER_UPGRADE_RANGE) {
    // Pick up any nearby energy while upgrading
    const resource = pickupNearbyEnergyAtController(creep);

    // Upgrade the controller
    const returnCode = creep.upgradeController(creep.room.controller);
    if (returnCode !== OK) {
      creep.log('upgradeController: ' + returnCode);
    }

    // Move randomly within range, avoiding resource if picked up
    if (resource) {
      creep.moveRandomWithin(creep.room.controller.pos, CONTROLLER_UPGRADE_RANGE, resource);
    } else {
      creep.moveRandomWithin(creep.room.controller.pos);
    }
    return true;
  } else {
    creep.moveToMy(creep.room.controller.pos, CONTROLLER_UPGRADE_RANGE);
  }
  return true;
};

/**
 * Check if a road already exists at the given position
 * @param {RoomPosition} pos - The position to check
 * @return {boolean} - True if a road exists at this position
 */
function hasRoadAtPosition(pos) {
  const structures = pos.lookFor(LOOK_STRUCTURES);
  return structures.some((structure) => structure.structureType === STRUCTURE_ROAD);
}

/**
 * Try to create a road construction site at the given position
 * @param {RoomPosition} pos - The position to build road at
 * @param {Creep} creep - The creep requesting the construction
 * @return {boolean} - True if construction site was created or should stop trying
 */
function createRoadConstructionSite(pos, creep) {
  const returnCode = pos.createConstructionSite(STRUCTURE_ROAD);

  switch (returnCode) {
  case OK:
    return true; // Successfully created construction site
  case ERR_FULL:
    return true; // Construction site limit reached, stop trying
  case ERR_INVALID_TARGET:
    // Creep might be standing on the position
    creep.moveRandom();
    return false; // Continue to next position
  default:
    creep.log(`buildRoads: ${returnCode} at pos: ${JSON.stringify(pos)}`);
    return true; // Log error and stop trying
  }
}

/**
 * Road building task - creates road construction sites along paths
 * @param {Creep} creep - The creep to execute the task
 * @return {boolean} - True if road construction site was created
 */
Creep.buildRoads = function(creep) {
  const room = Game.rooms[creep.room.name];
  const memoryPaths = room.getMemoryPaths();

  // Iterate through all saved paths in room memory
  for (const pathName of Object.keys(memoryPaths)) {
    const path = room.getMemoryPath(pathName);

    // Check each position in the path
    for (const pathStep of Object.values(path)) {
      const pos = new RoomPosition(pathStep.x, pathStep.y, creep.room.name);

      // Skip if road already exists
      if (hasRoadAtPosition(pos)) {
        continue;
      }

      // Try to create construction site
      if (createRoadConstructionSite(pos, creep)) {
        return true;
      }
    }
  }

  return false; // No construction sites were created
};

// ============================================================================
// PROTOTYPE HELPER METHODS (Support Startup Tasks)
// ============================================================================

/**
 * Get energy from any friendly structure with available energy
 * @return {boolean} - True if energy gathering was attempted
 */
Creep.prototype.getEnergyFromAnyOfMyStructures = function() {
  if (this.carry.energy) {
    return false;
  }
  let structures = this.room.findStructuresWithUsableEnergy();
  if (structures.length === 0) {
    return false;
  }
  // Get energy from the structure with highest amount first
  const getEnergy = (object) => object.energy || object.store.energy;
  structures = _.sortBy(structures, [(object) => -getEnergy(object), (object) => object.pos.getRangeTo(this)]);

  const structure = structures[0];
  const range = this.pos.getRangeTo(structure);
  if (range > ADJACENT_RANGE) {
    this.moveToMy(structure.pos, ADJACENT_RANGE);
  } else {
    const resCode = this.withdraw(structure, RESOURCE_ENERGY);
    this.log(Game.time, `withdraw from structure ${structure.structureType} ${resCode}`);
  }
  return true;
};

/**
 * Get energy from hostile structures in the room
 * Prioritizes structures with less energy to destroy them completely
 * @return {boolean} - True if energy gathering was attempted
 */
Creep.prototype.getEnergyFromHostileStructures = function() {
  let hostileStructures = this.room.findHostileStructureWithEnergy();
  if (this.carry.energy || !hostileStructures.length) {
    return false;
  }
  // Get energy from the structure with lowest amount first, so we can safely remove it
  const getEnergy = (object) => object.energy || object.store.energy;
  hostileStructures = _.sortBy(hostileStructures, [getEnergy, (object) => object.pos.getRangeTo(this)]);

  const structure = hostileStructures[0];
  const range = this.pos.getRangeTo(structure);
  if (range > ADJACENT_RANGE) {
    this.moveToMy(structure.pos);
  } else {
    const resCode = this.withdraw(structure, RESOURCE_ENERGY);
    if (resCode === OK && getEnergy(structure) <= this.carryCapacity) {
      structure.destroy();
    } else {
      this.log(Game.time, 'withdraw from hostile ' + resCode);
    }
  }
  return true;
};

/**
 * Get energy from room storage
 * Only works in owned rooms that aren't struggling with energy
 * @return {boolean} - True if energy gathering was attempted
 */
Creep.prototype.getEnergyFromStorage = function() {
  if (!this.room.storage) {
    return false;
  }

  // TODO: Refactor isRampingUp/isStruggling to handle misplacedSpawn with sufficient energy.
  // Currently isStruggling() returns true when misplacedSpawn is set (via isRampingUp),
  // but if we have enough energy to rebuild the spawn, we should allow storage access.
  if (this.room.memory.misplacedSpawn) {
    const spawnCost = CONSTRUCTION_COST[STRUCTURE_SPAWN];
    if (this.room.storage.store.energy <= spawnCost * 3) {
      return false;
    }
    // Has enough energy for spawn rebuild.
    // Still check other isStruggling conditions (excluding isRampingUp/misplacedSpawn):
    if (!this.room.memory.active || this.room.storage.isLow()) {
      return false;
    }
  } else if (this.room.isStruggling()) {
    return false;
  }

  if (this.store.energy) {
    return false;
  }

  const range = this.pos.getRangeTo(this.room.storage);
  if (range === ADJACENT_RANGE) {
    this.withdraw(this.room.storage, RESOURCE_ENERGY);
  } else {
    this.moveToMy(this.room.storage.pos, ADJACENT_RANGE, true);
  }
  return true;
};

/**
 * Perform the actual repair action on a structure
 * @param {Structure} toRepair - The structure to repair
 * @return {boolean} - True if repair was attempted
 */
Creep.prototype.actuallyRepairStructure = function(toRepair) {
  this.creepLog('actuallyRepairStructure');
  const range = this.pos.getRangeTo(toRepair);
  if (range <= REPAIR_RANGE) {
    this.creepLog(`actuallyRepairStructure - within range ${range} ${toRepair.pos}`);
    this.repair(toRepair);
    this.moveRandomWithin(toRepair);

    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? moveRandomWithin`);
    }
    return true;
  }

  if (this.fatigue > 0) {
    return true;
  }

  const returnCode = this.moveToMy(toRepair.pos, REPAIR_RANGE, true);
  if (returnCode === true) {
    this.creepLog('actuallyRepairStructure - moveToMy');
    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? moveToMy`);
    }
    return true;
  }
  this.log('config_creep_resources.repairStructure moveByPath.returnCode: ' + returnCode);
  return true;
};

/**
 * Emergency repair for ramparts protecting spawns from incoming nukes
 * @return {boolean} - True if emergency repair target was set
 */
Creep.prototype.repairStructureWithIncomingNuke = function() {
  const nukes = this.room.findNukes();
  if (nukes.length === 0) {
    return false;
  }
  this.log('repairing because of nuke');
  const spawns = this.room.findSpawn();
  if (spawns.length === 0) {
    return false;
  }

  for (const spawn of spawns) {
    let found = false;
    let rampart;
    const structures = spawn.pos.lookFor(LOOK_STRUCTURES);
    for (const structure of structures) {
      // TODO this can be extracted to Structure.prototype.isRampart()
      if (structure.structureType === STRUCTURE_RAMPART) {
        if (structure.hits < RAMPART_NUKE_PROTECTION_HITS) {
          found = true;
          rampart = structure;
          break;
        }
      }
    }
    if (found) {
      this.memory.target = rampart.id;
      this.memory.step = 1200000;
      return true;
    }
  }
};

/**
 * Get the current repair target from memory
 * @return {Structure|false} - The target structure or false if invalid
 */
Creep.prototype.repairStructureGetTarget = function() {
  const toRepair = Game.getObjectById(this.memory.routing.targetId);
  if (!toRepair || toRepair === null) {
    this.say('No target');
    delete this.memory.routing.targetId;
    return false;
  }
  return toRepair;
};

/**
 * isStructureWithinRepairStepRange
 *
 * Repair creeps store a range to with blockers should be repaired.
 * Structures are compared to this range
 * @param {object} structure
 * @param {number} step
 * @return {boolean}
 */
function isStructureWithinRepairStepRange(structure, step) {
  // Skip structures without hits (e.g., newbie zone walls with decayTime)
  if (structure.hits === undefined) {
    return false;
  }
  if (structure.hits >= structure.hitsMax) {
    return false;
  }
  // step should ONLY work to defending structures, means wall and rampart.
  // should NOT stop repairer from repairing roads (roads on swamp have hitsMax = 25K, which sometimes larger than your current wall)
  if ([STRUCTURE_WALL, STRUCTURE_RAMPART].includes(structure.structureType) && structure.hits > step + REPAIR_STEP_BONUS) {
    return false;
  }
  return true;
}

/**
 * Repair a known target structure from memory
 * @return {boolean} - True if repair was attempted
 */
Creep.prototype.repairKnownTarget = function() {
  if (!this.memory.routing.targetId) {
    this.creepLog('repairKnownTarget no targetId');
    return false;
  }

  const toRepair = this.repairStructureGetTarget();
  if (!toRepair) {
    return false;
  }
  this.creepLog('repairKnownTarget toRepair');

  if (toRepair instanceof ConstructionSite) {
    if (this.pos.roomName !== this.memory.base) {
      this.log(`Not in my base room why? moveToAndBuildConstructionSite`);
    }
    this.creepLog('repairKnownTarget moveToAndBuildConstructionSite');
    return this.moveToAndBuildConstructionSite(toRepair);
  }

  if (!isStructureWithinRepairStepRange(toRepair, this.memory.step)) {
    delete this.memory.routing.targetId;
    return false;
  }

  if (this.pos.roomName !== this.memory.base) {
    this.log(`Not in my base room why? actuallyRepairStructure`);
  }
  if (toRepair.hits === toRepair.hitsMax) {
    delete this.memory.routing.targetId;
    return false;
  }
  this.creepLog('repairKnownTarget actuallyRepairStructure');
  return this.actuallyRepairStructure(toRepair);
};

/**
 * Set a repair target and execute the repair
 * @param {string} targetId - The ID of the structure to repair
 * @param {number} [step] - Optional step value to set for repair progression
 * @return {boolean} - Always returns true
 */
Creep.prototype.setRepairTarget = function(targetId, step) {
  if (step !== undefined) {
    this.memory.step = step;
  }
  this.memory.routing.targetId = targetId;
  this.repairKnownTarget();
  return true;
};

/**
 * Try to find and target low-hit ramparts for emergency repair
 * @return {boolean} - True if low rampart was found and targeted
 */
Creep.prototype.findAndRepairLowRamparts = function() {
  const lowRamparts = this.pos.findCloseByLowHitRamparts();
  if (lowRamparts.length > 0) {
    return this.setRepairTarget(lowRamparts[0].id);
  }
  return false;
};

/**
 * Try to find and target construction sites for building
 * @return {boolean} - True if construction site was found and targeted
 */
Creep.prototype.findAndBuildConstructionSites = function() {
  const target = this.pos.findClosestByRangeBlockerConstructionSite();
  if (target) {
    return this.setRepairTarget(target.id, 0);
  }
  return false;
};

/**
 * Try to find and target damaged roads for repair
 * @return {boolean} - True if damaged road was found and targeted
 */
Creep.prototype.findAndRepairRoads = function() {
  const road = this.pos.findClosestByRangeRepairableRoad();
  if (road) {
    return this.setRepairTarget(road.id);
  }
  return false;
};

/**
 * Try to find and target ramparts/walls within repair step range
 * @return {boolean} - True if structure was found and targeted
 */
Creep.prototype.findAndRepairDefensiveStructures = function() {
  const structure = this.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: (structure) => {
      if ([STRUCTURE_RAMPART, STRUCTURE_WALL].indexOf(structure.structureType) < 0) {
        return false;
      }
      return isStructureWithinRepairStepRange(structure, this.memory.step);
    },
  });

  this.creepLog(`findAndRepairDefensiveStructures - structure: ${structure}`);
  if (structure) {
    return this.setRepairTarget(structure.id);
  }
  return false;
};

/**
 * Update repair step for progressive wall/rampart repair
 * Gradually increases repair threshold to build up defenses incrementally
 */
Creep.prototype.updateRepairStep = function() {
  if (this.memory.step === 0) {
    this.memory.step = this.room.controller.level * INITIAL_REPAIR_STEP_MULTIPLIER;
  }
  this.memory.step = (this.memory.step * REPAIR_STEP_MULTIPLIER) + 1;
};

/**
 * Main repair structure coordination function
 * Tries different repair strategies in priority order
 * @return {boolean} - True if repair task was found and executed
 */
Creep.prototype.repairStructure = function() {
  // Priority 1: Continue existing repair target
  if (this.repairKnownTarget()) {
    return true;
  }

  // Priority 2: Emergency nuke protection
  if (this.repairStructureWithIncomingNuke()) {
    return true;
  }

  // Priority 3: Critical rampart repairs
  if (this.findAndRepairLowRamparts()) {
    return true;
  }

  // Priority 4: Construction sites (infrastructure expansion)
  if (this.findAndBuildConstructionSites()) {
    return true;
  }

  // Priority 5: Road maintenance
  if (this.findAndRepairRoads()) {
    return true;
  }

  // Priority 6: Progressive defensive structure repair
  if (this.findAndRepairDefensiveStructures()) {
    return true;
  }

  // No repair targets found - increase repair threshold and try again next tick
  this.updateRepairStep();
  return false;
};

/**
 *
 * @param {Resource} target Resource object to pick up
 * @return {number} total received resources amount
 */
/**
 * Pick up a resource and withdraw additional resources from nearby containers/creeps
 * @param {Resource} target - Resource object to pick up
 * @return {number} - Total amount of resources received
 */
Creep.prototype.pickupOrWithdrawFromSourcer = function(target) {
  const creepFreeSpace = this.carryCapacity - _.sum(this.carry);
  let pickedUp = 0;
  // this.log('pickupOrWithdrawFromSourcer free '+creepFreeSpace+' '+target+' '+target.amount)
  if (target.amount < creepFreeSpace) {
    const container = target.pos.lookFor(LOOK_STRUCTURES)
      .find((structure) => structure.structureType === STRUCTURE_CONTAINER && structure.store[target.resourceType] > 0 && _.sum(structure.store) === structure.storeCapacity);
    if (container) {
      const toWithdraw = Math.min(creepFreeSpace - target.amount, container.store[target.resourceType]);
      this.withdraw(container, target.resourceType, toWithdraw);
      pickedUp += toWithdraw;
    } else {
      const sourcer = target.pos.lookFor(LOOK_CREEPS)
        .find((creep) => creep.memory && creep.memory.role === 'sourcer' && creep.carry[target.resourceType] > 0 && _.sum(creep.carry) === creep.carryCapacity);
      if (sourcer) {
        const toWithdraw = Math.min(creepFreeSpace - target.amount, sourcer.carry[target.resourceType]);
        sourcer.transfer(this, target.resourceType, toWithdraw);
        pickedUp += toWithdraw;
      }
    }
  }
  this.pickup(target);
  pickedUp += target.amount;
  return Math.min(pickedUp, creepFreeSpace);
};
