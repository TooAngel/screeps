const net = require('net');
const q = require('q');
const lib = require('@screeps/launcher/lib/index');
const {ScreepsAPI} = require('screeps-api');

const cliPort = 21026;
const port = 21025;

const duration = 3600;

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
    password: undefined,
    steam_api_key: undefined,
  };

  return lib.start(opts, process.stdout);
}

/**
 * followLog method
 *
 * Connects to the api and reads and prints the console log, if messages
 * are available
 */
async function followLog() {
  const api = new ScreepsAPI({
    email: 'TooAngel',
    password: 'tooangel',
    protocol: 'http',
    hostname: '127.0.0.1',
    port: port,
    path: '/',
  });

  await api.auth();

  api.socket.connect();
  api.socket.on('connected', ()=>{});
  api.socket.on('auth', (event)=>{});

  api.socket.subscribe('console', (event)=>{
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
  });
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
 * return {object}
 */
async function connectToCli() {
  const defer = q.defer();

  const socket = net.connect(cliPort, '127.0.0.1');

  socket.on('data', async (data) => {
    data = data.toString('utf8');
    const line = data.replace(/^< /, '').replace(/\n< /, '');

    if (line.startsWith(`Screeps server v`)) {
      console.log('Spawn bot W1N7 as TooAngel');
      socket.write('bots.spawn(\'screeps-bot-tooangel\', \'W1N7\', {username: \'TooAngel\', cpu: 100, gcl: 1, x: 43, y: 35})\r\n');
      return;
    }

    if (line.startsWith(`'User TooAngel with bot AI "screeps-bot-tooangel" spawned in W1N7'`)) {
      console.log('Set password for TooAngel');
      socket.write(`storage.db.users.update({username: 'TooAngel'}, {$set: {password: '70dbaf0462458b31ff9b3d184d06824d1de01f6ad59cae7b5b9c01a8b530875ac502c46985b63f0c147cf59936ac1be302edc532abc38236ab59efecb3ec7f64fad7e4544c1c5a5294a8f6f45204deeb009a31dd6e81e879cfb3b7e63f3d937f412734b1a3fa7bc04bf3634d6bc6503bb0068c3f6b44f3a84b5fa421690a7399799e3be95278381ae2ac158c27f31eef99db1f21e75d285802cda983cd8a73a8a85d03ba45dcc7eb2b2ada362887df10bf74cdcca47f911147fd0946fb5119c888f048000044072dcc29b1c428b40b805cadeee7b3afc1e9d9d546c2a878ff8df9fcf805a28cc8b6e4b78051f0adb33642f1097bf0a189f388860302df6173b8e7955a35b278655df2d7615b54da6c63dc501c7914d726bea325c2225f343dff0068ac42300661664ee5611eb623e1efa379f571d46ba6a0e13a9e3e9c5bb7a772b685258f768216a830c5e9af3685898d98a9935cca2ba5efb5e1e4a9f2745c53bff318bda3e376bcd06b06d87a55045a76a1982f6e3b9fb77d39c2ff5c09c76989d1c779655bc2acdf55879b68f6155d14c26bdca3af5c7fd6de9926dbc091da280e6f7e3d727fa68c89aa8ac25b5e50bd14bf2dbcd452975710ef4b8d61a81c8f6ef2d5584eacfcb1ab4202860320f03313d23076a3b3e085af5f0a9e010ddb0ad5af57ed0db459db0d29aa2bcbcd64588d4c54d0c5265bf82f31349d9456', salt: '7eeb813417828682419582da8f997dea3e848ce8293e68b2dbb2f334b1f8949f'}})\r\n`);
      return;
    }

    if (line.startsWith('{ modified: 1 }')) {
      console.log('Listen to the log');
      followLog();
      socket.write(`system.resumeSimulation()\r\n`);
      return;
    }

    if (line.startsWith(`'OK'`)) {
      console.log('Start the simulation');
      await sleep(duration);
      socket.write(`storage.db['rooms.objects'].find({room: 'W1N7', type: 'controller'})\r\n`);
      return;
    }

    if (line.indexOf('type: \'controller\',') > -1) {
      eval(`var value = ${line}`);
      const progressPos = line.indexOf('progress: ');
      const progress = line.substring(progressPos + 10, progressPos+11);
      if (value[0].progress > 0 && value[0].level > 1) {
        defer.resolve();
      }
      defer.reject('No progress');
    }
    console.log('socket.data:' + line);
  });

  socket.on('connect', () => {
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
 */
async function main() {
  await startServer();
  await sleep(5);
  try {
    await connectToCli();
    console.log('Yeah');
    process.exit(0);
  } catch (e) {
    console.log(e);
    console.log('!!! No progress on the controller !!!');
    // throw e;
    process.exit(1);
  }
}
main();
