const testSetup = require('./test_setup');
const assert = require('assert');

describe('getEnergyFromStorage', () => {
  const {createRoom, createCreep} = testSetup;

  it('returns false when room has no storage', () => {
    const room = createRoom({hasStorage: false});
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when no storage exists');
  });

  it('returns false when room has misplacedSpawn flag and insufficient energy', () => {
    const spawnCost = CONSTRUCTION_COST[STRUCTURE_SPAWN]; // 15000
    const room = createRoom({misplacedSpawn: true, storageEnergy: spawnCost * 3}); // 45000, at threshold
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when misplacedSpawn and storage <= 3x spawn cost');
  });

  it('allows storage access when misplacedSpawn but sufficient energy', () => {
    const spawnCost = CONSTRUCTION_COST[STRUCTURE_SPAWN]; // 15000
    const room = createRoom({misplacedSpawn: true, storageEnergy: spawnCost * 3 + 1}); // 45001, above threshold
    const creep = createCreep({
      room: room,
      getRangeTo: () => 1,
    });

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, true, 'Should allow storage access when misplacedSpawn but storage > 3x spawn cost');
  });

  it('returns false when misplacedSpawn with sufficient energy but room inactive', () => {
    const spawnCost = CONSTRUCTION_COST[STRUCTURE_SPAWN];
    const room = createRoom({misplacedSpawn: true, storageEnergy: spawnCost * 4, active: false});
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when room is inactive even with sufficient energy');
  });

  it('returns false when room is struggling (low storage energy)', () => {
    const room = createRoom({storageEnergy: 1000});
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when storage energy is low');
  });

  it('returns false when room is struggling (inactive)', () => {
    const room = createRoom({active: false});
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when room is inactive');
  });

  it('returns false when room is struggling (storage not owned)', () => {
    const room = createRoom({storageMy: false});
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when storage is not owned');
  });

  it('returns false when room is struggling (low energy capacity)', () => {
    const room = createRoom({energyCapacityAvailable: 500});
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when energy capacity is low');
  });

  it('returns false when creep already has energy', () => {
    const room = createRoom();
    const creep = createCreep({room: room, energy: 50});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when creep has energy');
  });

  it('withdraws energy when adjacent to storage', () => {
    const room = createRoom();
    let withdrawCalled = false;
    let withdrawnFrom = null;
    let withdrawnResource = null;

    const creep = createCreep({
      room: room,
      getRangeTo: () => 1,
      withdraw: (structure, resource) => {
        withdrawCalled = true;
        withdrawnFrom = structure;
        withdrawnResource = resource;
        return OK;
      },
    });

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, true, 'Should return true when action taken');
    assert.equal(withdrawCalled, true, 'Should call withdraw');
    assert.equal(withdrawnFrom, room.storage, 'Should withdraw from storage');
    assert.equal(withdrawnResource, RESOURCE_ENERGY, 'Should withdraw energy');
  });

  it('moves toward storage when not adjacent', () => {
    const room = createRoom();
    let moveToMyCalled = false;
    let moveTarget = null;
    let moveRange = null;

    const creep = createCreep({
      room: room,
      getRangeTo: () => 5,
      moveToMy: (pos, range) => {
        moveToMyCalled = true;
        moveTarget = pos;
        moveRange = range;
        return OK;
      },
    });

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, true, 'Should return true when action taken');
    assert.equal(moveToMyCalled, true, 'Should call moveToMy');
    assert.equal(moveTarget, room.storage.pos, 'Should move toward storage');
    assert.equal(moveRange, 1, 'Should move to adjacent range');
  });

  it('does not withdraw when range is greater than 1', () => {
    const room = createRoom();
    let withdrawCalled = false;

    const creep = createCreep({
      room: room,
      getRangeTo: () => 2,
      withdraw: () => {
        withdrawCalled = true;
        return OK;
      },
    });

    Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(withdrawCalled, false, 'Should not call withdraw when not adjacent');
  });

  it('handles storage with exactly 2000 energy (threshold boundary)', () => {
    const room = createRoom({storageEnergy: 2000});
    const creep = createCreep({
      room: room,
      getRangeTo: () => 1,
    });

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, true, 'Should return true when storage has exactly 2000 energy');
  });

  it('handles storage with 1999 energy (just below threshold)', () => {
    const room = createRoom({storageEnergy: 1999});
    const creep = createCreep({room: room});

    const result = Creep.prototype.getEnergyFromStorage.call(creep);

    assert.equal(result, false, 'Should return false when storage has 1999 energy');
  });
});
