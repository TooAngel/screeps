# Code base

## Requirements

- Node.js 24 (see `.nvmrc`). Node 26 is not supported yet, `isolated-vm`
  (used by the screeps server) does not build against it.
- Build tools for the native modules (`isolated-vm`, screeps driver):
  `python3`, `make` and `g++` (Debian/Ubuntu: `apt install python3 build-essential`)
- Docker or Podman with compose support for the test server (MongoDB, Redis)

If the system Node.js has a different version, use a version manager which
reads `.nvmrc`, e.g. [fnm](https://github.com/Schniz/fnm):

```bash
curl -fsSL https://fnm.vercel.app/install | bash
fnm install   # installs the version from .nvmrc
fnm use
npm install
```

npm only runs install scripts of packages listed in `allowScripts` in
`package.json`. When a dependency with install scripts is added or its git
source changes, review it with `npm install-scripts ls` and approve it with
`npm install-scripts approve <pkg>`.

## Developing on test server

To setup a test server with multiple bots. This will prepare the server and start everyting in a docker compose environment and can be stopped with CTRL-C

- `npm run setupTestServer`

It can be resumed via

`docker compose up`

### Podman

The compose files also work with Podman (`apt install podman podman-compose`):

- `CONTAINER_ENGINE=podman npm run setupTestServer`
- `podman compose up` to resume

With rootless Podman the MongoDB data in `tmp-test-server-database/` is owned
by a mapped user id, remove it with `podman unshare rm -rf tmp-test-server-database`.

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

    npm run deploy

To the season server, with `token` in the environment or in
`account.screeps.com.js`:

    node utils/deploy.js season

### to private server

See [Developing on test server](#developing-on-test-server): `npm run deployLocal`.

## Release

Releasing to npm is done automatically by increasing the version and merging to `master`.

Every deploy to `master` is automatically deployed to the live tooangel account.
