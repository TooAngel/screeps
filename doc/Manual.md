# Manual Commands

The TooAngel bot provides various manual commands for administrative control and debugging. These commands are useful for testing specific behaviors, emergency interventions, or overriding automated decisions.

## Combat Operations

### Attacking a room with a single creep:

```javascript
Game.rooms.W81N49.memory.queue.push({
    role: 'autoattackmelee',
    routing: {targetRoom: 'W82N48'}
})
```

**Usage Notes:**
- `Game.rooms.W81N49.memory.queue.push` - Queues creep spawning in the specified room
- `role` - Specifies the creep role (can be any available role from the bot's role system)
- `targetRoom` - Destination room for the creep's mission
- Use this for targeted attacks or testing combat scenarios

## Territory Management

### Reserve a room's controller:

```javascript
Game.rooms.W81N49.memory.queue.push({
    role: 'reserver',
    routing: {
        targetRoom: 'W82N48',
        targetId: '5873bc0e11e3e4361b4d6fc3'
    }
})
```

**Usage Notes:**
- `targetId` - The controller ID in the target room
- This automatically triggers remote mining operations in the reserved room
- Essential for expanding resource collection beyond controlled rooms

## Controller Signing

### Sign controller with default message:

```javascript
Memory.rooms.E19N7.queue.push({
    role: 'signer',
    routing: {
        targetRoom: 'E18N9',
        targetId: '5982ff1bb097071b4adc218c'
    }
})
```

### Sign controller with custom message:

```javascript
Memory.rooms.E19N7.queue.push({
    role: 'signer',
    routing: {
        targetRoom: 'E18N9',
        targetId: '5982ff1bb097071b4adc218c'
    },
    signText: 'Custom message here'
})
```

**Usage Notes:**
- Default uses `config.info.signText` from configuration
- Custom messages useful for diplomacy or territorial claims
- Signs are visible on world map when hovering over controllers

## Direct Controller Operations

### Claim a controller:

```javascript
Game.getObjectById('CreepId').claimController(Game.rooms.RoomName.controller)
```

### Sign a controller directly:

```javascript
Game.getObjectById('CreepId').signController(
    Game.rooms.RoomName.controller,
    "Your message here"
)
```

**Requirements:**
- Creep must be adjacent to the controller
- Claiming requires creep with CLAIM body parts
- Signing can be done by any creep

## General Usage

**Role Flexibility:**
You can use the queue system to send any available creep role to specific targets:
- `sourcer` - Energy harvesting operations
- `carry` - Resource transportation
- `defender` - Defensive operations
- `builder` - Construction tasks
- `repairer` - Maintenance operations

**Future Features:**
Squad-based attacks and coordinated operations are planned for future releases.
