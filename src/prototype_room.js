'use strict';

Room.prototype.executeEveryTicks = function(ticks) {
  const timer = (ticks > 3000) ? Game.time - Memory.time + 1 : 0;
  let exectue = false;
  if (this.controller) {
    exectue = (timer > 1) ? (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks < timer : (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks === 0;
  } else {
    exectue = (timer > 1) ? (Game.time % ticks) < timer : (Game.time % ticks) === 0;
  }
  return exectue;
};

/**
 * initMemory - Initializes the memory if not present
 * - Sets the number of sources
 * - Sets the controller id
 *
 * @param {object} room - The room to init
 * @return {void}
 **/
function initMemory(room) {
  if (room.memory.sources === undefined) {
    room.memory.sources = room.findSources().length;
  }
  if (room.memory.controllerId === undefined) {
    room.memory.controllerId = false;
    if (room.controller) {
      room.memory.controllerId = room.controller.id;
    }
  }
  room.memory.hostileCreepCount = room.find(FIND_HOSTILE_CREEPS).length;
}

Room.prototype.getData = function() {
  if (!global.data.rooms[this.name]) {
    global.data.rooms[this.name] = {};
  }
  return global.data.rooms[this.name];
};

/**
 * initMemory - Initializes the memory if not present
 * - Sets the number of sources
 * - Sets the controller id
 *
 * @param {object} room - The room to init
 * @return {void}
 **/
function initCache(room) {
  const data = room.getData();
  if (data.sources === undefined) {
    data.sources = room.findSources().length;
  }
  if (data.controllerId === undefined) {
    data.controllerId = false;
    if (room.controller) {
      data.controllerId = room.controller.id;
    }
  }
  data.hostileCreepCount = room.find(FIND_HOSTILE_CREEPS).length;
}

Room.prototype.isMy = function() {
  return this.controller && this.controller.my;
};

Room.prototype.handle = function() {
  initCache(this);
  if (this.isMy()) {
    this.memory.lastSeen = Game.time;
    initMemory(this);
    this.myHandleRoom();
    return true;
  }
  this.externalHandleRoom();
  return false;
};

Room.prototype.getFirstLinkNextToPosition = function(position) {
  for (const link of this.memory.position.structure.link) {
    if (link.x <= position.x + 1 && link.x >= position.x - 1 && link.y <= position.y + 1 && link.y >= position.y - 1) {
      return link;
    }
  }
};

Room.prototype.execute = function() {
  try {
    const returnCode = this.handle();
    for (const creep of this.findMyCreeps()) {
      creep.handle();
    }
    return returnCode;
  } catch (err) {
    this.log('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack);
    Game.notify('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack, 30);
    return false;
  } finally {
    this.getData().lastSeen = Game.time;
  }
};
