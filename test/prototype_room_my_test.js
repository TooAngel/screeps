const {createRoom} = require('./test_setup');
const assert = require('assert');

/**
 * Helper to set room data on global.data.rooms
 * The room.data property is a getter that reads from global.data.rooms[roomName]
 * @param {object} room - The room object
 * @param {object} data - The data to set on the room
 */
function setRoomData(room, data) {
  if (!global.data) {
    global.data = {rooms: {}};
  }
  if (!global.data.rooms) {
    global.data.rooms = {};
  }
  global.data.rooms[room.name] = data;
}

describe('getUniversalAmount', () => {
  it('returns 2 when room has no storage', () => {
    const room = createRoom({hasStorage: false});
    room.controller.level = 4;
    assert.equal(room.getUniversalAmount(), 2);
  });

  it('returns 10 when storage is not owned', () => {
    const room = createRoom({storageMy: false, storageEnergy: 100000});
    room.controller.level = 4;
    assert.equal(room.getUniversalAmount(), 10);
  });

  it('returns 3 when RCL < 5 and storage is low', () => {
    const room = createRoom({storageEnergy: 1000}); // Below 2000 threshold
    room.controller.level = 4;
    assert.equal(room.getUniversalAmount(), 3);
  });

  it('returns 2 when RCL < 5 with misplacedSpawn and full storage', () => {
    const room = createRoom({
      misplacedSpawn: true,
      storageEnergy: 100000,
    });
    room.controller.level = 4;
    assert.equal(room.getUniversalAmount(), 2);
  });

  it('returns 1 when RCL < 5 without misplacedSpawn and non-low storage', () => {
    const room = createRoom({
      misplacedSpawn: false,
      storageEnergy: 100000,
    });
    room.controller.level = 4;
    setRoomData(room, {mySpawns: [{name: 'Spawn1'}]});
    room.executeEveryTicks = () => false;
    assert.equal(room.getUniversalAmount(), 1);
  });

  it('returns 1 for RCL 6 with single spawn', () => {
    const room = createRoom({storageEnergy: 100000});
    room.controller.level = 6;
    setRoomData(room, {mySpawns: [{name: 'Spawn1'}]});
    room.executeEveryTicks = () => false;
    assert.equal(room.getUniversalAmount(), 1);
  });

  it('returns 2 for RCL 7 with multiple spawns and non-low storage', () => {
    const room = createRoom({storageEnergy: 100000});
    room.controller.level = 7;
    setRoomData(room, {mySpawns: [{name: 'Spawn1'}, {name: 'Spawn2'}]});
    room.executeEveryTicks = () => false;
    assert.equal(room.getUniversalAmount(), 2);
  });

  it('returns 1 for RCL 7 with single spawn', () => {
    const room = createRoom({storageEnergy: 100000});
    room.controller.level = 7;
    setRoomData(room, {mySpawns: [{name: 'Spawn1'}]});
    room.executeEveryTicks = () => false;
    assert.equal(room.getUniversalAmount(), 1);
  });
});
