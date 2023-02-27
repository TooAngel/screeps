# Code base

## Developing on test server

To setup a test server with multiple bots. This will prepare the server and start everyting in a docker compose environment and can be stopped with CTRL-C

- `npm run setupTestServer`

It can be resumed via

`docker compose up`

To deploy create a `.screeps.yaml`:
```
servers:
  main:
    host: 127.0.0.1
    port: 21025
    secure: false
    username: 'W8N8'
    password: 'tooangel'
```

and run `npm run deployLocal`.


## Tweaking

### Config
Add a `src/config_local.js` to overwrite configuration values. Copy
`config_local.js.example` to `src/config_local.js` as an example. `src/config.js`
has the default values.

### Friends
Add a `src/friends.js` with player names to ignore them from all attack considerations.

E.g.:
`module.exports = ['TooAngel'];`


## Interacting

the `src/utils.js` provides methods to interact with the NPC.

## Debugging

Within the `config_local.js` certain `config.debug` flags can be enabled.
To add debug messages `Room.debugLog(TYPE, MESSAGE)` and
`Creep.creepLog(MESSAGE)` are suggested. Especially the `creepLog` allows
granular output of the creep behavior based on the room and the creep role.

## Testing

`node utils/test.js` will start a private server and add some bots as test cases.

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

## Release

Releasing to npm is done automatically by increasing the version and merging to `master`.

Every deploy to `master` is automatically deployed to the live tooangel account.
