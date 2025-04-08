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
      const keeper = room.find(FIND_MY_CREEPS, {filter: (object) => object.memory.role === role});
      const cSize = _.filter(keeper, (c) => c.memory.routing.targetId === posId);
      return {
        role: role,
        size: _.size(cSize),
      };
    }),
  };
};

Room.prototype.findKeepers = function(roles) {
  if (this.data.positions && this.data.positions.creep) {
    const positions = this.data.positions.creep;
    const room = this;
    const updateKeepersPos = (pos, posId) => {
      return room.findKeepersAt(roles, posId);
    };
    return _.map(positions, updateKeepersPos);
  } else {
    // todo-msc try setup?
    // if (this.memory.position) {
    //   this.log('no memory.position.creep');
    // } else {
    //   this.log('no memory.position');
    // }
  }
  return false;
};

Room.prototype.updateKeepers = function() {
  const roles = ['atkeepermelee', 'atkeeper', 'sourcer'];
  this.data.keepersRoles = roles;
  this.data.keepers = this.findKeepers(roles);
};

Room.prototype.spawnKeepers = function() {
  const room = this;
  const keeperPositions = this.data.keepers;
  const baseRoom = Game.rooms[this.data.base];
  const amount = 1;
  const queueMaxLength = 10;
  // TODO Understand this logic again, I guess redo the complete logic
  if (!baseRoom.memory.energyStats || baseRoom.memory.energyStats.available < 2000) {
    return false;
  }
  return _.map(keeperPositions, (keeper) => {
    if ((baseRoom.memory.queue.length < queueMaxLength)) {
      return _.map(keeper.roles, (role) => {
        // const returnValue = false;
        // todo-msc fix mineral harvesting
        if (keeper.type === 'mineral') {
          return {
            role: 'extractor',
            success: false,
            queue: baseRoom.memory.queue.length,
            baseRoom: baseRoom.name,
          };
        }
        const returnValue = (role.size < amount) ? baseRoom.checkRoleToSpawn(role.role, amount, keeper.posId, room.name, undefined, room.memory.base) : false;
        if (!returnValue && (role.size < amount)) {
          const creepMemory = baseRoom.creepMem(role.role, keeper.posId, room.name, undefined, this.data.base);
          const inQueue = baseRoom.inQueue(creepMemory);
          const inRoom = baseRoom.inRoom(creepMemory, amount);
          room.log('checkRoleToSpawn', returnValue,
            JSON.stringify({
              room: room.name,
              base: this.data.base,
              posId: keeper.posId,
              size: role.size,
              role: role.role,
              inQueue: inQueue,
              inRoom: inRoom,
            }));
        }
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
  const baseRoom = Game.rooms[this.data.base];
  const watcher = this.findWatcher();
  if (baseRoom && _.size(watcher) < 1) {
    return baseRoom.checkRoleToSpawn('watcher', 1, undefined, this.name);
  }
  return false;
};

Room.prototype.updateClosestSpawn = function() {
  this.data.base = this.closestSpawn(this.name);
  return this.data.base;
};

Room.prototype.spawnKeepersEveryTicks = function(ticks) {
  let returnValue = false;
  const baseRoom = Game.rooms[this.data.base];
  if (baseRoom && baseRoom.controller) {
    if (baseRoom.controller.level >= config.keepers.minControllerLevel) {
      // TODO I don't know what the watcher is good for, keeper rooms need to
      // be redone anyway
      // this.checkForWatcher();
      if (this.executeEveryTicks(ticks)) {
        this.updateKeepers();
        if (this.updateClosestSpawn()) {
          returnValue = this.spawnKeepers();
          if (returnValue && returnValue[0] && returnValue[0][0] && returnValue[0][0].success) {
            this.log('spawnKeepers', JSON.stringify(returnValue[0]));
          }
          return returnValue;
        }
      }
    }
  } else {
    this.log('Error no Access to ', this.data.base, 'or its controller');
  }
  return returnValue;
};

Room.prototype.keeperTeamReady = function() {
  const atkeepermelee = this.findAtkeepermelee();
  const atkeeper = this.findAtkeeper();
  this.memory.atkeeper = atkeeper.length;
  this.memory.atkeepermelee = atkeepermelee.length;
  return (atkeepermelee.length > 0 && atkeeper.length > 0);
};

Room.prototype.getNextSourceKeeperLair = function() {
  const sourceKeeper = this.findKeeperLair();
  const sourceKeeperNext = _.sortBy(sourceKeeper, (object) => object.ticksToSpawn);
  return sourceKeeperNext[0];
};
