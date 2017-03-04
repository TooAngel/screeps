# screeps-bot-tooangel

[![CircleCI](https://circleci.com/gh/TooAngel/screeps.svg?style=svg)](https://circleci.com/gh/TooAngel/screeps)
[![Code Climate](https://codeclimate.com/github/TooAngel/screeps/badges/gpa.svg)](https://codeclimate.com/github/TooAngel/screeps)
[![npm version](https://badge.fury.io/js/screeps-bot-tooangel.svg)](https://badge.fury.io/js/screeps-bot-tooangel)
[![gitter](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/screeps-bot-tooangel/Lobby)

https://screeps.com/

## For in game room visitors:

Happy to see you visiting one of my rooms. [Visit FAQ to find answers](doc/FAQ.md)

## Info

This is the AI I'm using for screeps. I managed to reach Top 10
from November 2015 - March 2016. Main Goal is to automate everything, no
manual interaction needed.

The AI is deployable on a private screeps server, follow the information on
[Steam](http://steamcommunity.com/sharedfiles/filedetails/?id=800902233).

## Note

This is not a good example for code quality or structure, most LOCs written
while fighting or other occasions which needed quick fixes or in the ingame
editor. But I think there are a couple of funny ideas. Every contribution is
welcome.

## Features

 - [Automatic Base building](doc/BaseBuilding.md)
 - External room harvesting
 - Basic mineral handling
 - Power harvesting
 - New rooms claiming on GCL level up
 - Automatic attack
 - Rebuild of fallen rooms

## Tweaking

Add a `src/friends.js` with player names to ignore them from all attack
considerations.

E.g.:
`module.exports = ['TooAngel'];`


Add a `src/config_local.js` to overwrite configuration values. Copy
`config_local.js.example` to `src/config_local.js` as an example. `src/config.js`
has the default values.

## Contributing

All kind of contribution is welcome, issues, contact via channels, pull requests.

Follow this link if you are planning to contribute via pull request.

[Contribution and Workflow](doc/Constribution-and-Workflow.md)

[Issues](https://github.com/TooAngel/screeps/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)
with label 'enhancement' exist, which are open for discussion
and implementation. The description will reflect the latest status of the
discussion and should end up in the documentation, when finishing the
implementation.

## Upload
### install dependencies

    npm install

### add your account credentials
#### via env
    export email=EMAIL
    export password=PASSWORD

#### via git ignored file
    echo "module.exports = { email: 'your-email@here.tld', password: 'your-secret' };" > account.screeps.com.js
 or edit and rename account.screeps.com.js.sample to account.screeps.com.js   

### create dist/build and upload to screeps
    grunt screeps


### to private server
Create a `.locaSync.js` file with content:
```
module.exports = [{
  cwd: 'src',
  src: [
    '*.js'
  ],
  dest: '$HOME/.config/Screeps/scripts/SERVER/default',
}
```
    `grunt local`


## Develop

    grunt jshint
    grunt jsbeautifier
    grunt jscs


## Design

[More details of the AI design](doc/Design.md)

## Alliance

If you are playing on the live server with the TooAngel AI you are welcome
to join the [The Angels](Alliance.md) Alliance. Ping one of the members, you
can recognize us, because our rooms look like yours.

## Manual Play

####Attacking a room with a single creep:

    Game.rooms.W81N49.memory.queue.push({role: 'autoattackmelee', routing: {targetRoom: 'W82N48'}})

Game.rooms.W81N49.memory.queue.push is where the creeps is build.

role: is the role the creep will be, you can change this to any available role.

targetRoom: is the creeps target room.

Soon you can also use

    startAutoSquad('roomFrom' , 'roomTo')

#### Sending a Reserver to reserve a rooms controller: (This will also trigger Remote Mining in the room)

    Game.rooms.W81N49.memory.queue.push({role: 'reserver', routing: {targetRoom: 'W82N48', targetId: '5873bc0e11e3e4361b4d6fc3'}})
targetId: Is in this case the ID of the controller in the target room.
#### Claiming the Controller (You need a nearby creep with Claim Part/s)
    Game.getObjectById('TheCreepsIdHere').claimController(Game.rooms.RoomNameHere.controller)
#### Assigning Text to the Controller (readable from Worldmap mouseover, you need a nearby creep)
    Game.getObjectById('TheCreepsIdHere').signController(Game.rooms.RoomNameHere.controller, "YourTextHere");

• Using the commands above you can also send sourcer, carry, defender etc. to certain rooms/targets.

Soon there will be Squad attacks the Commands for those are:
#### Send a Squad of 3 Healers and 3 Structurers (only attack structures,good for walls/ramparts)
    brain.startSquad('RoomFrom','RoomTo')
#### Send a Squad of 3 Healers and 1 MeleeAttacker (Attack everything)
    brain.startMeleeSquad('RoomFrom','RoomTo')
