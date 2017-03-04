# Manual Play

## Attacking a room with a single creep:

    Game.rooms.W81N49.memory.queue.push({role: 'autoattackmelee', routing: {targetRoom: 'W82N48'}})

`Game.rooms.W81N49.memory.queue.push` is where the creeps is build.
`role`: is the role the creep will be, you can change this to any available role.
`targetRoom`: is the creeps target room.

Soon you can also use (somotaw/master)

    startAutoSquad('roomFrom' , 'roomTo')

## Sending a Reserver to reserve a rooms controller: (This will also trigger Remote Mining in the room)

    Game.rooms.W81N49.memory.queue.push({role: 'reserver', routing: {targetRoom: 'W82N48', targetId: '5873bc0e11e3e4361b4d6fc3'}})

`targetId`: Is in this case the ID of the controller in the target room.

## Claiming the Controller (You need a nearby creep with Claim Part/s)

    Game.getObjectById('TheCreepsIdHere').claimController(Game.rooms.RoomNameHere.controller)

## Assigning Text to the Controller (readable from Worldmap mouseover, you need a nearby creep)

    Game.getObjectById('TheCreepsIdHere').signController(Game.rooms.RoomNameHere.controller, "YourTextHere");

• Using the commands above you can also send sourcer, carry, defender etc. to certain rooms/targets.

Soon there will be Squad attacks the Commands for those are: (somotaw/master)

## Send a Squad of 3 Healers and 3 Structurers (only attack structures, good for walls/ramparts)

    brain.startSquad('RoomFrom','RoomTo')

## Send a Squad of 3 Healers and 1 MeleeAttacker (Attack everything)

    brain.startMeleeSquad('RoomFrom','RoomTo')
