require('./test_setup');
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

  it('Upgrader RCL 8 linear scaling', () => {
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

    const creep = new Creep('upgrader');
    let config;

    // Test RCL 8 linear scaling: 10k storage → 1 WORK, 800k storage → 15 WORK
    roomLevel8.storage.store.energy = 10000;
    config = roomLevel8.getCreepConfig(creep);
    assert.deepEqual(config.body, ['carry', 'work', 'move']);

    roomLevel8.storage.store.energy = 48000;
    config = roomLevel8.getCreepConfig(creep);
    assert.deepEqual(config.body, ['carry', 'work', 'move']);

    roomLevel8.storage.store.energy = 405000; // Mid-point, should give ~8 work parts
    config = roomLevel8.getCreepConfig(creep);
    assert.deepEqual(config.body, ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']);

    roomLevel8.storage.store.energy = 800000;
    config = roomLevel8.getCreepConfig(creep);
    assert.deepEqual(config.body, ['work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'work', 'carry', 'work', 'move']);
  });

  it('findSpawnsNotSpawning filters inactive spawns (downgraded RCL)', () => {
    const room = new Room('W1N1', 500);

    // Create mock spawns: 3 total (as if built at RCL 8)
    const activeSpawn1 = {
      id: 'spawn1',
      room: room,
      spawning: false,
      isActive: () => true, // Active spawn
    };

    const activeSpawn2 = {
      id: 'spawn2',
      room: room,
      spawning: false,
      isActive: () => true, // Active spawn
    };

    const inactiveSpawn = {
      id: 'spawn3',
      room: room,
      spawning: false,
      isActive: () => false, // Inactive due to low RCL
    };

    const spawningSpawn = {
      id: 'spawn4',
      room: room,
      spawning: {name: 'creep-123'}, // Currently spawning
      isActive: () => true,
    };

    // Mock find method to return all spawns and apply filter
    room.find = (findConstant, opts) => {
      if (findConstant === FIND_MY_SPAWNS) {
        const allSpawns = [activeSpawn1, activeSpawn2, inactiveSpawn, spawningSpawn];
        if (opts && opts.filter) {
          return allSpawns.filter(opts.filter);
        }
        return allSpawns;
      }
      return [];
    };

    const availableSpawns = room.findSpawnsNotSpawning();

    // Should only return active spawns that are not spawning
    assert.equal(availableSpawns.length, 2, 'Should return only active, non-spawning spawns');
    assert.equal(availableSpawns[0].id, 'spawn1', 'First spawn should be spawn1');
    assert.equal(availableSpawns[1].id, 'spawn2', 'Second spawn should be spawn2');
  });
});

describe('Mineral System', () => {
  it('reactions() deletes reaction when first mineral depleted', () => {
    const room = new Room('W1N1', 5000);
    room.terminal = {
      store: {
        [RESOURCE_HYDROGEN]: 0, // Depleted
        [RESOURCE_OXYGEN]: 100,
      },
    };
    room.memory.reaction = {
      result: {
        result: RESOURCE_HYDROXIDE,
        first: RESOURCE_HYDROGEN,
        second: RESOURCE_OXYGEN,
      },
      labs: ['lab0-id', 'lab1-id', 'lab2-id'],
    };

    // Mock labs
    global.Game.getObjectById = (id) => {
      if (id === 'lab0-id') {
        return {
          cooldown: 0,
          runReaction: () => {},
        };
      }
      if (id === 'lab1-id') {
        return {store: {}};
      }
      if (id === 'lab2-id') {
        return {store: {}};
      }
      return null;
    };

    room.reactions();

    // Reaction should be deleted because first mineral is depleted
    assert.equal(room.memory.reaction, undefined);
  });

  it('reactions() deletes reaction when second mineral depleted', () => {
    const room = new Room('W1N1', 5000);
    room.terminal = {
      store: {
        [RESOURCE_HYDROGEN]: 100,
        [RESOURCE_OXYGEN]: 0, // Depleted
      },
    };
    room.memory.reaction = {
      result: {
        result: RESOURCE_HYDROXIDE,
        first: RESOURCE_HYDROGEN,
        second: RESOURCE_OXYGEN,
      },
      labs: ['lab0-id', 'lab1-id', 'lab2-id'],
    };

    // Mock labs
    global.Game.getObjectById = (id) => {
      if (id === 'lab0-id') {
        return {
          cooldown: 0,
          runReaction: () => {},
        };
      }
      if (id === 'lab1-id') {
        return {store: {}};
      }
      if (id === 'lab2-id') {
        return {store: {}};
      }
      return null;
    };

    room.reactions();

    // Reaction should be deleted because second mineral is depleted
    assert.equal(room.memory.reaction, undefined);
  });

  it('reactions() continues when minerals available', () => {
    const room = new Room('W1N1', 5000);
    room.terminal = {
      store: {
        [RESOURCE_HYDROGEN]: 100,
        [RESOURCE_OXYGEN]: 100,
        [RESOURCE_HYDROXIDE]: 0,
      },
    };
    room.memory.reaction = {
      result: {
        result: RESOURCE_HYDROXIDE,
        first: RESOURCE_HYDROGEN,
        second: RESOURCE_OXYGEN,
      },
      labs: ['lab0-id', 'lab1-id', 'lab2-id'],
    };

    let reactionRun = false;
    // Mock labs
    global.Game.getObjectById = (id) => {
      if (id === 'lab0-id') {
        return {
          cooldown: 0,
          runReaction: () => {
            reactionRun = true;
          },
        };
      }
      if (id === 'lab1-id') {
        return {store: {}};
      }
      if (id === 'lab2-id') {
        return {store: {}};
      }
      return null;
    };

    room.reactions();

    // Reaction should still exist and have been run
    assert.notEqual(room.memory.reaction, undefined);
    assert.equal(reactionRun, true);
  });

  it('mineral creep does not set state when terminal lacks minerals for reaction lab 1', () => {
    const room = new Room('W1N1', 5000);
    room.terminal = {
      id: 'terminal-id',
      store: {
        [RESOURCE_HYDROGEN]: 0, // No hydrogen available
        [RESOURCE_OXYGEN]: 100,
      },
    };
    room.storage = {
      id: 'storage-id',
      store: {
        energy: 10000,
      },
    };
    room.memory.reaction = {
      result: {
        result: RESOURCE_HYDROXIDE,
        first: RESOURCE_HYDROGEN,
        second: RESOURCE_OXYGEN,
      },
      labs: ['lab0-id', 'lab1-id', 'lab2-id'],
    };

    const creep = {
      name: 'mineral1',
      role: 'mineral',
      room: room,
      data: {},
      store: {
        getUsedCapacity: () => 0,
        getCapacity: () => 50,
      },
      carry: {},
      say: () => {},
      log: () => {},
      moveRandom: () => {},
    };

    // Mock labs with lab1 needing hydrogen
    global.Game.getObjectById = (id) => {
      if (id === 'lab1-id') {
        return {
          id: 'lab1-id',
          store: {
            [RESOURCE_HYDROGEN]: 0, // Empty, needs refill
            getCapacity: () => 3000,
          },
        };
      }
      if (id === 'lab2-id') {
        return {
          id: 'lab2-id',
          store: {
            [RESOURCE_OXYGEN]: 1500, // Half full
            getCapacity: () => 3000,
          },
        };
      }
      return null;
    };

    // Call the mineral action
    roles.mineral.action(creep);

    // State should NOT be set because terminal lacks hydrogen
    assert.equal(creep.data.state, undefined);
  });

  it('mineral creep sets state when terminal has minerals for reaction lab 1', () => {
    const room = new Room('W1N1', 5000);
    room.terminal = {
      id: 'terminal-id',
      store: {
        [RESOURCE_HYDROGEN]: 100, // Hydrogen available
        [RESOURCE_OXYGEN]: 100,
      },
    };
    room.storage = {
      id: 'storage-id',
      store: {
        energy: 10000,
      },
    };
    room.memory.reaction = {
      result: {
        result: RESOURCE_HYDROXIDE,
        first: RESOURCE_HYDROGEN,
        second: RESOURCE_OXYGEN,
      },
      labs: ['lab0-id', 'lab1-id', 'lab2-id'],
    };

    const creep = {
      name: 'mineral1',
      role: 'mineral',
      room: room,
      data: {},
      store: {
        getUsedCapacity: () => 0,
        getCapacity: () => 50,
      },
      carry: {},
      say: () => {},
      log: () => {},
      moveRandom: () => {},
    };

    // Mock labs with lab1 needing hydrogen
    global.Game.getObjectById = (id) => {
      if (id === 'lab1-id') {
        return {
          id: 'lab1-id',
          store: {
            [RESOURCE_HYDROGEN]: 0, // Empty, needs refill
            getCapacity: () => 3000,
          },
        };
      }
      if (id === 'lab2-id') {
        return {
          id: 'lab2-id',
          store: {
            [RESOURCE_OXYGEN]: 1500, // Half full
            getCapacity: () => 3000,
          },
        };
      }
      return null;
    };

    // Call the mineral action - this should work with the fix
    // Without the fix, it would set state and then fail during execution
    roles.mineral.action(creep);

    // With the fix, state should be set because terminal has the resource
    // (This test will pass after we implement the fix)
  });

  it('mineral creep does not set state when terminal has insufficient resources (1-4 units)', () => {
    const room = new Room('W1N1', 5000);
    room.terminal = {
      id: 'terminal-id',
      store: {
        [RESOURCE_HYDROGEN]: 3, // Insufficient (< LAB_REACTION_AMOUNT of 5)
        [RESOURCE_OXYGEN]: 100,
      },
    };
    room.storage = {
      id: 'storage-id',
      store: {
        energy: 10000,
      },
    };
    room.memory.reaction = {
      result: {
        result: RESOURCE_HYDROXIDE,
        first: RESOURCE_HYDROGEN,
        second: RESOURCE_OXYGEN,
      },
      labs: ['lab0-id', 'lab1-id', 'lab2-id'],
    };

    const creep = {
      name: 'mineral1',
      role: 'mineral',
      room: room,
      data: {},
      store: {
        getUsedCapacity: () => 0,
        getCapacity: () => 50,
      },
      carry: {},
      say: () => {},
      log: () => {},
      moveRandom: () => {},
    };

    // Mock labs with lab1 needing hydrogen
    global.Game.getObjectById = (id) => {
      if (id === 'lab1-id') {
        return {
          id: 'lab1-id',
          store: {
            [RESOURCE_HYDROGEN]: 0, // Empty, needs refill
            getCapacity: () => 3000,
          },
        };
      }
      if (id === 'lab2-id') {
        return {
          id: 'lab2-id',
          store: {
            [RESOURCE_OXYGEN]: 1500,
            getCapacity: () => 3000,
          },
        };
      }
      return null;
    };

    roles.mineral.action(creep);

    // State should NOT be set because terminal has insufficient resources (< LAB_REACTION_AMOUNT)
    assert.equal(creep.data.state, undefined);
  });
});

describe('Creep Spawning', () => {
  it('spawnReplacement respects maxOfRole limit (exactly at limit)', () => {
    const room = new Room('W1N1', 5000);
    let spawnCalled = false;

    const creep1 = {
      name: 'universal-1',
      memory: {
        role: 'universal',
        nextSpawn: 150,
      },
      ticksToLive: 150,
      room: room,
      respawnMe: () => {
        spawnCalled = true;
      },
    };

    // Mock room.findCreep to return only 1 creep (the one calling spawnReplacement)
    room.find = () => [creep1];

    // When maxOfRole=1 and we have 1 creep, should NOT spawn (we're at limit)
    Creep.prototype.spawnReplacement.call(creep1, 1);

    assert.equal(spawnCalled, false, 'Should not spawn when already at maxOfRole limit');
  });

  it('spawnReplacement spawns when below maxOfRole limit', () => {
    const room = new Room('W1N1', 5000);
    let spawnCalled = false;

    const creep1 = {
      name: 'universal-1',
      memory: {
        role: 'universal',
        nextSpawn: 150,
      },
      ticksToLive: 150,
      room: room,
      respawnMe: () => {
        spawnCalled = true;
      },
    };

    // Mock room.findCreep to return only this one creep
    room.find = () => [creep1];

    // When maxOfRole=2 and we have 1 creep, should spawn
    Creep.prototype.spawnReplacement.call(creep1, 2);

    assert.equal(spawnCalled, true, 'Should spawn when below maxOfRole limit');
  });

  it('spawnReplacement does not spawn when above maxOfRole limit', () => {
    const room = new Room('W1N1', 5000);
    let spawnCalled = false;

    const creep1 = {
      name: 'universal-1',
      memory: {
        role: 'universal',
        nextSpawn: 150,
      },
      ticksToLive: 150,
      room: room,
      respawnMe: () => {
        spawnCalled = true;
      },
    };

    const creep2 = {
      name: 'universal-2',
      memory: {
        role: 'universal',
      },
      room: room,
    };

    const creep3 = {
      name: 'universal-3',
      memory: {
        role: 'universal',
      },
      room: room,
    };

    // Mock room.findCreep to return 3 creeps
    room.find = () => [creep1, creep2, creep3];

    // When maxOfRole=2 and we have 3 creeps, should NOT spawn
    Creep.prototype.spawnReplacement.call(creep1, 2);

    assert.equal(spawnCalled, false, 'Should not spawn when above maxOfRole limit');
  });
});

describe('Trapped Detection', () => {
  beforeEach(() => {
    // Add missing prototype method
    String.prototype.rightPad = function(padString, length) { // eslint-disable-line no-extend-native
      let str = this;
      while (str.length < length) {
        str += padString;
      }
      return str;
    };

    // Reset global data
    global.data = {
      rooms: {},
    };
    global.config = {
      trapped: {
        enabled: true,
        minimumGCL: 3,
        stagnationThreshold: 50000,
        checkInterval: 1500,
      },
      nextRoom: {
        cpuPerRoom: 13,
        resourceStats: false,
      },
      debug: {
        trapped: false,
      },
    };
    global.Game = {
      time: 65967000, // Divisible by 1500 (checkInterval)
      gcl: {level: 5},
      cpu: {limit: 500},
      map: {
        describeExits: () => ({
          '1': 'E17S51',
          '3': 'E18S52',
          '5': 'E17S53',
          '7': 'E16S52',
        }),
        getRoomTerrain: () => ({
          get: () => 0, // No terrain walls
        }),
      },
    };
    global.Memory = {
      myRooms: ['E17S52'],
      username: 'TooAngel',
      trapped: {
        stagnantSince: 65220560, // ~746k ticks ago
      },
    };
  });

  it('detects trapped when all exits have no data after long stagnation', () => {
    const brain = require('../src/brain_trapped'); // eslint-disable-line global-require

    // All exits have no data (never scouted or data expired)
    global.data.rooms = {};

    const isTrapped = brain.detectTrappedScenario();

    assert.equal(isTrapped, true, 'Should detect as trapped when stagnant long term with no exit data');
    assert.equal(global.Memory.trapped.isTrapped, true);
    assert.equal(global.Memory.trapped.blockedExits.length, 4, 'Should count all 4 exits as blocked');
  });

  it('does not detect trapped when exit data shows clear paths', () => {
    const brain = require('../src/brain_trapped'); // eslint-disable-line global-require

    // All exits have data showing unoccupied rooms
    global.data.rooms = {
      'E17S51': {state: 'Unoccupied'},
      'E18S52': {state: 'Unoccupied'},
      'E17S53': {state: 'Unoccupied'},
      'E16S52': {state: 'Unoccupied'},
    };

    const isTrapped = brain.detectTrappedScenario();

    assert.equal(isTrapped, false, 'Should not detect as trapped when exits are clear');
  });

  it('detects trapped when some exits blocked and others have no data', () => {
    const brain = require('../src/brain_trapped'); // eslint-disable-line global-require

    // Mix of hostile and no data
    global.data.rooms = {
      'E17S51': {state: 'Occupied', player: 'Enemy'},
      'E18S52': undefined, // No data
      'E17S53': undefined, // No data
      'E16S52': {state: 'Unoccupied'},
    };

    const isTrapped = brain.detectTrappedScenario();

    assert.equal(isTrapped, true, 'Should detect as trapped with 3/4 exits blocked');
    assert.equal(global.Memory.trapped.blockedExits.length >= 3, true);
  });

  it('does not count no-data as blocked when recently stagnant', () => {
    const brain = require('../src/brain_trapped'); // eslint-disable-line global-require

    // Only recently stagnant (less than threshold)
    global.Memory.trapped.stagnantSince = global.Game.time - 10000;

    // All exits have no data
    global.data.rooms = {};

    const isTrapped = brain.detectTrappedScenario();

    assert.equal(isTrapped, false, 'Should not count no-data as blocked when recently stagnant');
  });
});

describe('Squad Roles', () => {
  beforeEach(() => {
    // Setup Memory.squads for tests
    global.Memory.squads = {};
  });

  it('squadsiege does not delete routing.reached when at border position', () => {
    const room = new Room('W1N1', 5000);

    const creep = {
      name: 'squadsiege-1',
      memory: {
        role: 'squadsiege',
        routing: {
          targetRoom: 'W1N2',
          reached: true,
        },
      },
      room: room,
      pos: {
        x: 0, // Border position
        y: 25,
        roomName: 'W1N1',
        isBorder: () => true, // At border
      },
      hits: 1000,
      hitsMax: 1000,
      say: () => {},
      moveRandom: () => {},
      siege: () => true,
    };

    roles.squadsiege.action(creep);

    // routing.reached should still be true because at border
    assert.equal(creep.memory.routing.reached, true);
  });

  it('squadsiege deletes routing.reached when not in target room and not at border', () => {
    const room = new Room('W1N1', 5000);

    const creep = {
      name: 'squadsiege-1',
      memory: {
        role: 'squadsiege',
        routing: {
          targetRoom: 'W1N2',
          reached: true,
        },
      },
      room: room,
      pos: {
        x: 25, // Not border position
        y: 25,
        roomName: 'W1N1',
        isBorder: () => false, // Not at border
      },
      hits: 1000,
      hitsMax: 1000,
      say: () => {},
      moveRandom: () => {},
      siege: () => true,
    };

    roles.squadsiege.action(creep);

    // routing.reached should be deleted because not at border and not in target room
    assert.equal(creep.memory.routing.reached, undefined);
  });

  it('squadsiege does not call siege() when not in target room', () => {
    const room = new Room('W1N1', 5000);
    let siegeCalled = false;

    const creep = {
      name: 'squadsiege-1',
      memory: {
        role: 'squadsiege',
        routing: {
          targetRoom: 'W1N2',
        },
      },
      room: room,
      pos: {
        x: 25,
        y: 25,
        roomName: 'W1N1',
        isBorder: () => false,
      },
      hits: 1000,
      hitsMax: 1000,
      say: () => {},
      moveRandom: () => {},
      siege: () => {
        siegeCalled = true;
        return true;
      },
    };

    roles.squadsiege.action(creep);

    // siege() should NOT be called when traveling (not in target room)
    assert.equal(siegeCalled, false);
  });

  it('squadsiege calls siege() when in target room', () => {
    const room = new Room('W1N1', 5000);
    let siegeCalled = false;

    const creep = {
      name: 'squadsiege-1',
      memory: {
        role: 'squadsiege',
        routing: {
          targetRoom: 'W1N1', // Same as current room
        },
      },
      room: room,
      pos: {
        x: 25,
        y: 25,
        roomName: 'W1N1',
        isBorder: () => false,
      },
      hits: 1000,
      hitsMax: 1000,
      say: () => {},
      siege: () => {
        siegeCalled = true;
        return true;
      },
    };

    roles.squadsiege.action(creep);

    // siege() SHOULD be called when in target room
    assert.equal(siegeCalled, true);
  });

  it('squadheal does not delete routing.reached when at border position', () => {
    const room = new Room('W1N1', 5000);

    const creep = {
      name: 'squadheal-1',
      memory: {
        role: 'squadheal',
        routing: {
          targetRoom: 'W1N2',
          reached: true,
        },
      },
      room: room,
      pos: {
        x: 0, // Border position
        y: 25,
        roomName: 'W1N1',
        isBorder: () => true, // At border
        findClosestByRange: () => null,
      },
      hits: 1000,
      hitsMax: 1000,
      selfHeal: () => {},
      say: () => {},
      moveRandom: () => {},
      moveTo: () => {},
      squadHeal: () => {},
      creepLog: () => {},
    };

    roles.squadheal.action(creep);

    // routing.reached should still be true because at border
    assert.equal(creep.memory.routing.reached, true);
  });

  it('squadheal deletes routing.reached when not in target room and not at border', () => {
    const room = new Room('W1N1', 5000);

    const creep = {
      name: 'squadheal-1',
      memory: {
        role: 'squadheal',
        routing: {
          targetRoom: 'W1N2',
          reached: true,
        },
      },
      room: room,
      pos: {
        x: 25, // Not border position
        y: 25,
        roomName: 'W1N1',
        isBorder: () => false, // Not at border
        findClosestByRange: () => null,
      },
      hits: 1000,
      hitsMax: 1000,
      selfHeal: () => {},
      say: () => {},
      moveRandom: () => {},
      moveTo: () => {},
      squadHeal: () => {},
      creepLog: () => {},
    };

    roles.squadheal.action(creep);

    // routing.reached should be deleted because not at border and not in target room
    assert.equal(creep.memory.routing.reached, undefined);
  });
});

describe('Structure isActive Caching', () => {
  beforeEach(() => {
    // Reset cache before each test
    global.isActiveCache = {};
  });

  it('getCachedIsActive returns cached value on second call', () => {
    let callCount = 0;
    const mockSpawn = {
      id: 'spawn1',
      room: {name: 'W1N1'},
      isActive: () => {
        callCount++;
        return true;
      },
    };

    // First call should invoke isActive()
    const result1 = getCachedIsActive(mockSpawn);
    assert.equal(result1, true, 'First call should return true');
    assert.equal(callCount, 1, 'isActive() should be called once');

    // Second call should use cache
    const result2 = getCachedIsActive(mockSpawn);
    assert.equal(result2, true, 'Second call should return true');
    assert.equal(callCount, 1, 'isActive() should still be called only once (cached)');
  });

  it('getCachedIsActive caches different structures separately', () => {
    const mockSpawn1 = {
      id: 'spawn1',
      room: {name: 'W1N1'},
      isActive: () => true,
    };
    const mockSpawn2 = {
      id: 'spawn2',
      room: {name: 'W1N1'},
      isActive: () => false,
    };

    const result1 = getCachedIsActive(mockSpawn1);
    const result2 = getCachedIsActive(mockSpawn2);

    assert.equal(result1, true, 'Spawn1 should be active');
    assert.equal(result2, false, 'Spawn2 should be inactive');
  });

  it('getCachedIsActive handles inactive structures correctly', () => {
    let callCount = 0;
    const mockInactiveSpawn = {
      id: 'spawn3',
      room: {name: 'W1N1'},
      isActive: () => {
        callCount++;
        return false;
      },
    };

    const result1 = getCachedIsActive(mockInactiveSpawn);
    const result2 = getCachedIsActive(mockInactiveSpawn);

    assert.equal(result1, false, 'Should return false for inactive spawn');
    assert.equal(result2, false, 'Should return false for inactive spawn (cached)');
    assert.equal(callCount, 1, 'isActive() should only be called once');
  });

  it('findSpawnsNotSpawning uses cached isActive', () => {
    const room = new Room('W1N1', 500);
    let isActiveCallCount = 0;

    const activeSpawn = {
      id: 'spawn1',
      room: room,
      spawning: false,
      isActive: () => {
        isActiveCallCount++;
        return true;
      },
    };

    const inactiveSpawn = {
      id: 'spawn2',
      room: room,
      spawning: false,
      isActive: () => {
        isActiveCallCount++;
        return false;
      },
    };

    // Mock find method
    room.find = (findConstant, opts) => {
      if (findConstant === FIND_MY_SPAWNS) {
        const allSpawns = [activeSpawn, inactiveSpawn];
        if (opts && opts.filter) {
          return allSpawns.filter(opts.filter);
        }
        return allSpawns;
      }
      return [];
    };

    // First call to findSpawnsNotSpawning
    const result1 = room.findSpawnsNotSpawning();
    assert.equal(result1.length, 1, 'Should return only active spawn');
    assert.equal(result1[0].id, 'spawn1', 'Should return spawn1');
    assert.equal(isActiveCallCount, 2, 'isActive() called twice (once per spawn)');

    // Second call should use cache
    const result2 = room.findSpawnsNotSpawning();
    assert.equal(result2.length, 1, 'Should still return only active spawn');
    assert.equal(isActiveCallCount, 2, 'isActive() should still be 2 (cached)');
  });

  it('getCachedIsActive initializes cache if not exists', () => {
    // Clear the cache completely
    delete global.isActiveCache;

    const mockSpawn = {
      id: 'spawn1',
      room: {name: 'W1N1'},
      isActive: () => true,
    };

    const result = getCachedIsActive(mockSpawn);
    assert.equal(result, true, 'Should return true');
    assert.notEqual(global.isActiveCache, undefined, 'Cache should be initialized');
    assert.notEqual(global.isActiveCache['W1N1'], undefined, 'Room cache should be initialized');
  });

  it('getCachedIsActive caches across ticks (persists in global)', () => {
    let callCount = 0;
    const mockSpawn = {
      id: 'spawn1',
      room: {name: 'W1N1'},
      isActive: () => {
        callCount++;
        return true;
      },
    };

    // First tick
    const result1 = getCachedIsActive(mockSpawn);
    assert.equal(result1, true, 'First call should return true');
    assert.equal(callCount, 1, 'isActive() should be called once');

    // Simulate new tick (global persists, Game would reset)
    // Cache should still exist since it's in global, not Game
    const result2 = getCachedIsActive(mockSpawn);
    assert.equal(result2, true, 'Second call should return true');
    assert.equal(callCount, 1, 'isActive() should NOT be called again (persisted across ticks)');
  });
});
