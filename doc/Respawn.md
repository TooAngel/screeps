# Respawn System

The bot has a fully automated respawn system that handles recovery when all
rooms are lost. It operates at two levels: an external respawner utility for
initial spawn placement, and in-game expansion logic for claiming new rooms.

## External Respawner (`utils/respawner.js`)

A standalone Node.js utility that runs outside the game to handle account
respawn when the bot has died completely.

### When It Runs

The respawner runs automatically as part of CI deployment (CircleCI). Every
time code is deployed to master, `npm run respawner` executes after
`npm run deploy`. It checks the account's world status and only acts if the
status is `"empty"` or `"lost"`.

### Flow

1. **Check world status** via `/api/user/world-status`
   - Only proceeds if status is `"empty"` or `"lost"`
   - Otherwise exits silently (normal operation)
2. **Call respawn API** (`POST /api/user/respawn`)
3. **Wait 185 seconds** (180s respawn cooldown + 5s buffer)
4. **Rank shards** by value: `rooms / users / (tick / 1000)`
   - Prefers shards with more available rooms, fewer players, faster ticks
5. **Find starter room** on best shard
   - Gets starter room centers via `/api/user/world-start-room`
   - Searches 6x6 grid around each center
   - Attempts `placeSpawn` at each coordinate until one succeeds
   - Spawn is placed at position (25, 25) named "Spawn1"
6. **Allocate CPU** - all available CPU goes to the spawn shard via
   `Game.cpu.setShardLimits()` executed through the console API

### Running Manually

```bash
cd ../bot
token=YOUR_SCREEPS_TOKEN npm run respawner
```

### CI Integration

In `.circleci/config.yml`, the deploy job runs:
```
npm run deploy
npm run respawner
```

This means every deployment also checks if respawn is needed, making recovery
fully automatic as long as code continues to be merged and deployed.

## In-Game Expansion (`src/brain_nextroom.js`)

Once the bot has at least one room, the in-game expansion system takes over.

### Entry Point

`brain.handleNextroomer()` is called every tick from `brain_main.js`.

### Expansion Conditions

Expansion is attempted every `CREEP_CLAIM_LIFE_TIME` ticks (~600) when:

1. `Memory.myRooms.length < Game.gcl.level` (haven't hit room cap)
2. System resources are sufficient (CPU, heap, memory per room)
3. Claimable rooms have been scouted

### Room Selection

Rooms are evaluated by:
- **Distance**: closer rooms preferred (weighted by `config.nextRoom.distanceFactor`)
- **Minerals**: rooms with minerals not already controlled are preferred
- **Minimum requirements**: at least 2 sources, not occupied or reserved by enemies

### Claiming Process

1. **Scout** creeps explore adjacent rooms (breadth-first search)
2. **Claimer** spawns and moves to target room, claims controller, suicides
3. **Nextroomer** spawns, moves to claimed room, builds initial spawn and structures

### Configuration

All settings in `src/config.js` under `config.nextRoom`:

| Setting | Default | Description |
|---------|---------|-------------|
| `intervalToCheck` | `CREEP_CLAIM_LIFE_TIME` | Ticks between expansion checks |
| `maxRooms` | 8 | Max rooms (simple resource mode) |
| `cpuPerRoom` | 13 | CPU threshold per room |
| `maxDistance` | 10 | Max room distance for claiming |
| `minNewRoomDistance` | 2 | Min distance between owned rooms |
| `resourceStats` | true | Use advanced resource tracking |
| `distanceFactor` | 2 | Distance weight in room scoring |

## Key Files

| File | Purpose |
|------|---------|
| `utils/respawner.js` | External respawn utility (API-based) |
| `src/brain_nextroom.js` | In-game expansion and room claiming |
| `src/brain_main.js` | Main loop, calls handleNextroomer() |
| `src/brain_trapped.js` | Detects when expansion is blocked |
| `src/role_claimer.js` | Claimer creep - claims controllers |
| `src/role_nextroomer.js` | Nextroomer creep - builds up new rooms |
| `src/config.js` | Configuration for nextRoom and trapped |
