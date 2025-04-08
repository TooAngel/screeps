'use strict';

Creep.prototype.isDamaged = function() {
  return this.hits / this.hitsMax;
};

Creep.prototype.selfHeal = function() {
  if (!this.memory.canHeal) {
    this.memory.canHeal = this.getActiveBodyparts(HEAL) > 0;
  }
  if (this.memory.canHeal && this.isDamaged() < 1) {
    this.heal(this);
  }
};

Creep.prototype.healMyCreeps = function() {
  const myCreeps = this.room.findMyCreepsToHeal();
  if (myCreeps.length > 0) {
    this.say('heal', true);
    this.moveTo(myCreeps[0]);
    if (this.pos.getRangeTo(myCreeps[0]) <= 1) {
      this.heal(myCreeps[0]);
    } else {
      this.rangedHeal(myCreeps[0]);
    }
    return true;
  }
  return false;
};

Creep.prototype.healAllyCreeps = function() {
  const allyCreeps = this.room.findAlliedCreepsToHeal();
  if (allyCreeps.length > 0) {
    this.say('heal ally', true);
    this.moveTo(allyCreeps[0]);
    const range = this.pos.getRangeTo(allyCreeps[0]);
    if (range <= 1) {
      this.heal(allyCreeps[0]);
    } else {
      this.rangedHeal(allyCreeps[0]);
    }
    return true;
  }
};

Creep.prototype.healCreep = function(range, myCreep) {
  if (range <= 1) {
    this.heal(myCreep);
  } else {
    this.moveTo(myCreep);
    this.rangedHeal(myCreep);
  }
};

Creep.prototype.squadHeal = function() {
  let range;
  const creepToHeal = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (object) => object.hits < object.hitsMax / 1.5,
  });

  if (creepToHeal !== null) {
    range = this.pos.getRangeTo(creepToHeal);
    this.healCreep(range, creepToHeal);
    return true;
  }

  if (this.healClosestCreep(true)) {
    return true;
  }

  if (this.pos.isBorder(-1)) {
    this.moveTo(25, 25);
    return true;
  }

  const attacker = this.pos.findClosestByRangeSquadSiegeCreep();
  if (attacker === null) {
    const cs = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    this.moveTo(cs);
    return false;
  }
  this.moveTo(attacker);
  return false;
};

Creep.prototype.healClosestCreep = function(andExit) {
  const myCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (o) => o.isDamaged() < 1,
  });
  if (myCreep !== null) {
    this.say('heal', true);
    const range = this.pos.getRangeTo(myCreep);
    this.healCreep(range, myCreep);
    if (andExit) {
      if (myCreep.id === this.id) {
        this.say('exit');
        const exit = this.pos.findClosestByRange(FIND_EXIT);
        this.moveTo(exit);
      } else {
        this.moveTo(myCreep);
      }
    }
    return true;
  }
  return false;
};
