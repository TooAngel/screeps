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
global.RoomPosition = function () {};
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
    const creep = new Creep('harvester');
    let config = room.getCreepConfig(creep);
    assert.equal(config.opts.memory.role, 'harvester');
    assert.deepEqual(config.body, [ 'move', 'move', 'carry', 'carry', 'carry', 'work' ]);

    room = new Room('W1N1', 300);
    config = room.getCreepConfig(creep);
    assert.deepEqual(config.body, [ 'move', 'move', 'work', 'carry' ]);
  });
});
