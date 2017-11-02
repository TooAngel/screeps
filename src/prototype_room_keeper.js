'use strict';

Room.prototype.findKeepersAt = function(roles, posId) {
  const s = Game.getObjectById(posId);
  const type = s.energy > 0 ? 'energy' : ((s.mineralAmount > 0) ? 'mineral' : 'offline');
  const amount = (s.energy > 1000) ? s.energy : ((s.mineralAmount > 2000) ? s.mineralAmount : false);
  const room = this;
  return {
    type: type,
    posId: posId,
    amount: amount,
    roles: _.map(roles, (role) => {
      const keepers = room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', [role]);
      const cSize = _.filter(keepers, (c) => c.memory.routing.targetId === posId);
      return {
        role: role,
        size: _.size(cSize),
      };
    }),
  };
};

Room.prototype.findKeepers = function(roles) {
  if (this.memory.position && this.memory.position.creep) {
    const positions = this.memory.position.creep;
    const room = this;
    const updateKeepersPos = (pos, posId) => {
      return room.findKeepersAt(roles, posId);
    };
    return _.map(positions, updateKeepersPos);
  } else {
    // todo-msc try setup?
    if (this.memory.position) {
      this.log('no memory.position.creep');
    } else {
      this.log('no memory.position');
    }
  }
  return false;
};

Room.prototype.updateKeepers = function() {
  const roles = ['atkeepermelee', 'atkeeper', 'sourcer'];
  this.memory.keepersRoles = roles;
  this.memory.keepers = this.findKeepers(roles);
};

Room.prototype.spawnKeepers = function() {
  const room = this;
  const keeperPositions = this.memory.keepers;
  const baseRoom = Game.rooms[room.memory.base];
  const amount = 1;
  const queueMaxLength = 10;
  return _.map(keeperPositions, (keeper) => {
    // todo-msc remove W4S6
    if ((baseRoom.memory.queue.length < queueMaxLength) && (room.name === 'W4S6')) {
      return _.map(keeper.roles, (role) => {
        // const returnValue = false;
        const returnValue = (role.size < amount) ? baseRoom.checkRoleToSpawn(role.role, amount, keeper.posId, room.name, undefined, room.memory.base) : false;
        // room.log('checkRoleToSpawn', returnValue, role.role, amount, keeper.posId, room.name, null, room.memory.base);
        return {
          role: role.role,
          success: returnValue > 0,
          queue: returnValue > 0 ? returnValue : baseRoom.memory.queue.length,
          baseRoom: baseRoom.name,
        };
      });
    } else {
      return {
        success: false,
        queue: baseRoom.memory.queue.length,
        baseRoom: baseRoom.name,
      };
    }
  });
};

Room.prototype.checkForWatcher = function() {
  const baseRoom = Game.rooms[this.memory.base];
  const watcher = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['watcher']);
  if (baseRoom && _.size(watcher) < 1) {
    return baseRoom.checkRoleToSpawn('watcher', 1, undefined, this.name);
  }
  return false;
};

Room.prototype.updateClosestSpawn = function() {
  this.memory.base = this.closestSpawn(this.name);
  return this.memory.base;
};

Room.prototype.spawnKeepersEveryTicks = function(ticks) {
  if (this.exectueEveryTicks(ticks)) {
    let returnValue = false;
    if (Game.rooms[this.memory.base].controller.level > 6) {
      if (this.updateClosestSpawn()) {
        returnValue = this.spawnKeepers();
        if (returnValue && returnValue[0] && returnValue[0][0] && returnValue[0][0].success) {
          this.log('spawnKeepers', JSON.stringify(returnValue[0]));
        }
        return returnValue;
      }
    }
    return returnValue;
  }
};

Creep.prototype.isDamaged = function() {
  return this.hits / this.hitsMax;
};

Room.prototype.keeperTeamReady = function() {
  const atkeepermelee = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeepermelee']);
  const atkeeper = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeeper']);
  return (atkeepermelee.length > 0 && atkeeper.length > 0);
};

Room.prototype.getNextSourceKeeperLair = function() {
  const sourceKeeper = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_KEEPER_LAIR]);
  const sourceKeeperNext = _.sortBy(sourceKeeper, (object) => object.ticksToSpawn);
  return sourceKeeperNext[0];
};

