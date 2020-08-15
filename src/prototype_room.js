'use strict';

Room.prototype.exectueEveryTicks = function(ticks) {
  const timer = (ticks > 3000) ? Game.time - Memory.time + 1 : 0;
  let exectue = false;
  if (this.controller) {
    exectue = (timer > 1) ? (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks < timer : (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks === 0;
  } else {
    exectue = (timer > 1) ? (Game.time % ticks) < timer : (Game.time % ticks) === 0;
  }
  return exectue;
};

Room.prototype.handle = function() {
  if (this.controller && this.controller.my) {
    return this.myHandleRoom();
  }
  return this.externalHandleRoom();
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
  this.memory.lastSeen = Game.time;
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
    for (const creep of this.find(FIND_MY_CREEPS)) {
      creep.handle();
    }
    return returnCode;
  } catch (err) {
    this.log('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack);
    Game.notify('Executing room failed: ' + this.name + ' ' + err + ' ' + err.stack, 30);
    return false;
  }
};
