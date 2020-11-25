'use strict';

/*
 * Called to defend external rooms
 *
 * Fights against hostile creeps
 */

roles.attackunreserve = {};
roles.attackunreserve.boostActions = ['rangedAttack', 'heal'];

roles.attackunreserve.settings = {
  prefixString: 'MMMRHH',
  layoutString: 'AM',
};

roles.attackunreserve.preMove = function(creep) {
  if (creep.hits < 0.5 * creep.hitsMax) {
    creep.memory.routing.reverse = true;
    creep.memory.routing.reached = false;
    const inRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
    if (inRange.length > 0) {
      creep.creepLog('Attack creep in range');
      attack(creep, inRange[0]);
    }
    return false;
  }
  if (creep.hits > 0.75 * creep.hitsMax) {
    creep.memory.routing.reverse = false;
    return false;
  }
  creep.selfHeal();
  if (!creep.inMyRoom()) {
    let targets = creep.pos.findHostileStructuresInRangedAttackRange();
    if (targets.length === 0) {
      targets = creep.pos.findInRangeStructures(FIND_STRUCTURES, 1, [STRUCTURE_WALL, STRUCTURE_RAMPART]);
    }
    creep.rangeAttackOutsideOfMyRooms(targets);
  }
};

/**
 * getFilterForBodyPart - gets a filter for a given bodyPart
 *
 * @param {string} bodyPart - The body part name
 * @return {function} - The filter function for that body part
 **/
function getFilterForBodyPart(bodyPart) {
  return (item) => {
    for (const part of item.body) {
      if (part.type === bodyPart) {
        return true;
      }
    }
    return false;
  };
}

/**
 * attach - attacks the target
 *
 * @param {object} creep - The attacker
 * @param {object} target - The target
 * @return {bool} - Returns true :-)
 **/
function attack(creep, target) {
  // TODO needs to be changed to some of our moveTo methods, preventing from
  // exiting the room
  if (target.pos.x > 0 && target.pos.x < 49 && target.pos.y > 0 && target.pos.y < 49) {
    creep.moveTo(target.pos);
  }
  creep.rangedAttack(target);
  creep.attack(target);
  return true;
}

roles.attackunreserve.action = function(creep) {
  creep.notifyWhenAttacked(false);
  creep.selfHeal();

  const inRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
  if (inRange.length > 0) {
    creep.creepLog('Attack creep in range');
    return attack(creep, inRange[0]);
  }

  const parts = [CLAIM, WORK, CARRY];
  for (const part of parts) {
    const hostileCreepsWithPart = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {filter: getFilterForBodyPart(part)});
    if (hostileCreepsWithPart) {
      return attack(creep, hostileCreepsWithPart);
    }
  }

  const hostileCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (hostileCreep) {
    creep.creepLog(`attack other hostile creeps`);
    return attack(creep, hostileCreep);
  }

  const hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
  if (hostileStructure) {
    creep.creepLog(`attack other hostile structures`);
    return attack(creep, hostileStructure);
  }

  const structure = creep.pos.findClosestByRange(FIND_STRUCTURES);
  if (structure) {
    return attack(creep, structure);
  }
  this.log('No target found');
  return true;
};
