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
  room.memory.hostileCreepCount = room.findEnemys().length;
}

Room.prototype.handle = function() {
  if (this.controller && this.controller.my) {
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

Room.prototype.checkCorrectLinkPositionForFiller = function() {
  const fillerPos = this.memory.position.creep.filler[0];
  const linkPos = this.getFirstLinkNextToPosition(fillerPos);
  if (linkPos && linkPos.x !== this.memory.position.structure.link[0].x || linkPos.y !== this.memory.position.structure.link[0].y) {
    this.log(`checkbugs: Wrong linkStorage position! Should be first in room.position.structure.link. Real position: ${JSON.stringify(linkPos)}`);
  }
};

Room.prototype.execute = function() {
  initMemory(this);
  try {
    if (global.config.ticksummary.room) {
      const roomStr = `<a href="#!/room/${Game.shard.name}/${this.name}">${this.name}</a>`;
      if (this.controller && this.controller.my) {
        if (this.controller.progressTotal) {
          let logLine = `${Game.time} ${roomStr}(${this.controller.level}) ${global.utils.lpadround(this.controller.progress / this.controller.progressTotal*100, 3, 2)} %`;
          logLine += `  ${this.controller.progress}/${this.controller.progressTotal} - ${this.energyAvailable}/${this.energyCapacityAvailable}`;
          console.log(logLine);
        } else {
          console.log(`${Game.time} ${roomStr}(${this.controller.level}) - ${this.energyAvailable}/${this.energyCapacityAvailable}`);
        }
        let roomqueue = '';
        for (const q in this.memory.queue) {
          if (roomqueue === '') {
            roomqueue += this.memory.queue[q].role;
          } else {
            roomqueue += ', ' + this.memory.queue[q].role;
          }
        }
        if (roomqueue !== '') {
          console.log(`${Game.time}  ${roomqueue}`);
        }
      }
    }
    if (global.config.debug.checkbugs) {
      if (this.controller && this.controller.my) {
        if (this.memory.position) {
          this.checkCorrectLinkPositionForFiller();
        }
      }
    }
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
    this.memory.lastSeen = Game.time;
  }
};
