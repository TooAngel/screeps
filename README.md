# TooAngel Artificial intelligence for screeps

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/7cdc61c18abf4b3b89ad6a2f12ca7990)](https://www.codacy.com/app/TooAngel/screeps?utm_source=github.com&utm_medium=referral&utm_content=TooAngel/screeps&utm_campaign=badger)
[![CircleCI](https://circleci.com/gh/TooAngel/screeps.svg?style=svg)](https://circleci.com/gh/TooAngel/screeps)
[![Code Climate](https://codeclimate.com/github/TooAngel/screeps/badges/gpa.svg)](https://codeclimate.com/github/TooAngel/screeps)
[![npm version](https://badge.fury.io/js/screeps-bot-tooangel.svg)](https://badge.fury.io/js/screeps-bot-tooangel)
[![slack](https://img.shields.io/badge/slack-17/17-green.svg)](https://screeps.slack.com/messages/tooangels/)
[![discord](https://www.worlddriven.org/static/images/Discord-Logo-Black.png)](https://discord.gg/RrGFHKb)

https://screeps.com/

See rendered version:
http://tooangel.github.io/screeps/

This repository is [World Driven](https://www.worlddriven.org). Pull Requests
are automatically merged and deployed to the
[Screeps TooAngel account](https://www.screeps.com).

## Quests

Head over to [Quests](doc/Quests.md)

## For in game room visitors:

Happy to see you visiting one of our rooms. [Visit FAQ to find answers](doc/FAQ.md)

## Info

This is the AI I'm using for screeps. I managed to reach Top 10
from November 2015 - March 2016. Main Goal is to automate everything, no
manual interaction needed.

The AI is deployable on a private screeps server, follow the information on
[Steam](http://steamcommunity.com/sharedfiles/filedetails/?id=800902233) or
`npm install screeps-bot-tooangel` and `bots.spawn('screeps-bot-tooangel', ROOMNAME)`

## Note

This is not a good example for code quality or structure, most LOCs written
while fighting or other occasions which needed quick fixes or in the ingame
editor (getting better :-)). But I think there are a couple of funny ideas.
Every contribution is welcome.

## Features

 - [Automatic Base building](doc/BaseBuilding.md)
 - External room harvesting
 - Basic mineral handling
 - Power harvesting
 - New rooms claiming on GCL level up
 - Automatic attack
 - Rebuild of fallen rooms
 - [Layout visualization](doc/Visualization.md)
 - [Manual commands](doc/Manual.md)
 - [Graphs](doc/Graphs.md)
 - [Testing](doc/Testing.md)

## Tweaking

Add a `src/friends.js` with player names to ignore them from all attack
considerations.

E.g.:
`module.exports = ['TooAngel'];`


Add a `src/config_local.js` to overwrite configuration values. Copy
`config_local.js.example` to `src/config_local.js` as an example. `src/config.js`
has the default values.

## Debugging

Within the `config_local.js` certain `config.debug` flags can be enabled.
To add debug messages `Room.debugLog(TYPE, MESSAGE)` and
`Creep.creepLog(MESSAGE)` are suggested. Especially the `creepLog` allows
granular output of the creep behavior based on the room and the creep role.

## Upload

install dependencies

    npm install

add your account credentials

### to screeps.com

To deploy to the live server provide the credentials.

#### via env

    export email=EMAIL
    export password=PASSWORD

#### via git ignored file

    echo "module.exports = { email: 'your-email@here.tld', password: 'your-secret' };" > account.screeps.com.js
 or edit and rename account.screeps.com.js.sample to account.screeps.com.js   

And deploy to the server:

    grunt

### to private server
Create a `.localSync.js` file with content:
```
module.exports = [{
  cwd: 'src',
  src: [
    '*.js'
  ],
  dest: '$HOME/.config/Screeps/scripts/SERVER/default',
}];
```

    grunt local


## Develop

    grunt dev

## Release

Releasing to npm is done automatically by increasing the version and merging to `master`.

    npm version 10.0.1
    git push --follow-tags

Every deploy to `master` is automatically deployed to the live tooangel account.

## Testing

`node utils/test.js` will start a private server and add some bots as test
cases. Within in the `tmp-test-server` directory the server can be easily
started via `screeps start`.

## Design

[More details of the AI design](doc/Design.md)
