const variables = require('@screeps/common/lib/constants');

for (const variableName of Object.keys(variables)) {
  global[variableName] = variables[variableName];
}

global.Room = function(name, energyAvailable) {
  this.name = name;
  this.energyAvailable = energyAvailable;
  this.memory = {
    energyStats: {},
  };
  this.controller = {
    level: 1,
  };
};
global.RoomObject = function() {};
global.RoomPosition = function(x, y, roomName) {
  this.x = x;
  this.y = y;
  this.roomName = roomName;
};
global.Creep = function(role) {
  this.role = role;
};
global.Structure = function() {};
global.StructureController = function() {};
global.StructureStorage = function() {};
global._ = require('lodash');
global.Game = new function() {
  this.time = 1;
  this.cpu = {
    getUsed: () => {},
  };
  this.gcl = {
    level: 10,
  };
};
global.Memory = new function() {};

require('../src/main');

const assert = require('assert');
describe('Room', () => {
  it('getCreepConfig downgraded rooms does not break universal config (issue #585)', () => {
    let room = new Room('W1N1', 500);
    room.storage = {
      my: true,
      store: {
        energy: 100000,
      },
      memory: {
        misplacedSpawn: false,
      },
    };
    const creep = new Creep('universal');
    let config = room.getCreepConfig(creep);
    assert.equal(config.opts.memory.role, 'universal');
    assert.deepEqual(config.body, ['move', 'move', 'work', 'carry', 'move', 'work', 'carry', 'move']);

    room = new Room('W1N1', 300);
    config = room.getCreepConfig(creep);
    assert.deepEqual(config.body, ['move', 'work', 'carry', 'move']);
  });

  it('isSameCreep universal special case (issue #597)', () => {
    const room = new Room('W1N1', 400);
    room.storage = {
      my: true,
      store: {
        energy: 100000,
      },
      memory: {
        misplacedSpawn: false,
      },
    };
    assert.equal(true, room.isSameCreep({role: 'universal', routing: {}}, {role: 'universal', routing: {targetId: 'targetId'}}));
  });

  it('getCreepConfig attackunreserve has heal', () => {
    const room = new Room('W1N1', 1200);
    room.controller = {
      level: 1,
    };
    room.storage = {
      my: true,
      store: {
        energy: 100000,
      },
      memory: {
        misplacedSpawn: false,
      },
    };
    const creep = new Creep('attackunreserve');
    const config = room.getCreepConfig(creep);
    assert.equal(config.opts.memory.role, 'attackunreserve');
    assert.deepEqual(config.body, ['move', 'move', 'move', 'move', 'ranged_attack', 'attack', 'move', 'heal', 'heal', 'ranged_attack']);
  });

  it('RoomPosition.isBorder', () => {
    assert.equal(true, new RoomPosition(49, 10, 'W1N1').isBorder(-1));
    assert.equal(true, new RoomPosition(0, 10, 'W1N1').isBorder(-1));
    assert.equal(true, new RoomPosition(10, 49, 'W1N1').isBorder(-1));
    assert.equal(true, new RoomPosition(10, 0, 'W1N1').isBorder(-1));

    assert.equal(false, new RoomPosition(48, 10, 'W1N1').isBorder(-1));
    assert.equal(false, new RoomPosition(1, 10, 'W1N1').isBorder(-1));
    assert.equal(false, new RoomPosition(10, 48, 'W1N1').isBorder(-1));
    assert.equal(false, new RoomPosition(10, 1, 'W1N1').isBorder(-1));
  });

  it('Upgrader getCreepConfig', () => {
    const room = new Room('W1N1', 5000);
    room.storage = {
      my: true,
      store: {
        energy: 1000,
      },
      memory: {
        misplacedSpawn: false,
      },
    };


    const upgraderConfigs = [
      {energy: 6000, parts: ['work', 'carry', 'work', 'move']},
      {energy: 9000, parts: ['work', 'work', 'carry', 'work', 'move']},
      {energy: 12000, parts: ['work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 15000, parts: ['work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 18000, parts: ['work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 21000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 24000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 27000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 30000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 33000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 36000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 39000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 42000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 45000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
      {energy: 48000, parts: ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']},
    ];

    const creep = new Creep('upgrader');
    let config = room.getCreepConfig(creep);
    assert.equal(config.opts.memory.role, 'upgrader');
    assert.deepEqual(config.body, ['carry', 'work', 'move']);

    for (const upgraderConfig of upgraderConfigs) {
      room.storage.store.energy = upgraderConfig.energy;
      config = room.getCreepConfig(creep);
      assert.deepEqual(config.body, upgraderConfig.parts, upgraderConfig.energy);
    }

    const roomLevel8 = new Room('W1N1', 5000);
    roomLevel8.storage = {
      my: true,
      store: {
        energy: 1000,
      },
      memory: {
        misplacedSpawn: false,
      },
    };
    roomLevel8.controller.level = 8;
    roomLevel8.storage.store.energy = 48000;
    config = roomLevel8.getCreepConfig(creep);
    assert.deepEqual(config.body, ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']);

    const roomLowEnergy = new Room('W1N1', 500);
    roomLowEnergy.storage = {
      my: true,
      store: {
        energy: 1000,
      },
      memory: {
        misplacedSpawn: false,
      },
    };
    roomLowEnergy.storage.store.energy = 48000;
    config = roomLowEnergy.getCreepConfig(creep);
    assert.deepEqual(config.body, ['work', 'work', 'work', 'carry', 'work', 'move']);
  });
});
