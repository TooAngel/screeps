'use strict';

const {debugLog} = require('./logging');


/**
 * meetsBasicTrappedCriteria
 *
 * Quick checks for basic trapped scenario qualification
 * @return {boolean}
 */
function meetsBasicTrappedCriteria() {
  return Game.gcl.level >= config.trapped.minimumGCL &&
         Memory.myRooms &&
         Memory.myRooms.length === 1;
}

/**
 * hasBeenStagnantLongEnough
 *
 * Tracks duration of single-room state and returns true when threshold exceeded
 * @return {boolean}
 */
function hasBeenStagnantLongEnough() {
  if (!Memory.trapped) {
    Memory.trapped = {};
  }

  if (!Memory.trapped.stagnantSince) {
    if (meetsBasicTrappedCriteria()) {
      Memory.trapped.stagnantSince = Game.time;
      debugLog('trapped', `Started tracking stagnation at tick ${Game.time}`);
    }
    return false;
  }

  const stagnationDuration = Game.time - Memory.trapped.stagnantSince;
  return stagnationDuration > config.trapped.stagnationThreshold;
}

/**
 * analyzeHostilePresence
 *
 * Analyzes adjacent rooms for hostile control that prevents expansion
 * @param {string} roomName - The trapped room name
 * @return {object} Analysis result with blocked exits and hostile rooms
 */
function analyzeHostilePresence(roomName) {
  const exits = Game.map.describeExits(roomName);
  const blockedExits = [];
  const hostileRooms = [];

  for (const [direction, exitRoomName] of Object.entries(exits)) {
    const exitData = global.data.rooms[exitRoomName];

    if (!exitData) {
      debugLog('trapped', `No data for exit room ${exitRoomName} - needs scouting`);
      continue;
    }

    // Enemy controlled room
    if (exitData.state === 'Controlled' && exitData.owner !== Memory.username) {
      blockedExits.push(direction);
      hostileRooms.push(exitRoomName);
      debugLog('trapped', `Exit ${direction} -> ${exitRoomName} is enemy controlled`);
    }

    // Hostile reserved with active defense
    if (exitData.state === 'HostileReserved' && exitData.hostileCreepCount > 0) {
      blockedExits.push(direction);
      hostileRooms.push(exitRoomName);
      debugLog('trapped', `Exit ${direction} -> ${exitRoomName} is hostile reserved with ${exitData.hostileCreepCount} hostiles`);
    }
  }

  const totalExits = Object.keys(exits).length;
  const isTrapped = blockedExits.length >= Math.max(1, totalExits - 1);

  return {
    isTrapped,
    blockedExits,
    hostileRooms,
    totalExits,
    blockedCount: blockedExits.length,
  };
}

/**
 * isBlockedByResources
 *
 * Checks if expansion is legitimately blocked by resource constraints
 * @return {boolean}
 */
function isBlockedByResources() {
  if (config.nextRoom.resourceStats && global.data.stats) {
    const cpuPerRoom = global.data.stats.cpuUsed / Memory.myRooms.length;
    const heapPerRoom = global.data.stats.heapUsed / Memory.myRooms.length;

    // If genuinely resource-constrained, not trapped
    const cpuConstrained = cpuPerRoom > global.data.stats.cpuIdle * 0.8;
    const heapConstrained = heapPerRoom > global.data.stats.heapFree * 0.8;

    if (cpuConstrained || heapConstrained) {
      debugLog('trapped', `Resource constrained - CPU: ${cpuConstrained}, Heap: ${heapConstrained}`);
      return true;
    }
  }

  // Check basic CPU limits
  const cpuLimited = (Memory.myRooms.length + 1) * config.nextRoom.cpuPerRoom >= Game.cpu.limit * 0.9;
  if (cpuLimited) {
    debugLog('trapped', `CPU limited - would need ${(Memory.myRooms.length + 1) * config.nextRoom.cpuPerRoom} vs limit ${Game.cpu.limit}`);
  }

  return cpuLimited;
}

/**
 * logTrappedStatus
 *
 * Regular logging of trapped status for log recognition
 */
function logTrappedStatus() {
  if (!Memory.trapped || !Memory.trapped.isTrapped) {
    return;
  }

  if (Game.time % config.trapped.logInterval === 0) {
    const duration = Game.time - Memory.trapped.detectedAt;
    const daysSince = Math.floor(duration / 50000 * 7);
    const hoursSince = Math.floor(duration / 50000 * 24 * 7);

    console.log(`🚨 TRAPPED STATE ACTIVE - Day ${daysSince}, Hour ${hoursSince}`);
    console.log(`   Room: ${Memory.myRooms[0]}, GCL: ${Game.gcl.level}`);
    console.log(`   Hostile exits: ${(Memory.trapped.blockedExits || []).length || 0}/${Memory.trapped.totalExits || 0}`);
    console.log(`   Hostile rooms: ${JSON.stringify(Memory.trapped.hostileRooms || [])}`);
    console.log(`   Since: ${Memory.trapped.detectedAt}, Duration: ${duration} ticks`);
  }
}

/**
 * clearTrappedState
 *
 * Clears trapped state when conditions no longer apply
 */
function clearTrappedState() {
  if (Memory.trapped) {
    if (Memory.trapped.isTrapped) {
      console.log(`✅ TRAPPED STATE CLEARED - Expansion successful or conditions changed`);
      console.log(`   Duration trapped: ${Game.time - Memory.trapped.detectedAt} ticks`);
    }

    debugLog('trapped', 'Clearing trapped state - conditions no longer met');
    delete Memory.trapped;

    // Clear global data flag
    if (global.data) {
      global.data.isTrapped = false;
    }
  }
}

/**
 * setTrappedState
 *
 * Sets the trapped state and logs detection
 * @param {string} roomName - The trapped room name
 * @param {object} analysis - The hostile presence analysis result
 */
function setTrappedState(roomName, analysis) {
  // Set trapped state
  Memory.trapped = {
    ...Memory.trapped,
    isTrapped: true,
    detectedAt: Game.time,
    roomName: roomName,
    blockedExits: analysis.blockedExits,
    hostileRooms: analysis.hostileRooms,
    totalExits: analysis.totalExits,
    analysis: analysis,
  };

  // Set global data flag for other systems to use
  if (!global.data) {
    global.data = {};
  }
  global.data.isTrapped = true;

  console.log(`🚨 TRAPPED SCENARIO DETECTED!`);
  console.log(`   Room: ${roomName}, GCL: ${Game.gcl.level}`);
  console.log(`   Stagnant since: ${Memory.trapped.stagnantSince} (${Game.time - Memory.trapped.stagnantSince} ticks)`);
  console.log(`   Blocked exits: ${analysis.blockedCount}/${analysis.totalExits}`);
  console.log(`   Hostile rooms: ${JSON.stringify(analysis.hostileRooms)}`);
}

/**
 * detectTrappedScenario
 *
 * Main detection function - checks for trapped scenario and updates state
 * @return {boolean} True if trapped state is active
 */
function detectTrappedScenario() {
  if (!config.trapped.enabled) {
    return false;
  }

  // Clear state if no longer meets basic criteria
  if (!meetsBasicTrappedCriteria()) {
    if (Memory.trapped) {
      clearTrappedState();
    }
    return false;
  }

  // If already detected as trapped, just log status
  if (Memory.trapped && Memory.trapped.isTrapped) {
    logTrappedStatus();
    return true;
  }

  // Check if we've been stagnant long enough
  if (!hasBeenStagnantLongEnough()) {
    return false;
  }

  // Only run expensive analysis every checkInterval ticks
  if (Game.time % config.trapped.checkInterval !== 0) {
    return false;
  }

  debugLog('trapped', `Running trapped analysis at tick ${Game.time}`);

  // Check if blocked by legitimate resource constraints
  if (isBlockedByResources()) {
    debugLog('trapped', 'Not trapped - blocked by resource constraints');
    return false;
  }

  // Analyze hostile presence around the trapped room
  const roomName = Memory.myRooms[0];
  const analysis = analyzeHostilePresence(roomName);

  if (analysis.isTrapped) {
    setTrappedState(roomName, analysis);
    return true;
  }

  debugLog('trapped', `Not trapped - ${analysis.blockedCount}/${analysis.totalExits} exits blocked (need ${Math.max(1, analysis.totalExits - 1)})`);
  return false;
}

module.exports = {
  detectTrappedScenario,
  isTrapped: () => Memory.trapped || Memory.trapped.isTrapped || false,
  getTrappedData: () => Memory.trapped || null,
};
