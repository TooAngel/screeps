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
  const myCreeps = this.room.find(FIND_MY_CREEPS, {
    filter: function(object) {
      if (object.hits < object.hitsMax) {
        return true;
      }
      return false;
    },
  });
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
  const allyCreeps = this.room.find(FIND_HOSTILE_CREEPS, {
    filter: function(object) {
      if (object.hits === object.hitsMax) {
        return false;
      }
      if (brain.isFriend(object.owner.username)) {
        return true;
      }
      return false;
    },
  });
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

Creep.prototype.squadHeal = function() {
  let range;
  let creepToHeal = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax / 1.5;
    },
  });

  if (creepToHeal !== null) {
    range = this.pos.getRangeTo(creepToHeal);
    if (range <= 1) {
      this.heal(creepToHeal);
    } else {
      this.rangedHeal(creepToHeal);
      this.moveTo(creepToHeal);
    }
    return true;
  }

  creepToHeal = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: function(object) {
      return object.hits < object.hitsMax;
    },
  });

  if (creepToHeal !== null) {
    range = this.pos.getRangeTo(creepToHeal);
    if (range > 1) {
      this.rangedHeal(creepToHeal);
    } else {
      this.heal(creepToHeal);
    }
    if (creepToHeal.id === this.id) {
      this.say('exit');
      const exit = this.pos.findClosestByRange(FIND_EXIT);
      this.moveTo(exit);
    } else {
      this.say(JSON.stringify(creepToHeal));
      this.moveTo(creepToHeal);
    }
    return true;
  }

  const attacker = this.pos.findClosestByRangePropertyFilter(FIND_MY_CREEPS, 'memory.role', ['squadsiege']);

  if (this.pos.isBorder(-1)) {
    this.moveTo(25, 25);
    return true;
  }
  if (attacker === null) {
    const cs = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    this.moveTo(cs);
    return false;
  }
  this.moveTo(attacker);
  return false;
};

Creep.prototype.healClosestCreep = function() {
  const myCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (o) => o.isDamaged() < 1,
  });
  if (myCreep !== null) {
    this.say('heal', true);
    const range = this.pos.getRangeTo(myCreep);
    if (range <= 1) {
      this.heal(myCreep);
    } else {
      this.moveTo(myCreep);
      this.rangedHeal(myCreep);
    }
    return true;
  }
  return false;
};
