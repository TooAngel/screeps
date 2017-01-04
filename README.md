# screeps-bot-tooangel

[![CircleCI](https://circleci.com/gh/TooAngel/screeps.svg?style=svg)](https://circleci.com/gh/TooAngel/screeps)
[![npm version](https://badge.fury.io/js/screeps-bot-tooangel.svg)](https://badge.fury.io/js/screeps-bot-tooangel)
[![gitter](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/screeps-bot-tooangel/Lobby)

https://screeps.com/

## For in game room visitors:

Happy to see you visiting one of my rooms. [Visit FAQ to find answers](FAQ.md)

## Info

This is the AI I'm using for screeps. I managed to reach Top 10
from November 2015 - March 2016. Main Goal is to automate everything, no
manual interaction needed.

The AI can be deployed on a private screeps server, follow the information on
[Steam](http://steamcommunity.com/sharedfiles/filedetails/?id=800902233).

The AI automatically generated a layout for the room and builds the structures
for the current RCL. With a `scout` creep or observer external harvest rooms
are explored and used. If the number of rooms are less than the GCL a new room
is acquired and build up. Also fallen rooms will be survived and basically
defended. Some basic autoattacking is implemented. Minerals
are fetched from the extractor and transported to the terminal. Reactions
are basically implemented. Depending on a threshold minerals are sold on the
market.

## Note

This is not a good example for code quality or structure, many LOC are written
while fighting or other occasions which needed quick fixes or in the ingame
editor. But I think there are a couple of funny ideas. Every contribution is
welcome.

## Features

 - Automatic base building
 - External room harvesting
 - Basic mineral handling
 - Power harvesting
 - New rooms claiming on GCL level up
 - Automatic attack
 - Rebuild of fallen rooms

## Tweaking

A `src/friends.js` can be used to add players which are ignored (hopefully) in
and `FIND_HOSTILE` finds.

E.g.:
`module.exports = ['TooAngel'];`

In `src/config.js` multiple config variables are available for tweaking. Copy
`config_local.js.example` to `src/config_local.js` and use it to modify configs
for your own bot rather than directly modifying `src/config.js` defaults.

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

## Develop

    grunt jshint
    grunt jsbeautifier
    grunt jscs

## Design

### Room

#### Setup

Positions:
 - `upgrader` creep next to the `controller`
 - `storage` structure next to the `upgrader`
 - `filler` creep next to the `storage`
 - `pathStart` position next to the `storage`


From `pathStart` all (sources, controller, mineral, mid of each exit) paths
are calculated and saved. The longest path is used to place structures (spawn,
extension, lab, observer, terminal, tower) next to it. Next to `filler` a link,
tower and power_spawn is located. `Link`s are placed next to the sources and at
the paths to the exits. Layers of walls are placed at the exits, positions
within the precalculated paths are replaced by ramparts.

#### Logic

The number of structures are checked and if applicable new constructionSites
are places. Links are triggered to transfer energy to link near the storage.
Towers attack incoming creeps or heal my creeps. If no spawn is available
`nextroomer` from other rooms are called, to build up the room.

The basic creep is the `harvester` which can make sure, that enought energy
will be available to build the rest of the creeps. For this we check if
a `harvester` is within the room, otherwise spawn it. For the rest a priority
queue is used.


### Role

 - `upgrader` get energy from the storage, puts it into the controller.
 - `filler` get energy from a link and transfers it to the tower or storage.
 - `sourcer` get energy from source.
   - Controlled room: Transfers the energy to the link.
   - External room: Builds container, fills container, calls `carry` to get
   the energy.
 - `reserver` reservs an external controller and calls `sourcer`.
 - `carry` gets energy from the target container and fills structures and
 storage on the way back. If there is a creep in front the energy is transfered.
 - `scout` Breadth-first search based room exploring.
 - `harvester` moves on the harvester path, and transfers energy to free structures
   on the path. On low energy in storage, the `harvester` falls back to the
   start up phase without relying on anything (storage, links, other creeps).
 - `nextroomer` moves to target room and builds up that room.
 - `repairer` build walls and ramparts.


### Routing

The routing from `start` to `end` is first done on room level:

 - Find `Game.map.findRoute(start, end)` plus the start room added as first
   entry in the array. This is stored together with the `routePos` in memory
   of the creep.
 - Inside a single room:
   - First room (`routePos == 0`): Own rooms have a layout set with a path to
     each exit pre-calculated. The first part of the path name is `Start` and
     the second the room to move to.
   - Last room (`routePos == route.length -1`): the `targetId` is stored in the
     memory of the creep. So the first part of the path name is the previous
     room and the second part is the `targetId`.
   - Rooms on the path: The previous room is the first part of the path name,
     the next room is the second part of the path name.
   The path is cached in the memory of the room with a `created` attributes
   to allow invalidation.

## Alliance

If you manage to read this far it is likely that you started to test the AI, too.
So if you are playing on the live server with the TooAngel AI you are welcome
to join the [The Angels](Alliance.md) Alliance. Ping one of the members, you
can recognize us, because our rooms look like yours.
