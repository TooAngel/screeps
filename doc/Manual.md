# Manual Play

## Attacking a room with a single creep:

    Game.rooms.W81N49.memory.queue.push({role: 'autoattackmelee', routing: {targetRoom: 'W82N48'}})

`Game.rooms.W81N49.memory.queue.push` is where the creeps is build.
`role`: is the role the creep will be, you can change this to any available role.
`targetRoom`: is the creeps target room.

## Sending a Reserver to reserve a rooms controller: (This will also trigger Remote Mining in the room)

    Game.rooms.W81N49.memory.queue.push({role: 'reserver', routing: {targetRoom: 'W82N48', targetId: '5873bc0e11e3e4361b4d6fc3'}})

`targetId`: Is in this case the ID of the controller in the target room.

## Sending a Signer to leave a message on room's controller

Default one

    Memory.rooms.E19N7.queue.push({role:'signer', routing: {targetRoom:'E18N9', targetId:'5982ff1bb097071b4adc218c'}}) // config.info.signText will be used
    
Provide extra message
    
    Memory.rooms.E19N7.queue.push({role:'signer', routing: {targetRoom:'E18N9', targetId:'5982ff1bb097071b4adc218c'}, signText: 'I\'m going to claim this room, please stay away'})

## Claiming the Controller (You need a nearby creep with Claim Part/s)

    Game.getObjectById('TheCreepsIdHere').claimController(Game.rooms.RoomNameHere.controller)

## Assigning Text to the Controller (readable from Worldmap mouseover, you need a nearby creep)

    Game.getObjectById('TheCreepsIdHere').signController(Game.rooms.RoomNameHere.controller, "YourTextHere");

• Using the commands above you can also send sourcer, carry, defender etc. to certain rooms/targets.

Soon there will be Squad attacks the Commands for those are: (somotaw/master)
