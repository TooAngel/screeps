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
      const keeper = room.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', [role]);
      const cSize = _.filter(keeper, (c) => c.memory.routing.targetId === posId);
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
  // TODO Understand this logic again, I guess redo the complete logic
  if (!baseRoom.memory.energyStats || baseRoom.memory.energyStats.available < 2000) {
    return false;
  }
  return _.map(keeperPositions, (keeper) => {
    // todo-msc remove W4S6
    if ((baseRoom.memory.queue.length < queueMaxLength) && ((room.name === 'W4S6') || (room.name === 'W4S4'))) {
      return _.map(keeper.roles, (role) => {
        // const returnValue = false;
        // todo-msc fix minerl harvesting
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
          const creepMemory = baseRoom.creepMem(role.role, keeper.posId, room.name, undefined, room.memory.base);
          const inQueue = baseRoom.inQueue(creepMemory);
          const inRoom = baseRoom.inRoom(creepMemory, amount);
          room.log('checkRoleToSpawn', returnValue,
            JSON.stringify({
              room: room.name,
              base: room.memory.base,
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
  let returnValue = false;
  if (Game.rooms[this.memory.base] && Game.rooms[this.memory.base].controller) {
    if (Game.rooms[this.memory.base].controller.level >= config.keepers.minControllerLevel) {
      this.checkForWatcher();
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
    this.log('Error no Access to ', this.memory.base, 'or its controller');
  }
  return returnValue;
};

Room.prototype.keeperTeamReady = function() {
  const atkeepermelee = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeepermelee']);
  const atkeeper = this.findPropertyFilter(FIND_MY_CREEPS, 'memory.role', ['atkeeper']);
  this.memory.atkeeper = atkeeper.length;
  this.memory.atkeepermelee = atkeepermelee.length;
  return (atkeepermelee.length > 0 && atkeeper.length > 0);
};

Room.prototype.getNextSourceKeeperLair = function() {
  const sourceKeeper = this.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_KEEPER_LAIR]);
  const sourceKeeperNext = _.sortBy(sourceKeeper, (object) => object.ticksToSpawn);
  return sourceKeeperNext[0];
};
