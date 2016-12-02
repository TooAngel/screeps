Room.prototype.checkBlocked = function() {
  let exits = Game.map.describeExits(this.name);
  let room = this;
  let roomCallback = function(roomName) {
    let costMatrix = new PathFinder.CostMatrix();
    let structures = room.find(FIND_STRUCTURES);
    for (let structure of structures) {
      costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
    }
    return costMatrix;
  };
  for (let fromDirection in exits) {
    let fromExitDirection = this.findExitTo(exits[fromDirection]);
    let fromExitPoss = this.find(fromExitDirection);
    let fromNextExit = fromExitPoss[Math.floor(fromExitPoss.length / 2)];
    for (let toDirection in exits) {
      if (fromDirection == toDirection) {
        continue;
      }

      let toExitDirection = this.findExitTo(exits[toDirection]);
      let toExitPoss = this.find(toExitDirection);
      let toNextExit = toExitPoss[Math.floor(toExitPoss.length / 2)];

      let search = PathFinder.search(fromNextExit, toNextExit, {
        maxRooms: 0,
        roomCallback: roomCallback
      });
      if (search.incomplete) {
        return true;
      }
    }
  }
  return false;
};


Room.prototype.externalHandleRoom = function() {

  var name_split = this.split_room_name();
  if (name_split[2] % 10 === 0 || name_split[4] % 10 === 0) {
    return this.executeHighwayRoom();
  }

  if (this.controller && this.controller.reservation && this.controller.reservation.username == Memory.username) {
    this.memory.lastSeen = Game.time;
    return false;
  }

  if (this.controller && this.controller.owner) {
    this.memory.lastSeen = Game.time;
    var hostiles = this.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
      // TODO replace with enum
      this.memory.state = 'Occupied';
      this.memory.player = this.controller.owner.username;

      // TODO Not if in safe mode
      // TODO trigger everytime?
      if (!this.controller.safeMode) {
        let myCreeps = this.find(FIND_MY_CREEPS);
        if (myCreeps.length > 1) {
          return false;
        }

        var spawns = this.find(FIND_HOSTILE_STRUCTURES, {
          filter: function(object) {
            return object.structureType == 'spawn';
          }
        });
        if (spawns.length > 0) {
          this.attackRoom();
        }
      }

      return false;
    }
  }

  let blocked = this.checkBlocked();
  if (blocked) {
    this.memory.lastSeen = Game.time;
    this.memory.state = 'Blocked';
  }

  if (this.controller && !this.controller.reservation) {
    if (this.handleUnreservedRoom()) {
      return false;
    }
  }

  if (!this.controller) {
    var sourceKeeper = this.find(FIND_HOSTILE_STRUCTURES, {
      filter: function(object) {
        return object.owner.username == 'Source Keeper';
      }
    });

    if (sourceKeeper.length > 0) {
      this.memory.lastSeen = Game.time;
      this.handleSourceKeeperRoom();
      return false;
    }
  }

  delete Memory.rooms[this.roomName];
  return false;

};

Room.prototype.handleUnreservedRoom = function() {
  this.memory.state = 'Unreserved';
  this.memory.lastSeen = Game.time;

  if (this.memory.reservation) {
    if (this.name == this.memory.reservation.base) {
      this.log('Want to spawn reserver for the base room, why?');
      return false;
    }
    this.memory.state = 'Reserved';
    if (Game.time % 500 === 0) {
      let reserverSpawn = {
        role: 'reserver',
        target: this.name,
        target_id: this.controller.id,
        level: 2
      };
      // TODO move the creep check from the reserver to here and spawn only sourcer (or one part reserver) when controller.level < 4
      let energyThreshold = 1300;
      if (Game.rooms[this.memory.reservation.base].misplacedSpawn) {
        energyThreshold = 1600;
      }
      if (Game.rooms[this.memory.reservation.base].controller.level > 3 && Game.rooms[this.memory.reservation.base].energyCapacityAvailable > energyThreshold) {
        this.log('Queuing reserver ' + this.memory.reservation.base + ' ' + JSON.stringify(reserverSpawn));
        Game.rooms[this.memory.reservation.base].memory.queue.push(reserverSpawn);
      }
    }
    return true;
  }

  for (let roomName of Memory.myRooms) {
    let room = Game.rooms[roomName];
    // TODO mark as reserved earlier, but only send sourcer
    if (room.controller.level < 4) {
      continue;
    }

    let distance = Game.map.getRoomLinearDistance(this.name, roomName);
    if (distance <= config.external.distance) {
      if (room.memory.queue.length === 0) {
        let reservedRooms = _.filter(Memory.rooms, function(object) {
          if (!object.reservation) {
            return false;
          }
          if (object.state != 'Reserved') {
            return false;
          }
          return object.reservation.base == roomName;
        });
        if (reservedRooms < room.controller.level - 1) {
          this.log('Would start to spawn');

          // TODO Check paths to decide for structurer

          this.memory.reservation = {
            base: roomName,
            tick: Game.time
          };
          this.memory.state = 'Reserved';
          let reserverSpawn = {
            role: 'reserver',
            target: this.name,
            target_id: this.controller.id,
            level: 2
          };
          // TODO move the creep check from the reserver to here and spawn only sourcer (or one part reserver) when controller.level < 4
          let energyThreshold = 1300;
          if (Game.rooms[this.memory.reservation.base].misplacedSpawn) {
            energyThreshold = 1600;
          }
          if (Game.rooms[this.memory.reservation.base].controller.level > 3 && Game.rooms[this.memory.reservation.base].energyCapacityAvailable > energyThreshold) {
            this.log('Queuing reserver ' + this.memory.reservation.base + ' ' + JSON.stringify(reserverSpawn));
            Game.rooms[this.memory.reservation.base].memory.queue.push(reserverSpawn);
          }
          break;
        }
      }
    }
  }

  //    this.log(`Unreserved room found`);
  return true;
};


Room.prototype.handleSourceKeeperRoom = function() {
  if (!this.memory.base) {
    return false;
  }

  if (Game.time % 893 !== 0) {
    return false;
  }
  this.log('handle source keeper room');
  this.log('DISABLED - Routing keep distance to Source keeper structure, sourcer/carry check for next spawn, move await ~10 ticksToSpawn');
  if (true) return false;

  let myCreeps = this.find(FIND_MY_CREEPS);
  let sourcer = 0;
  let melee = 0;
  for (let object of myCreeps) {
    let creep = Game.getObjectById(object.id);
    if (creep.memory.role == 'sourcer') {
      sourcer++;
      continue;
    }
    if (creep.memory.role == 'atkeepermelee') {
      melee++;
      continue;
    }
  }

  if (sourcer < 3) {
    let getSourcer = function(object) {
      let creep = Game.getObjectById(object.id);
      if (creep.memory.role == 'sourcer') {
        return true;
      }
      return false;
    };

    for (let source of this.find(FIND_SOURCES)) {
      let sourcer = source.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: getSourcer
      });
      if (sourcer !== null) {
        let range = source.pos.getRangeTo(sourcer.pos);
        if (range < 7) {
          continue;
        }
      }
      let spawn = {
        role: 'sourcer',
        source: source.pos,
        target: source.pos.roomName,
        target_id: source.id,
        routing: {
          targetId: source.id,
          targetRoom: source.pos.roomName
        }
      };
      this.log(`!!!!!!!!!!!! ${JSON.stringify(spawn)}`);
      Game.rooms[this.memory.base].memory.queue.push(spawn);
    }
  }

  if (melee === 0) {
    var spawn = {
      role: 'atkeepermelee',
      target: this.name
    };
    this.log(`!!!!!!!!!!!! ${JSON.stringify(spawn)}`);
    Game.rooms[this.memory.base].memory.queue.push(spawn);
  }
};
