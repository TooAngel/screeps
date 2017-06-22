# TooAngel Artificial intelligence for screeps

[![CircleCI](https://circleci.com/gh/TooAngel/screeps.svg?style=svg)](https://circleci.com/gh/TooAngel/screeps)
[![Code Climate](https://codeclimate.com/github/TooAngel/screeps/badges/gpa.svg)](https://codeclimate.com/github/TooAngel/screeps)
[![npm version](https://badge.fury.io/js/screeps-bot-tooangel.svg)](https://badge.fury.io/js/screeps-bot-tooangel)
[![gitter](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/screeps-bot-tooangel/Lobby)

https://screeps.com/

## For in game room visitors:

Happy to see you visiting one of our rooms. [Visit FAQ to find answers](doc/FAQ.md)

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
 - [Layout visualization](doc/Visualization.md)
 - [Manual commands](doc/Manual.md)
 - [Alliance](doc/Alliance.md)

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

    grunt screeps

### to private server
Create a `.localSync.js` file with content:
```
module.exports = [{
  cwd: 'src',
  src: [
    '*.js'
  ],
  dest: '$HOME/.config/Screeps/scripts/SERVER/default',
}
```

    grunt local


## Develop

    grunt jshint
    grunt jsbeautifier
    grunt jscs

## Release

Releasing to npm is done automatically by increasing the version and merging to `master`.

    npm version 10.0.1
    git push --follow-tags

Every deploy to `master` is automatically deployed to the live tooangel account.

## Design

[More details of the AI design](doc/Design.md)
