const net = require('net');
const q = require('q');
const _ = require('lodash');
const lib = require('@screeps/launcher/lib/index');
const {ScreepsAPI} = require('screeps-api');

const cliPort = 21026;
const port = 21025;

const players = {
  // 'W1N7': {x: 43, y: 35},
  // 'W8N8': {x: 21, y: 28},
  // 'W8N1': {x: 33, y: 13},
  'W5N1': {x: 10, y: 9},
  // 'W8N3': {x: 14, y: 17},
};
const rooms = Object.keys(players);
const duration = 600;
const maxAttempts = 10;
const verbose = false;
const timer = {
  start: Date.now(),
  end: null,
};

const controllerRooms = {};
const status = {};
for (const room of rooms) {
  status[room] = {
    controller: null,
    creeps: 0,
    // creepsNames: [],
    progress: 0,
    level: 0,
  };
}

let mongoPrepared = false;

/**
 * sleep method
 *
 * Helper method to sleep for amount of seconds.
 * @param {number} seconds Amount of seconds to sleep
 * @return {object}
 */
function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * checks for controller progress and level
 *
 * @param {object} status
 * @return {boolean}
 */
function checkForStatus() {
  for (const key in status) {
    if (process.argv.length !== 2 || status[key].progress === 0 || status[key].level < 3) {
      console.log(`${key} has no progress ${JSON.stringify(status[key])}`);
      return false;
    }
  }
  return true;
}

/**
 * startServer method
 *
 * Starts the private server
 * @return {object}
 */
async function startServer() {
  const opts = {
    db: 'test-server/db.json',
    logdir: 'test-server/logs',
    modfile: 'test-server/mods.json',
    assetdir: 'test-server/assets',
    cli_host: '127.0.0.1',
    cli_port: cliPort,
    host: '127.0.0.1',
    port: port,
    password: 'tooangel',
    steam_api_key: process.env.STEAM_API_KEY,
  };

  return lib.start(opts, process.stdout);
}

/**
 * logs event
 *
 * @param {object} event
 */
const logConsole = function(event) {
  if (!event.data || !event.data.messages) {
    return;
  }

  if (event.data.messages.results.length > 0) {
    console.log('result', event.data.messages.results);
  }

  if (event.data.messages.log.length > 0) {
    for (let logIndex = 0; logIndex < event.data.messages.log.length; logIndex++) {
      console.log(event.data.messages.log[logIndex]);
    }
  }
};


const filter = {
  controller: (o) => {
    if (o && o.type) {
      return o.type === 'controller';
    }
    return false;
  },
  controllerById: (o, id) => {
    if (o && id) {
      return Object.keys(controllerRooms).indexOf(id) > -1;
    }
    return false;
  },
  creeps: (o) => {
    if (o && o.type) {
      return o.type === 'creep';
    }
    return false;
  },
};

const helpers = {
  initControllerID: function(event) {
    if (status[event.id].controller === null) {
      status[event.id].controller = _.filter(event.data.objects, filter.controller)[0];
      status[event.id].controller = status[event.id].controller._id;
      controllerRooms[status[event.id].controller] = event.id;
    }
  },
  updateCreeps: function(event) {
    const creeps = _.filter(event.data.objects, filter.creeps);
    if (_.size(creeps) > 0) {
      if (verbose) {
        console.log(event.data.gameTime, 'creeps', JSON.stringify(_.omit(creeps, ['meta', '$loki'])));
      }
      // status[event.id].creepsNames.push(_.map(creeps, 'name'));
      // status[event.id].creepsNames = _.uniq(_.flatten(status[event.id].creepsNames));
      status[event.id].creeps += _.size(creeps);
    }
  },
  updateController: function(event) {
    const controllers = _.pick(event.data.objects, Object.keys(controllerRooms));
    for (const controllerId of Object.keys(controllers)) {
      const controller = controllers[controllerId];
      const roomName = controllerRooms[controllerId];
      if (status[roomName] === undefined) {
        continue;
      }
      if (controller.progress >= 0) {
        status[roomName].progress = controller.progress;
      }
      if (controller.level >= 0) {
        status[roomName].level = controller.level;
      }
      if (verbose) {
        console.log(event.data.gameTime, 'controller', JSON.stringify(_.omit(controller, ['meta'])));
      }
    }
  },
};

/**
 * updates the stauts object
 *
 * @param {object} event
 */
const statusUpdater = (event) => {
  helpers.initControllerID(event);
  if (_.size(event.data.objects) > 0) {
    helpers.updateCreeps(event);
    helpers.updateController(event);
  }

  if (event.data.gameTime % 300 === 0) {
    if (verbose) {
      console.log(event.data.gameTime, 'action objects in room', _.size(event.data.objects));
      for (const key of Object.keys(status)) {
        console.log(event.data.gameTime, key, 'spawned creeps', status[key].creeps);
        console.log(event.data.gameTime, key, 'controller progress', status[key].progress, '& level', status[key].level);
      }
    }
    console.log(event.data.gameTime, 'status', JSON.stringify(status));
  }
};

/**
 * followLog method
 *
 * Connects to the api and reads and prints the console log, if messages
 * are available
 *
 * @return {undefined}
 */
async function followLog() {
  for (const room of rooms) {
    const api = new ScreepsAPI({
      email: room,
      password: 'tooangel',
      protocol: 'http',
      hostname: '127.0.0.1',
      port: port,
      path: '/',
    });

    await api.auth();

    api.socket.connect();
    api.socket.on('connected', ()=> {});
    api.socket.on('auth', (event)=> {});
    api.socket.subscribe('console', logConsole);
    api.socket.subscribe('room:' + room, statusUpdater);
  }
}

/**
 * spawns TooAngel Bot
 *
 * @param {string} line
 * @param {object} socket
 * @return {boolean}
 */
const spawnBots = async function(line, socket) {
  if (line.startsWith(`Screeps server v`)) {
    console.log(`> system.resetAllData()`);
    socket.write(`system.resetAllData()\r\n`);
    await sleep(5);
    console.log(`> system.pauseSimulation()`);
    socket.write(`system.pauseSimulation()\r\n`);
    await sleep(5);
    const tickDuration = 100;
    console.log(`> setTickRate(${tickDuration})`);
    socket.write(`setTickRate(${tickDuration})\r\n`);
    mongoPrepared = true;
    for (const room of rooms) {
      console.log('> Spawn bot ' + room + ' as TooAngel');
      socket.write(`bots.spawn('screeps-bot-tooangel', '${room}', {username: '${room}', cpu: 100, gcl: 1, x: ${players[room].x}, y: ${players[room].y}})\r\n`);
      await sleep(1);
    }
    return true;
  }
  return false;
};

/**
 * sets password for TooAngel user
 *
 * @param {string} line
 * @param {object} socket
 * @return {boolean}
 */
const setPassword = function(line, socket) {
  for (const room of rooms) {
    if (line.startsWith(`'User ${room} with bot AI "screeps-bot-tooangel" spawned in ${room}'`)) {
      console.log(`> Set password for ${room}`);
      /* eslint max-len: ["error", 1300] */
      socket.write(`storage.db.users.update({username: '${room}'}, {$set: {password: '70dbaf0462458b31ff9b3d184d06824d1de01f6ad59cae7b5b9c01a8b530875ac502c46985b63f0c147cf59936ac1be302edc532abc38236ab59efecb3ec7f64fad7e4544c1c5a5294a8f6f45204deeb009a31dd6e81e879cfb3b7e63f3d937f412734b1a3fa7bc04bf3634d6bc6503bb0068c3f6b44f3a84b5fa421690a7399799e3be95278381ae2ac158c27f31eef99db1f21e75d285802cda983cd8a73a8a85d03ba45dcc7eb2b2ada362887df10bf74cdcca47f911147fd0946fb5119c888f048000044072dcc29b1c428b40b805cadeee7b3afc1e9d9d546c2a878ff8df9fcf805a28cc8b6e4b78051f0adb33642f1097bf0a189f388860302df6173b8e7955a35b278655df2d7615b54da6c63dc501c7914d726bea325c2225f343dff0068ac42300661664ee5611eb623e1efa379f571d46ba6a0e13a9e3e9c5bb7a772b685258f768216a830c5e9af3685898d98a9935cca2ba5efb5e1e4a9f2745c53bff318bda3e376bcd06b06d87a55045a76a1982f6e3b9fb77d39c2ff5c09c76989d1c779655bc2acdf55879b68f6155d14c26bdca3af5c7fd6de9926dbc091da280e6f7e3d727fa68c89aa8ac25b5e50bd14bf2dbcd452975710ef4b8d61a81c8f6ef2d5584eacfcb1ab4202860320f03313d23076a3b3e085af5f0a9e010ddb0ad5af57ed0db459db0d29aa2bcbcd64588d4c54d0c5265bf82f31349d9456', salt: '7eeb813417828682419582da8f997dea3e848ce8293e68b2dbb2f334b1f8949f'}})\r\n`);
      return true;
    }
  }
  return false;
};

/**
 *
 * @param {string} line
 * @param {object} defer
 * @return {undefined}
 */
async function checkForSucces(line, defer) {
  let attempts = 0;
  if (mongoPrepared && line.startsWith(`'OK'`)) {
    console.log('> Start the simulation');
    for (attempts; attempts <= maxAttempts; attempts++) {
      await sleep(duration);
      if (checkForStatus()) {
        defer.resolve();
      } else {
        console.log('checkForStatus ' + attempts + ' passed and failed');
      }
    }
    defer.reject('No progress');
  }
}

/**
 * connectToCli method
 *
 * Connects via cli
 * - Spawn to bot
 * - Sets the password for the user
 * - triggers `followLog`
 * - Starts the simulation
 * - Waits
 * - Reads the controller data and checks controller progress
 * @return {object}
 */
async function connectToCli() {
  const defer = q.defer();
  const socket = net.connect(cliPort, '127.0.0.1');
  let ready = 0;

  socket.on('data', async (data) => {
    data = data.toString('utf8');
    const line = data.replace(/^< /, '').replace(/\n< /, '');
    if (await spawnBots(line, socket)) {
      return;
    }
    if (setPassword(line, socket)) {
      return;
    }

    let parsed;
    try {
      parsed = line.substring(26, 60);
    } catch (e) {
      console.log(e, line);
    }
    if (parsed.indexOf('ok: 1') > -1) {
      ready++;
      if (ready >= rooms.length) {
        console.log('> Listen to the log');
        followLog();
        await sleep(5);
        console.log(`> system.resumeSimulation()`);
        socket.write(`system.resumeSimulation()\r\n`);
      }
      return;
    }

    await checkForSucces(line, defer);
    console.log('socket.data:' + line);
  });

  socket.on('connect', () => {
    console.log('connected');
  });

  socket.on('error', (error) => {
    defer.reject(error);
  });

  return defer.promise;
}

/**
 * main method
 *
 * Start the server and connects via cli
 * @return {undefined}
 */
async function main() {
  await startServer();
  await sleep(5);
  try {
    await connectToCli();
    timer.end = Date.now();
    console.log('seconds elapsed ' + Math.floor((timer.end - timer.start) / 1000));
    console.log('status', JSON.stringify(status));
    console.log('Yeah');
    /* eslint no-process-exit: "off" */
    process.exit(0);
  } catch (e) {
    timer.end = Date.now();
    console.log('seconds elapsed ' + Math.floor((timer.end - timer.start) / 1000));
    console.log('status', JSON.stringify(status));
    console.log(e);
    console.log('!!! No progress on the controller !!!');
    /* eslint no-process-exit: "off" */
    process.exit(1);
  }
}
main();
