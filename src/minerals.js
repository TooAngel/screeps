'use strict';

function orderMinerals(room, mineralsBase) {
  for (let mineral in room.terminal.store) {
    let index = mineralsBase.indexOf(mineral);
    if (index > -1) {
      mineralsBase.splice(index, 1);
    }
  }

  let roomsOther = _.sortBy(Memory.myRooms, function(o) {
    return Game.map.getRoomLinearDistance(room.name, o);
  });

  for (let roomOtherName of roomsOther) {
    if (mineralsBase.length === 0) {
      break;
    }
    if (roomOtherName == room.name) {
      continue;
    }
    let roomOther = Game.rooms[roomOtherName];
    let minerals = roomOther.find(FIND_MINERALS);
    let mineralType = minerals[0].mineralType;
    if (!roomOther.terminal || roomOther.terminal[minerals[0].mineralType] < 10000) {
      continue;
    }
    let index = mineralsBase.indexOf(mineralType);
    if (index > -1) {
      mineralsBase.splice(index, 1);
      roomOther.memory.mineralOrder = roomOther.memory.mineralOrder || {};
      if (roomOther.memory.mineralOrder[room.name]) {
        continue;
      }
      roomOther.memory.mineralOrder[room.name] = 1000;
      //      room.log('Ordering ' + mineralType + ' from ' + roomOther.name);
      continue;
    }
  }

}

function boostWork(roomName) {
  let room = Game.rooms[roomName];
  let mineralsBase = [RESOURCE_UTRIUM, RESOURCE_OXYGEN];
  orderMinerals(room, mineralsBase);
  room.memory.mineralBuilds = room.memory.mineralBuilds || {};
  room.memory.mineralBuilds[RESOURCE_UTRIUM_OXIDE] = 1000;
}

function boostRepair(roomName) {
  let room = Game.rooms[roomName];
  let mineralsBase = [RESOURCE_LEMERGIUM, RESOURCE_HYDROGEN];
  orderMinerals(room, mineralsBase);
  room.memory.mineralBuilds = room.memory.mineralBuilds || {};
  room.memory.mineralBuilds[RESOURCE_LEMERGIUM_HYDRIDE] = 1000;
}

function buildNuke(roomName) {
  let room = Game.rooms[roomName];

  let nukers = room.find(FIND_STRUCTURES, {
    filter: {
      structureType: STRUCTURE_NUKER
    }
  });
  if (nukers.length === 0) {
    room.log('No nukers');
    return false;
  }
  let nuker = nukers[0];
  room.log(JSON.stringify(nuker));

  //  o = zk + ul
  //  zk = z + k
  //  ul = u + l
  let mineralsBase = [RESOURCE_ZYNTHIUM, RESOURCE_KEANIUM, RESOURCE_UTRIUM, RESOURCE_LEMERGIUM];
  orderMinerals(room.mineralsBase);

  room.memory.mineralBuilds = room.memory.mineralBuilds || {};
  room.memory.mineralBuilds[RESOURCE_ZYNTHIUM_KEANITE] = 1000;
  room.memory.mineralBuilds[RESOURCE_UTRIUM_LEMERGITE] = 1000;
  room.memory.mineralBuilds[RESOURCE_GHODIUM] = 1000;

  room.log(mineralsBase);
  return true;
}

module.exports = {
  buildNuke: function(roomName) {
    return buildNuke(roomName);
  },

  boostWork: function(roomName) {
    return boostWork(roomName);
  },

  boostRepair: function(roomName) {
    return boostRepair(roomName);
  },

  checkMinerals: function() {
    let minerals = {};
    for (let name of Memory.myRooms) {
      let room = Game.rooms[name];
      if (room.terminal) {
        console.log(name, JSON.stringify(room.terminal.store));
        for (let mineral in room.terminal.store) {
          if (mineral == 'U') {
            console.log(room.name, room.terminal.store[mineral]);
          }
          if (!minerals[mineral]) {
            minerals[mineral] = room.terminal.store[mineral];
          } else {
            minerals[mineral] += room.terminal.store[mineral];
          }
        }
      }
    }

    console.log(JSON.stringify(minerals));
    console.log(minerals.U);
  }
};
