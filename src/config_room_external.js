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
