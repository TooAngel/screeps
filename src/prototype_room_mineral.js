'use strict';

Room.prototype.getNextReaction = function() {
  for (let mineralFirst in this.terminal.store) {
    if (!REACTIONS[mineralFirst]) {
      continue;
    }
    for (let mineralSecond in this.terminal.store) {
      if (!REACTIONS[mineralFirst][mineralSecond]) {
        continue;
      }
      let result = REACTIONS[mineralFirst][mineralSecond];
      if (this.terminal.store[result] > config.mineral.minAmount) {
        continue;
      }
      //this.log('Could build: ' + mineralFirst + ' ' + mineralSecond + ' ' + result);
      return {
        result: result,
        first: mineralFirst,
        second: mineralSecond
      };
    }
  }
  return false;
};

Room.prototype.reactions = function() {
  if (!this.memory.reaction) {
    let result = this.getNextReaction();
    if (!result) {
      return;
    }

    let labsAll = this.find(FIND_MY_STRUCTURES, {
      filter: function(object) {
        if (object.structureType != STRUCTURE_LAB) {
          return false;
        }
        if (!object.mineralType) {
          return true;
        }
        if (object.mineralType === result.result) {
          return true;
        }
        return false;
      }
    });

    let lab;
    let labs = [];
    let getNearLabs = function(object) {
      if (object.id === lab.id) {
        return false;
      }
      if (object.structureType != STRUCTURE_LAB) {
        return false;
      }
      if (!object.mineralType) {
        return true;
      }
      if (object.mineralType === result.first) {
        return true;
      }
      if (object.mineralType === result.second) {
        return true;
      }
      return false;
    };

    for (lab of labsAll) {
      let labsNear = lab.pos.findInRange(FIND_MY_STRUCTURES, 2, {
        filter: getNearLabs
      });

      if (labsNear.length >= 2) {
        labs.push(lab.id);
        //        console.log(lab.mineralType, result.result);

        for (let labNear of labsNear) {
          if (!labNear.mineralType || labNear.mineralType === result.first) {
            //            console.log(labNear.mineralType, result.first);
            labs.push(labNear.id);
            break;
          }
        }
        for (let labNear of labsNear) {
          if (labNear.id === labs[1]) {
            continue;
          }
          if (!labNear.mineralType || labNear.mineralType === result.second) {
            //            console.log(labNear.mineralType, result.second);
            labs.push(labNear.id);
            break;
          }
        }
        break;
      }
    }
    if (labs.length < 3) {
      return false;
    }
    this.memory.reaction = {
      result: result,
      labs: labs
    };
    //    this.log('Setting reaction: ' + JSON.stringify(this.memory.reaction));
  }

  if (this.terminal.store[this.memory.reaction.result.result] > config.mineral.minAmount) {
    this.log('Done with reaction:' + this.memory.reaction.result.result);
    delete this.memory.reaction;
  }
};

Room.prototype.orderMinerals = function() {
  let minerals = this.find(FIND_MINERALS);
  let resource = minerals[0].mineralType;

  if (Game.time % 20 === 0) {
    let baseMinerals = [
      RESOURCE_HYDROGEN,
      RESOURCE_OXYGEN,
      RESOURCE_UTRIUM,
      RESOURCE_LEMERGIUM,
      RESOURCE_KEANIUM,
      RESOURCE_ZYNTHIUM,
      RESOURCE_CATALYST,
      RESOURCE_GHODIUM
    ];

    let room = this;
    let orderByDistance = function(object) {
      return Game.map.getRoomLinearDistance(room.name, object);
    };

    for (let mineral of baseMinerals) {
      if (!this.terminal.store[mineral]) {
        let roomsOther = _.sortBy(Memory.myRooms, orderByDistance);

        for (let roomOtherName of roomsOther) {
          if (roomOtherName === this.name) {
            continue;
          }
          let roomOther = Game.rooms[roomOtherName];
          if (!roomOther || roomOther === null) {
            continue;
          }
          let minerals = roomOther.find(FIND_MINERALS);
          if (minerals.length === 0) {
            continue;
          }
          let mineralType = minerals[0].mineralType;
          if (!roomOther.terminal || roomOther.terminal[minerals[0].mineralType] < config.mineral.minAmount) {
            continue;
          }
          if (mineralType === mineral) {
            roomOther.memory.mineralOrder = roomOther.memory.mineralOrder || {};
            if (roomOther.memory.mineralOrder[room.name]) {
              break;
            }
            roomOther.memory.mineralOrder[room.name] = 1000;
            //            room.log('Ordering ' + mineralType + ' from ' + roomOther.name);
            break;
          }
        }
      }
    }
  }
};

Room.prototype.handleTerminal = function() {
  let minerals = this.find(FIND_MINERALS);
  if (minerals.length === 0) {
    return false;
  }
  let resource = minerals[0].mineralType;

  if (!this.terminal) {
    return false;
  }

  this.orderMinerals();
  this.reactions();

  if (!this.memory.mineralOrder || Object.keys(this.memory.mineralOrder).length === 0) {
    return false;
  }

  let roomOtherName = Object.keys(this.memory.mineralOrder)[0];
  let roomOther = Game.rooms[roomOtherName];
  let order = this.memory.mineralOrder[roomOtherName];
  let linearDistanceBetweenRooms = Game.map.getRoomLinearDistance(this.name, roomOtherName);
  let energy = Math.ceil(0.1 * order * linearDistanceBetweenRooms);

  if (this.terminal.store.energy < energy) {
    //this.log('Terminal not enough energy');
    this.memory.terminalTooLessEnergy = true;
    return false;
  }

  this.memory.terminalTooLessEnergy = false;

  if (this.terminal.store[resource] < order) {
    return false;
  }
  this.terminal.send(resource, order, roomOtherName);
  delete this.memory.mineralOrder[roomOtherName];
  return true;
};
