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
  if (!this.controller) {
    var nameSplit = this.splitRoomName();
    if (nameSplit[2] % 10 === 0 || nameSplit[4] % 10 === 0) {
      return this.externalHandleHighwayRoom();
    }
  } else {
    if (this.controller.owner) {
      return this.handleOccupiedRoom();
    }

    if (this.controller.reservation && this.controller.reservation.username == Memory.username) {
      this.memory.lastSeen = Game.time;
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

Room.prototype.externalHandleHighwayRoom = function() {
  if (config.power.disabled) {
    return false;
  }

  var structures = this.find(FIND_STRUCTURES, {
    filter: {
      structureType: STRUCTURE_POWER_BANK
    }
  });
  if (structures.length === 0) {
    if (Memory.powerBanks) {
      delete Memory.powerBanks[this.name];
    }
    return false;
  }

  if (Memory.powerBanks && Memory.powerBanks[this.name]) {
    if (Memory.powerBanks[this.name].target && Memory.powerBanks[this.name] !== null) {
      if (Memory.powerBanks[this.name].transporter_called) {
        return;
      }
      if (structures[0].hits < 300000) {
        for (var i = 0; i < Math.ceil(structures[0].power / 1000); i++) {
          this.log('Adding powertransporter at ' + Memory.powerBanks[this.name].target);
          Game.rooms[Memory.powerBanks[this.name].target].memory.queue.push({
            role: 'powertransporter',
            target: this.name
          });
        }

        Memory.powerBanks[this.name].transporter_called = true;
      }
    }
    return;
  }

  // Fix for W8S9
  var walls = this.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == 'constructedWall';
    }
  });

  if (structures[0].ticksToDecay < 3000) {
    Memory.powerBanks[this.name] = {
      target: null
    };
    return true;
  } else {
    var min_route = 6;
    var target = null;
    var route;
    for (var room_id in Memory.myRooms) {
      var room = Game.rooms[Memory.myRooms[room_id]];
      if (!room || !room.storage || room.storage.store.energy < config.power.energyForCreeps) {
        continue;
      }
      var route_to_test = Game.map.findRoute(this.name, room.name);
      if (route_to_test.length < min_route) {
        min_route = route_to_test.length;
        target = room;
        route = route_to_test;
      }
    }

    if (!Memory.powerBanks) {
      Memory.powerBanks = {};
    }
    if (target !== null) {
      if (walls.length > 0) {
        var exits = this.find(route[0].exit);
        var exit = exits[exits.length - 1];
        var path = this.findPath(exit, structures[0].pos);
        var last_pos = path[path.length - 1];
        if (!structures[0].pos.isEqualTo(last_pos.x, last_pos.y)) {
          this.log('No route due to wall');
          Memory.powerBanks[this.name] = {
            target: null
          };
          return true;
        }
      }

      Memory.powerBanks[this.name] = {
        target: target.name,
        min_route: min_route
      };
      this.log('--------------> Start power harvesting in: ' + target.name + ' <----------------');
      Game.rooms[target.name].memory.queue.push({
        role: 'powerattacker',
        target: this.name
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerhealer',
        target: this.name
      });
      Game.rooms[target.name].memory.queue.push({
        role: 'powerhealer',
        target: this.name
      });
    } else {
      Memory.powerBanks[this.name] = {
        target: null
      };
    }
  }
};

Room.prototype.handleOccupiedRoom = function() {
  this.memory.lastSeen = Game.time;
  var hostiles = this.find(FIND_HOSTILE_CREEPS);
  if (hostiles.length > 0) {
    // TODO replace with enum
    this.memory.state = 'Occupied';
    this.memory.player = this.controller.owner.username;

    // TODO trigger everytime?
    if (!this.controller.safeMode) {
      let myCreeps = this.find(FIND_MY_CREEPS, {
        filter: function(object) {
          let creep = Game.getObjectById(object.id);
          if (creep.memory.role == 'scout') {
            return false;
          }
          return true;
        }
      });
      if (myCreeps.length > 0) {
        return false;
      }

      var spawns = this.find(FIND_HOSTILE_STRUCTURES, {
        filter: function(object) {
          return object.structureType == STRUCTURE_SPAWN;
        }
      });
      if (spawns.length > 0) {
        this.attackRoom();
      }
    }

    return false;
  }
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
