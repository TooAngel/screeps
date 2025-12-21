'use strict';

/**
 * The data property represent the current data of the room stored on the heap
 */
Object.defineProperty(Room.prototype, 'data', {
  get() {
    if (!global.data.rooms[this.name]) {
      const data = {
        routing: {},
        positions: {
          creep: {},
          structure: {},
        },
      };
      if (this.isMy()) {
        data.positions = this.memory.position || {};
        // TODO do not store costMatrix in memory, this can be generated from positions
        data.costMatrix = PathFinder.CostMatrix.deserialize(this.memory.costMatrix);
        data.routing = {};
        if (this.memory.routing) {
          for (const pathName of Object.keys(this.memory.routing)) {
            const path = Room.stringToPath(this.memory.routing[pathName].path);
            data.routing[pathName] = {
              path: path,
              created: this.memory.routing[pathName].created,
              fixed: this.memory.routing[pathName].fixed,
              name: this.memory.routing[pathName].name,
            };
          }
        }
      }
      global.data.rooms[this.name] = data;
    }
    return global.data.rooms[this.name];
  },
});

Room.prototype.executeEveryTicks = function(ticks) {
  const timer = (ticks > 3000) ? Game.time - Memory.time + 1 : 0;
  let execute = false;
  if (this.controller) {
    execute = (timer > 1) ? (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks < timer : (Game.time + this.controller.pos.x + this.controller.pos.y) % ticks === 0;
  } else {
    execute = (timer > 1) ? (Game.time % ticks) < timer : (Game.time % ticks) === 0;
  }
  return execute;
};

/**
 * Direction constants to string mapping for blocked exit detection
 */
const EXIT_DIRECTION_MAP = {
  1: 'top', // FIND_EXIT_TOP
  3: 'right', // FIND_EXIT_RIGHT
  5: 'bottom', // FIND_EXIT_BOTTOM
  7: 'left', // FIND_EXIT_LEFT
};

/**
 * checkBlockedExits - Check all exits for newbie walls and store in room data
 * Called periodically to update blocked exit information for routing
 *
 * @param {Room} room - The room to check
 */
function checkBlockedExits(room) {
  const blockedExits = {};
  const exits = Game.map.describeExits(room.name);

  for (const direction in exits) {
    if (!Object.prototype.hasOwnProperty.call(exits, direction)) continue;
    const exitPositions = room.find(parseInt(direction, 10));
    if (exitPositions.length === 0) continue;

    // Check if ALL exit tiles are blocked by newbie/respawn walls
    const isBlocked = exitPositions.every((exitPos) => {
      const structures = room.lookForAt(LOOK_STRUCTURES, exitPos);
      // Newbie walls have decayTime property, or no hitsMax
      return structures.some((s) => s.structureType === STRUCTURE_WALL && (!s.hitsMax || s.decayTime));
    });

    if (isBlocked) {
      const dirName = EXIT_DIRECTION_MAP[direction];
      if (dirName) {
        blockedExits[dirName] = true;
      }
    }
  }

  room.data.blockedExits = blockedExits;
}

/**
 * updateBasicData - Updates basic room data
 * - Sets the number of sources
 * - Sets the controller id
 * - Sets the hostile count
 * - Checks for blocked exits (newbie walls)
 *
 * @param {object} room - The room to init
 * @return {void}
 **/
function updateBasicData(room) {
  if (room.data.sources === undefined) {
    room.data.sources = room.findSources().length;
  }
  if (room.data.controllerId === undefined) {
    room.data.controllerId = false;
    if (room.controller) {
      room.data.controllerId = room.controller.id;
      if (!room.data.mineral) {
        const minerals = room.findMinerals();
        room.data.mineral = minerals[0].mineralType;
      }
    }
  }
  room.data.hostileCreepCount = room.find(FIND_HOSTILE_CREEPS).length;

  // Check blocked exits periodically (every 100 ticks) for routing
  if (room.data.blockedExits === undefined || room.executeEveryTicks(100)) {
    checkBlockedExits(room);
  }
}

Room.prototype.isMy = function() {
  return !!(this.controller && this.controller.my);
};

Room.prototype.handle = function() {
  updateBasicData(this);
  if (this.isMy()) {
    this.myHandleRoom();
    return true;
  }
  this.externalHandleRoom();
  return false;
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
    this.data.lastSeen = Game.time;
    if (this.isMy()) {
      this.memory.lastSeen = Game.time;
    }
  }
};
