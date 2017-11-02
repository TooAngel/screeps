'use strict';

/*
 * atkeeper is used to kill Source Keeper (melee version)
 *
 * Attacks source keeper, move away when hits below 'threshold'
 * If no source keeper is available move to position where the next will spawn
 */

roles.atkeepermelee = {};
roles.atkeepermelee.settings = {
  layoutString: 'TAMH',
  amount: [10, 10, 21, 1],
  fillTough: false,
  maxLayoutAmount: 1,
};

roles.atkeepermelee.preMove = function(creep, direction) {
  if (creep.room.name === creep.memory.routing.targetRoom) {
    creep.memory.routing.reached = true;
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


  const attack = function(creep) {
    creep.say('attack');
    // todo-msc cache target
    const lastTarget = Game.getObjectById(creep.room.memory.lastTarget);
    let target = (lastTarget && lastTarget.hits && lastTarget.hitsMax) ? lastTarget : creep.findClosestSourceKeeper();
    if (lastTarget && !(lastTarget.hits && lastTarget.hitsMax)) {
      creep.log(JSON.stringify(lastTarget));
    }
    if (target === null) {
      target = creep.room.getNextSourceKeeperLair();
      creep.room.memory.lastTarget = target.id;
    }
    if (target) {
      creep.room.memory.lastTarget = target.id;
    }
    if (creep.pos.getRangeTo(target.pos) > 1) {
      creep.moveToMy(target.pos);
    }
    creep.attack(target);
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

roles.atkeepermelee.execute = function(creep) {
  creep.log('Execute!!!');
};
