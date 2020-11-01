const variables = require('@screeps/common/lib/constants');

for (const variableName of Object.keys(variables)) {
  global[variableName] = variables[variableName];
}

global.Room = function (name, energyAvailable) {
  this.name = name;
  this.energyAvailable = energyAvailable;
  this.memory = {
    energyStats: {},
  };
};
global.RoomObject = function () {};
global.RoomPosition = function (x, y, roomName) {
  this.x = x;
  this.y = y;
  this.roomName = roomName;
};
global.Creep = function (role) {
  this.role = role;
};
global.Structure = function () {};
global._ = require('lodash');
global.Game = new function () {
  this.time = 1;
  this.cpu = {
    getUsed: () => {},
  };
};
global.Memory = new function() {};

const main = require('../src/main');

var assert = require('assert');
describe('Room', function() {
  it('getCreepConfig downgraded rooms does not break harvester config (issue #585)', function() {
    let room = new Room('W1N1', 500);
    room.storage = {
      my: true,
      store: {
        energy: 100000,
      },
      memory: {
        misplacedSpawn: false,
      }
    }
    const creep = new Creep('harvester');
    let config = room.getCreepConfig(creep);
    assert.equal(config.opts.memory.role, 'harvester');
    assert.deepEqual(config.body, [ 'move', 'move', 'move', 'move', 'work', 'work', 'carry', 'carry' ]);

    room = new Room('W1N1', 300);
    config = room.getCreepConfig(creep);
    assert.deepEqual(config.body, [ 'move', 'move', 'work', 'carry' ]);
  });

  it('isSameCreep harvester special case (issue #597)', function() {
    let room = new Room('W1N1', 400);
    room.storage = {
      my: true,
      store: {
        energy: 100000,
      },
      memory: {
        misplacedSpawn: false,
      }
    }
    assert.equal(true, room.isSameCreep({role: 'harvester', routing: {}}, {role: 'harvester', routing: {targetId: 'targetId'}}));
  });

  it('getCreepConfig attackunreserve has heal', function() {
    let room = new Room('W1N1', 1200);
    room.storage = {
      my: true,
      store: {
        energy: 100000,
      },
      memory: {
        misplacedSpawn: false,
      }
    }
    const creep = new Creep('attackunreserve');
    let config = room.getCreepConfig(creep);
    assert.equal(config.opts.memory.role, 'attackunreserve');
    assert.deepEqual(config.body, [ 'attack', 'attack', 'attack', 'move', 'move', 'move', 'ranged_attack', 'heal', 'heal', 'move', 'move', 'move' ]);
  });

  it('RoomPosition.isBorder', function() {
    assert.equal(true, new RoomPosition(49, 10, 'W1N1').isBorder(-1));
    assert.equal(true, new RoomPosition(0, 10, 'W1N1').isBorder(-1));
    assert.equal(true, new RoomPosition(10, 49, 'W1N1').isBorder(-1));
    assert.equal(true, new RoomPosition(10, 0, 'W1N1').isBorder(-1));

    assert.equal(false, new RoomPosition(48, 10, 'W1N1').isBorder(-1));
    assert.equal(false, new RoomPosition(1, 10, 'W1N1').isBorder(-1));
    assert.equal(false, new RoomPosition(10, 48, 'W1N1').isBorder(-1));
    assert.equal(false, new RoomPosition(10, 1, 'W1N1').isBorder(-1));
  });
});
