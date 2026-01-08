# Defense and Recovery System

This document describes how the TooAngel bot handles attacks, defends rooms, and recovers from spawn loss.

> **Code Location**: Primary logic in `src/prototype_room_my.js`

## Attack Detection

### Attack Timer (`attackTimer`)
- Location: `Memory.rooms[name].attackTimer`
- Increments each tick when hostile creeps are present
- Decrements by 5 each tick when no hostiles (min 0)
- `underSiege` flag clears when timer reaches 0
- Logged every 5 ticks when `attackTimer > config.myRoom.underAttackMinAttackTimer`

### Under Attack State
```javascript
Room.prototype.isUnderAttack = function() {
  return this.memory.attackTimer > config.myRoom.underAttackMinAttackTimer;
}
```

## Defense Mechanisms

### 1. Tower Defense
- Towers automatically attack hostile creeps
- Priority: hostile creeps > heal own creeps > repair structures
- Location: `Room.prototype.handleTower()` in `prototype_room_my.js`

### 2. Safe Mode Activation
- Triggered when `attackTimer > 100` and enemies present
- Also triggered during `isRampingUp()` state with hostiles
- Location: `Room.prototype.checkForSafeMode()`

### 3. Defender Spawning
When `attackTimer > 15`:
- Every 250 ticks, spawns a defender
- `attackTimer <= 300`: spawns `defendranged`
- `attackTimer > 300`: spawns `defendmelee`
- Defenders are spawned with `level: 1` and target the current room

```javascript
Room.prototype.spawnDefender = function() {
  if (this.memory.attackTimer > 15) {
    if (this.executeEveryTicks(250)) {
      const role = this.memory.attackTimer > 300 ? 'defendmelee' : 'defendranged';
      this.checkRoleToSpawn(role, 1, undefined, this.name, 1, this.name);
    }
  }
}
```

### 4. Reputation System
- Hostile creeps decrease attacker's reputation
- Damaged creeps track reputation changes
- Severe attacks trigger retaliatory behavior
- See [Diplomacy.md](Diplomacy.md) for details

## Recovery System

### Room States

#### `isStruggling()`
Returns true if any of:
- `isRampingUp()` is true
- `memory.active` is false
- Storage energy is low (`storage.isLow()`)

#### `isRampingUp()`
Returns true if room is in initial setup phase or has `misplacedSpawn` set.

#### `isHealthy()`
Returns true if:
- Not struggling
- Storage energy > `config.room.isHealthyStorageThreshold`

### Spawn Loss Recovery

When a room loses all spawns, the recovery process activates:

#### 1. Detection
```javascript
Room.prototype.handleReviveRoom = function(hostiles) {
  const spawns = this.findMySpawns();
  if (spawns.length === 0) {
    return this.reviveRoom();
  }
}
```

#### 2. Revival Process (`reviveRoom()`)
- Runs every `config.revive.nextroomerInterval` ticks
- Sets room to inactive state
- Calls `reviveMyNow()` to request help from other rooms

#### 3. Helper Room Selection (`reviveMyNow()`)
Helper rooms are selected based on:
- Not the same room
- Not struggling themselves
- Has spawn capacity (`config.room.nextroomerSpawnIdleThreshold`)
- Is healthy (unless controller almost downgrading)
- Within `config.nextRoom.maxDistance` linear distance
- Has valid route to the struggling room

#### 4. Help Sent
For each valid helper room:
- If hostiles present: spawns `defender` targeting the struggling room
- Always spawns `nextroomer` targeting the struggling room

```javascript
if (hostileCreep.length > 0) {
  helperRoom.checkRoleToSpawn('defender', 1, undefined, this.name);
}
helperRoom.checkRoleToSpawn('nextroomer', 1, undefined, this.name);
```

### Nextroomer Role

The `nextroomer` creep (from `role_nextroomer.js`):
1. Travels to target room
2. Builds spawn construction sites (priority)
3. Upgrades controller if needed (especially if `ticksToDowngrade < 1500`)
4. Handles `underSiege` situations:
   - Moves to source position
   - Builds towers and ramparts
   - Harvests energy and transfers to towers

Key behaviors:
- Prioritizes spawn construction when no spawns exist
- Dismantles blocking structures in path
- Falls back to defensive building when under siege

### Energy Support

Helper rooms also send energy via `carry` creeps:
```javascript
Room.prototype.handleReviveRoomSendCarry = function() {
  // Sends carry creeps from healthy rooms within 10 linear distance
  room.checkRoleToSpawn('carry', config.carryHelpers.maxHelpersAmount,
                        room.storage.id, room.name, undefined, this.name);
}
```

## Configuration

Key config values in `src/config.js`:
- `config.revive.nextroomerInterval` - How often to request nextroomers
- `config.revive.disabled` - Disable recovery system
- `config.room.nextroomerSpawnIdleThreshold` - Min spawn idle for helpers
- `config.nextRoom.maxDistance` - Max linear distance for help
- `config.carryHelpers.ticksUntilHelpCheck` - Interval for help checks
- `config.carryHelpers.maxHelpersAmount` - Max carry helpers to spawn
- `config.myRoom.underAttackMinAttackTimer` - Threshold for "under attack" state

## Flow Summary

```
Attack Detected
     ↓
attackTimer++ → spawnDefender (if >15)
     ↓                    ↓
checkForSafeMode    handleDefence
     ↓                    ↓
     ←←←←←←←←←←←←←←←←←←←←←
     ↓
handleReviveRoom (if struggling)
     ↓
spawns.length === 0?
     ↓ yes
reviveRoom()
     ↓
setRoomInactive()
     ↓
reviveMyNow() → for each helper room:
     ↓              spawn defender (if hostiles)
     ↓              spawn nextroomer
     ↓
handleReviveRoomSendCarry() → spawn carry helpers
```

## Limitations

1. **Defense timing**: Defenders only spawn every 250 ticks, which may be too slow against coordinated attacks
2. **No proactive defense**: No pre-emptive defender spawning based on threat detection
3. **Helper room requirements**: Helper must be healthy and have spawn capacity
4. **Distance limits**: Helpers must be within `maxDistance` linear rooms
5. **Single defender per interval**: Only one defender spawned per 250 ticks

## Related Files

| File | Key Functions | Purpose |
|------|---------------|---------|
| `src/prototype_room_my.js` | `handleAttack()` :316, `spawnDefender()` :339, `reviveRoom()` :727, `reviveMyNow()` :675 | Main defense and recovery |
| `src/role_nextroomer.js` | `settle()` :239, `underSiege()` :145 | Rebuild spawn, handle siege |
| `src/role_defendmelee.js` | `action()` | Melee defender behavior |
| `src/role_defendranged.js` | `action()` | Ranged defender behavior |
| `src/config.js` | `revive.*`, `myRoom.*` | Configuration values |

## Debugging Tips

When investigating defense issues:
1. Check `Memory.rooms[name].attackTimer` - how long has attack been going?
2. Check `Memory.rooms[name].queue` - are defenders queued?
3. Enable debug logging: `config.debug.revive = true`
4. Watch for "Under attack" console messages (logged every 5 ticks)
5. Check helper room `spawnIdle` values - are they available to help?
