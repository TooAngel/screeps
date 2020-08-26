'use strict';

/*
 * atkeeper is used to kill Source Keeper (melee version)
 *
 * Attacks source keeper, move away when hits below 'threshold'
 * If no source keeper is available move to position where the next will spawn
 */

roles.atkeepermelee = {};
roles.atkeepermelee.settings = {
  layoutString: 'AMH',
  amount: [22, 25, 3],
  fillTough: false,
  maxLayoutAmount: 1,
};

roles.atkeepermelee.preMove = function(creep) {
  creep.checkForRoutingReached();
  if (creep.memory.canHeal && creep.isDamaged() < 1) {
    creep.heal(creep);
  }
};

roles.atkeepermelee.action = function(creep) {
  // TODO Untested
  creep.spawnReplacement();
  creep.setNextSpawn();
  creep.memory.canHeal = creep.getActiveBodyparts(HEAL) > 0;

  if (creep.isDamaged() === 1) {
    creep.memory.damaged = false;
  }

  const moveToCenter = function(creep) {
    const center = new RoomPosition(25, 25, creep.memory.routing.targetRoom);
    return creep.moveTo(center, {ignoreCreeps: false, reusePath: 2});
  };

  if (creep.getActiveBodyparts(ATTACK) === 0) {
    creep.memory.damaged = true;
  }

  const healMove = function(creep, target) {
    const range = creep.pos.getRangeTo(target.pos);
    if (range > 5) {
      creep.moveToMy(target.pos);
    } else if (range > 2) {
      creep.moveTo(target.pos, {ignoreCreeps: false, reusePath: 2});
    } else {
      creep.moveRandomWithin(target.pos, 1);
      if (target.structureType === 'keeperLair') {
        creep.selfHeal();
      }
    }
  };

  const attack = function(creep) {
    creep.say('attack');
    // todo-msc cache target
    const lastTarget = Game.getObjectById(creep.room.memory.lastTarget);
    let target = (lastTarget && lastTarget.hits && lastTarget.hitsMax) ? lastTarget : creep.findClosestSourceKeeper();
    if (target === null) {
      target = creep.findClosestEnemy() || creep.room.getNextSourceKeeperLair();
      creep.room.memory.lastTarget = target.id;
    }
    if (target) {
      creep.room.memory.lastTarget = target.id;
    }
    healMove(creep, target);
    const returnValue = creep.attack(target);
    if (returnValue !== OK) {
      creep.selfHeal();
    }
    return true;
  };

  if (creep.room.name === creep.memory.routing.targetRoom) {
    if (creep.memory.damaged || creep.isDamaged() < 0.4 || (creep.getActiveBodyparts(ATTACK) === 0)) {
      if (creep.memory.canHeal) {
        creep.heal(creep);
      }
      creep.memory.damaged = true;
      creep.memory.canHeal = creep.getActiveBodyparts(HEAL) > 0;
      return moveToCenter(creep);
    }
    if (creep.room.keeperTeamReady()) {
      if (attack(creep)) {
        return true;
      }
      if (creep.isDamaged() <= 1 && creep.memory.canHeal) {
        creep.heal(creep);
      }
    }
  }
  return moveToCenter(creep);
};
