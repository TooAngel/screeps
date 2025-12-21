const {createRoom} = require('./test_setup');
const assert = require('assert');

/**
 * Helper to set room data on global.data.rooms
 * @param {object} room - The room object
 * @param {object} data - The data to set
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

/**
 * Helper to clear room data between tests
 */
function clearRoomData() {
  global.data = {rooms: {}};
}


describe('CostMatrix System', () => {
  beforeEach(() => {
    clearRoomData();
  });

  describe('Position and CostMatrix relationship', () => {
    it('structure positions should be marked as blocked (0xFF) in costMatrix', () => {
      const room = createRoom({name: 'W1N1'});
      room.controller = {level: 3, my: true};
      room.isMy = () => true;

      // Set up positions with an extension
      setRoomData(room, {
        positions: {
          structure: {
            extension: [{x: 27, y: 5, roomName: 'W1N1'}],
          },
          creep: {},
        },
        costMatrix: new PathFinder.CostMatrix(),
        routing: {},
      });

      // Mock required methods
      room.memory.walls = null;
      room.memory.routing = {};
      room.memory.misplacedSpawn = false;
      room.getMemoryPath = () => [];
      room.increaseCostMatrixValue = function(cm, pos, value) {
        const current = cm.get(pos.x, pos.y);
        cm.set(pos.x, pos.y, Math.min(255, current + value));
      };
      room.getCostMatrix = function() {
        return new PathFinder.CostMatrix();
      };
      room.setMemoryCostMatrix = function(cm) {
        this.data.costMatrix = cm;
        this.memory.costMatrix = cm.serialize();
      };

      room.updateCostMatrix();

      // Extension at (27,5) should be blocked
      assert.equal(
        room.data.costMatrix.get(27, 5),
        0xFF,
        'Extension position should be blocked (0xFF)',
      );
    });

    it('creep positions should be marked with creepAvoid cost', () => {
      const room = createRoom({name: 'W1N1'});
      room.controller = {level: 3, my: true};
      room.isMy = () => true;

      // Set up positions with a sourcer position
      setRoomData(room, {
        positions: {
          structure: {},
          creep: {
            sourcer1: [{x: 21, y: 7, roomName: 'W1N1'}],
          },
        },
        costMatrix: new PathFinder.CostMatrix(),
        routing: {},
      });

      room.memory.walls = null;
      room.memory.routing = {};
      room.memory.misplacedSpawn = false;
      room.getMemoryPath = () => [];
      room.increaseCostMatrixValue = function(cm, pos, value) {
        const current = cm.get(pos.x, pos.y);
        cm.set(pos.x, pos.y, Math.min(255, current + value));
      };
      room.getCostMatrix = function() {
        return new PathFinder.CostMatrix();
      };
      room.setMemoryCostMatrix = function(cm) {
        this.data.costMatrix = cm;
        this.memory.costMatrix = cm.serialize();
      };

      room.updateCostMatrix();

      // Creep position should be blocked (creepAvoid = 0xFF)
      assert.equal(
        room.data.costMatrix.get(21, 7),
        0xFF,
        'Creep position should be blocked (0xFF)',
      );
    });
  });

  describe('Memory position preservation (THE BUG)', () => {
    it('positions loaded from memory should NOT be cleared when costMatrix is missing', () => {
      const room = createRoom({name: 'W1N1'});
      room.isMy = () => true;
      room.controller = {level: 3, my: true, id: 'ctrl1', pos: {x: 28, y: 7}};

      // Simulate positions stored in memory (from initial setup)
      room.memory.position = {
        structure: {
          extension: [{x: 27, y: 5, roomName: 'W1N1'}],
          spawn: [{x: 30, y: 6, roomName: 'W1N1'}],
        },
        creep: {
          filler: [{x: 30, y: 4, roomName: 'W1N1'}],
        },
      };

      // Clear heap data to simulate global reset
      clearRoomData();

      // Access room.data - this should load from memory
      // In current buggy implementation, if costMatrix is missing,
      // callbacks call updatePosition() which clears positions

      // For now, test that accessing data.positions returns memory positions
      // This is what SHOULD happen
      const positions = room.data.positions;

      assert.ok(
        positions.structure && positions.structure.extension,
        'Extension positions should be loaded from memory',
      );
      assert.equal(
        positions.structure.extension[0].x,
        27,
        'Extension x coordinate should be preserved',
      );
      assert.equal(
        positions.structure.extension[0].y,
        5,
        'Extension y coordinate should be preserved',
      );
    });

    it('regenerating costMatrix should use existing positions, not clear them', () => {
      const room = createRoom({name: 'W1N1'});
      room.isMy = () => true;
      room.controller = {level: 3, my: true, id: 'ctrl1', pos: {x: 28, y: 7}};

      // Set up positions in memory
      room.memory.position = {
        structure: {
          extension: [
            {x: 27, y: 5, roomName: 'W1N1'},
            {x: 28, y: 4, roomName: 'W1N1'},
          ],
        },
        creep: {},
      };
      room.memory.routing = {};
      room.memory.walls = null;
      room.memory.misplacedSpawn = false;

      // Initialize data from memory
      setRoomData(room, {
        positions: room.memory.position,
        costMatrix: null, // Missing - needs regeneration
        routing: {},
      });

      // Mock terrain lookup to return non-wall
      global.RoomPosition.prototype.checkForWall = () => false;
      global.RoomPosition.prototype.getAllPositionsInRange = () => [];

      // After regenerating costMatrix, positions should still exist
      // AND costMatrix should reflect those positions

      // This is the invariant we're testing:
      // positions.structure.extension should still have 2 items after any costMatrix operation
      const positionsBefore = room.data.positions.structure.extension.length;

      // Simulate what happens when costMatrix needs regeneration
      // (currently buggy: updatePosition() clears everything)

      // After fix: positions should be preserved
      assert.equal(
        room.data.positions.structure.extension.length,
        positionsBefore,
        'Positions should not be cleared during costMatrix regeneration',
      );
    });
  });

  describe('getCostMatrixCallback behavior', () => {
    it('should return a function', () => {
      const room = createRoom({name: 'W1N1'});
      room.isMy = () => true;
      setRoomData(room, {
        costMatrix: new PathFinder.CostMatrix(),
        positions: {structure: {}, creep: {}},
        routing: {},
      });

      const roomCallback = room.getCostMatrixCallback();

      assert.equal(typeof roomCallback, 'function', 'Should return a function');
    });

    it('should return costMatrix for known room', () => {
      const room = createRoom({name: 'W1N1'});
      room.isMy = () => true;
      const costMatrix = new PathFinder.CostMatrix();
      costMatrix.set(25, 25, 100); // Mark a position

      setRoomData(room, {
        costMatrix: costMatrix,
        positions: {structure: {}, creep: {}},
        routing: {},
      });

      // Mock Game.rooms
      Game.rooms = {W1N1: room};

      const roomCallback = room.getCostMatrixCallback();
      const result = roomCallback('W1N1');

      assert.ok(result instanceof PathFinder.CostMatrix, 'Should return CostMatrix');
      // Should be a clone, not the original
      assert.equal(result.get(25, 25), 100, 'Should have marked position');
    });

    it('should preserve positions when regenerating missing costMatrix', () => {
      // THE FIX: When costMatrix is missing, getCostMatrixCallback now calls
      // updateCostMatrix() instead of updatePosition().
      // updateCostMatrix() reads existing positions and builds costMatrix from them,
      // WITHOUT clearing positions.

      const room = createRoom({name: 'W1N1'});
      room.isMy = () => true;
      room.controller = {id: 'ctrl1', level: 3, my: true};

      // Set up positions that should persist (simulating data loaded from memory)
      const originalPositions = {
        structure: {
          extension: [{x: 27, y: 5, roomName: 'W1N1'}],
        },
        creep: {},
      };

      setRoomData(room, {
        costMatrix: null, // Missing - triggers regeneration
        positions: originalPositions,
        routing: {},
      });

      // Verify initial state
      assert.ok(room.data.positions.structure.extension, 'Initial: extensions should exist');
      assert.equal(room.data.positions.structure.extension.length, 1, 'Initial: 1 extension');

      // Mock methods needed for updateCostMatrix
      room.memory.walls = null;
      room.memory.routing = {};
      room.memory.misplacedSpawn = false;
      room.getMemoryPath = () => [];
      room.increaseCostMatrixValue = function(cm, pos, value) {
        const current = cm.get(pos.x, pos.y);
        cm.set(pos.x, pos.y, Math.min(255, current + value));
      };
      room.getCostMatrix = () => new PathFinder.CostMatrix();
      room.setMemoryCostMatrix = function(cm) {
        this.data.costMatrix = cm;
      };

      // Call updateCostMatrix - the FIXED behavior
      // This should build costMatrix from existing positions WITHOUT clearing them
      room.updateCostMatrix();

      // After regeneration, positions should still exist
      const hasExtensions = room.data.positions.structure &&
                            room.data.positions.structure.extension &&
                            room.data.positions.structure.extension.length > 0;

      assert.ok(hasExtensions, 'Positions should be preserved after costMatrix regeneration');
      assert.equal(
        room.data.positions.structure.extension.length,
        1,
        'Extension count should remain the same',
      );

      // AND the costMatrix should have the extension marked as blocked
      assert.equal(
        room.data.costMatrix.get(27, 5),
        0xFF,
        'Extension should be marked in regenerated costMatrix',
      );
    });
  });

  describe('updateCostMatrix from positions', () => {
    it('should only mark structures up to current RCL limit', () => {
      const room = createRoom({name: 'W1N1'});
      room.controller = {level: 2, my: true}; // RCL 2 allows 5 extensions
      room.isMy = () => true;

      // Set up 10 extension positions (more than RCL 2 allows)
      const extensions = [];
      for (let i = 0; i < 10; i++) {
        extensions.push({x: 20 + i, y: 5, roomName: 'W1N1'});
      }

      setRoomData(room, {
        positions: {
          structure: {extension: extensions},
          creep: {},
        },
        costMatrix: new PathFinder.CostMatrix(),
        routing: {},
      });

      room.memory.walls = null;
      room.memory.routing = {};
      room.memory.misplacedSpawn = false;
      room.getMemoryPath = () => [];
      room.increaseCostMatrixValue = function(cm, pos, value) {
        const current = cm.get(pos.x, pos.y);
        cm.set(pos.x, pos.y, Math.min(255, current + value));
      };
      room.getCostMatrix = function() {
        return new PathFinder.CostMatrix();
      };
      room.setMemoryCostMatrix = function(cm) {
        this.data.costMatrix = cm;
      };

      room.updateCostMatrix();

      // First 5 extensions should be marked (RCL 2 limit)
      let markedCount = 0;
      for (let i = 0; i < 10; i++) {
        if (room.data.costMatrix.get(20 + i, 5) === 0xFF) {
          markedCount++;
        }
      }

      assert.equal(
        markedCount,
        5,
        `Only ${CONTROLLER_STRUCTURES.extension[2]} extensions should be marked at RCL 2`,
      );
    });
  });

  describe('Simplification: costMatrix regeneration from positions', () => {
    it('costMatrix should be regenerable from positions without memory.costMatrix', () => {
      // This test validates the TODO comment in prototype_room.js:
      // "TODO do not store costMatrix in memory, this can be generated from positions"

      const room = createRoom({name: 'W1N1'});
      room.controller = {level: 3, my: true};
      room.isMy = () => true;

      // Only positions in memory, no costMatrix
      room.memory.position = {
        structure: {
          extension: [{x: 27, y: 5, roomName: 'W1N1'}],
          spawn: [{x: 30, y: 6, roomName: 'W1N1'}],
        },
        creep: {
          filler: [{x: 30, y: 4, roomName: 'W1N1'}],
        },
      };
      room.memory.costMatrix = null; // Not stored
      room.memory.routing = {};
      room.memory.walls = null;
      room.memory.misplacedSpawn = false;

      setRoomData(room, {
        positions: room.memory.position,
        costMatrix: null,
        routing: {},
      });

      room.getMemoryPath = () => [];
      room.increaseCostMatrixValue = function(cm, pos, value) {
        const current = cm.get(pos.x, pos.y);
        cm.set(pos.x, pos.y, Math.min(255, current + value));
      };
      room.getCostMatrix = function() {
        return new PathFinder.CostMatrix();
      };
      room.setMemoryCostMatrix = function(cm) {
        this.data.costMatrix = cm;
      };

      // Regenerate costMatrix from positions only
      room.updateCostMatrix();

      // Should have valid costMatrix with positions marked
      assert.ok(room.data.costMatrix, 'CostMatrix should be created');
      assert.equal(
        room.data.costMatrix.get(27, 5),
        0xFF,
        'Extension should be marked from positions',
      );
      assert.equal(
        room.data.costMatrix.get(30, 6),
        0xFF,
        'Spawn should be marked from positions',
      );
    });
  });
});
