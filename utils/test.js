const net = require('net');
const q = require('q');
const _ = require('lodash');

const {setPassword, sleep, initServer, startServer, spawnBots, helpers, logConsole, followLog} = require('./testHelpers');

const {cliPort, verbose, tickDuration, waitForConnection, playerRoom, players, rooms, milestones} = require('./testConfig');

const controllerRooms = {};
const status = {};
let lastTick = 0;

process.once('SIGINT', () => {
  console.log('SIGINT received...');
  console.log(`${lastTick} End of simulation`);
  console.log('Status:');
  console.log(JSON.stringify(status, null, 2));
  console.log('Milestones:');
  console.log(JSON.stringify(milestones, null, 2));
  process.exit();
});

for (const room of rooms) {
  status[room] = {
    controller: null,
    creeps: 0,
    // creepsNames: [],
    progress: 0,
    level: 0,
    structures: 0,
  };
}

let botsSpawned = false;

/**
 * Tester
 */
class Tester {
  /**
   * constructor
   */
  constructor() {
    this.roomsSeen = {};
    this.maxRuntime = 0;
    this.onlyLocal = false;
    if (process.argv.length > 2) {
      try {
        this.maxRuntime = parseInt(process.argv[2], 10) * 60;
      } catch (e) {
        console.log(`Cannot parse runtime argument ${process.argv} ${e}`);
      }
    }
    if (process.argv.length > 3) {
      this.onlyLocal = true;
    }
  }

  /**
   * handleMaxRuntime
   *
   * @param {object} defer
   * @return {void}
   */
  async handleMaxRuntime(defer) {
    await sleep(this.maxRuntime);
    console.log(`${lastTick} End of simulation`);
    console.log('Status:');
    console.log(JSON.stringify(status, null, 2));
    console.log('Milestones:');
    console.log(JSON.stringify(milestones, null, 2));
    const failes = milestones.filter((milestone) => milestone.required && milestone.tick < lastTick && !milestone.success);
    if (failes.length > 0) {
      for (const fail of failes) {
        console.log(`${lastTick} Milestone failed ${JSON.stringify(fail)}`);
      }
      console.log(`${lastTick} Status check: failed`);
      defer.reject('Not all milestones are hit.');
      return;
    }
    console.log(`${lastTick} Status check: passed`);
    defer.resolve();
  }
  /**
   *
   * @param {string} line
   * @param {object} defer
   * @return {undefined}
   */
  async checkForSuccess(line, defer) {
    if (botsSpawned && line.startsWith(`'OK'`)) {
      let appendix = '';
      if (this.maxRuntime > 0) {
        appendix = ` with runtime ${this.maxRuntime / 60} minutes`;
      }
      console.log(`> Start the simulation${appendix}`);
      if (this.maxRuntime > 0) {
        this.handleMaxRuntime(defer);
      }
    }
  }

  /**
   * execute method
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
  async execute() {
    const defer = q.defer();
    const socket = net.connect(cliPort, '127.0.0.1');

    socket.on('data', async(raw) => {
      const data = raw.toString('utf8');
      const line = data.replace(/^< /, '').replace(/\n< /, '');
      if (await spawnBots(line, socket, rooms, players, tickDuration, this.onlyLocal)) {
        botsSpawned = true;
        return;
      }
      if (setPassword(line, socket, rooms, this.roomsSeen, playerRoom, players, this.onlyLocal)) {
        if (rooms.length === Object.keys(this.roomsSeen).length) {
          console.log('> Listen to the log');
          followLog(rooms, logConsole, statusUpdater);
          await sleep(5);
          console.log(`> system.resumeSimulation()`);
          socket.write(`system.resumeSimulation()\r\n`);
        }
        return;
      }

      await this.checkForSuccess(line, defer);
    });

    socket.on('connect', () => {
      console.log(new Date().toString(), `${lastTick} connected`);
    });
    socket.on('error', (error) => {
      defer.reject(error);
    });

    return defer.promise;
  }

  /**
   * run
   */
  async run() {
    const start = Date.now();
    await initServer();
    await startServer();
    console.log(new Date().toString(), 'waiting for connection');
    await sleep(waitForConnection);
    let exitCode = 0;
    try {
      await this.execute();
      console.log(`${lastTick} Yeah`);
    } catch (e) {
      exitCode = 1;
      console.log(`${lastTick} ${e}`);
    }
    const end = Date.now();
    console.log(`${lastTick} seconds elapsed ${Math.floor((end - start) / 1000)}`);
    /* eslint no-process-exit: "off" */
    process.exit(exitCode);
  }
}

const printCurrentStatus = function(gameTime) {
  if (!verbose) {
    return;
  }
  console.log('-------------------------------');
  const keys = Object.keys(status);
  keys.sort((a, b) => {
    if (status[a].level === status[b].level) {
      return status[a].progress - status[b].progress;
    }
    return status[a].level - status[b].level;
  });
  for (const key of keys) {
    console.log(`${gameTime} Status: room ${key} level: ${status[key].level} progress: ${status[key].progress} structures: ${status[key].structures} creeps: ${status[key].creeps}`);
  }
};

/**
 * statusUpdaterSuccess
 *
 * @param {object} event
 * @param {object} milestone
 */
function statusUpdaterSuccess(event, milestone) {
  milestone.success = event.data.gameTime < milestone.tick;
  milestone.tickReached = event.data.gameTime;
  if (milestone.success) {
    console.log('===============================');
    console.log(`${event.data.gameTime} Milestone: Success ${JSON.stringify(milestone)}`);
  } else {
    console.log('===============================');
    console.log(`${event.data.gameTime} Milestone: Reached too late ${JSON.stringify(milestone)}`);
  }
}

/**
 * getFailedRooms
 *
 * @param {object} milestone
 * @return {list}
 */
function getFailedRooms(milestone) {
  const failedRooms = [];
  for (const room of Object.keys(status)) {
    for (const key of Object.keys(milestone.check)) {
      if (status[room][key] < milestone.check[key]) {
        failedRooms.push(room);
        break;
      }
    }
  }
  return failedRooms;
}

/**
 * checkMilestone
 *
 * @param {object} event
 * @param {object} milestone
 * @return {list}
 */
function checkMilestone(event, milestone) {
  let failedRooms = [];
  if (typeof milestone.success === 'undefined' || milestone.success === null) {
    failedRooms = getFailedRooms(milestone);
    const success = Object.keys(status).length === Object.keys(players).length && failedRooms.length === 0;

    if (success) {
      statusUpdaterSuccess(event, milestone);
    }
  }
  return failedRooms;
}

/**
 * updateStatus
 *
 * @param {object} event
 */
function updateStatus(event) {
  helpers.initControllerID(event, status, controllerRooms);
  if (_.size(event.data.objects) > 0) {
    helpers.updateCreeps(event, status);
    helpers.updateStructures(event, status);
    helpers.updateController(event, status, controllerRooms);
  }
}

/**
 * updates the stauts object
 *
 * @param {object} event
 */
function statusUpdater(event) {
  if (event.data.gameTime !== lastTick) {
    lastTick = event.data.gameTime;
    if (event.data.gameTime % 300 === 0) {
      printCurrentStatus(event.data.gameTime);
    }
    for (const milestone of milestones) {
      const failedRooms = checkMilestone(event, milestone);

      if (milestone.success) {
        continue;
      }

      if (milestone.tick === event.data.gameTime) {
        milestone.failedRooms = failedRooms;
        console.log('===============================');
        console.log(`${event.data.gameTime} Milestone: Failed ${JSON.stringify(milestone)} status: ${JSON.stringify(status)}`);
        continue;
      }
    }
  }
  updateStatus(event);
}

/**
 * main method
 *
 * Start the server and connects via cli
 * @return {undefined}
 */
async function main() {
  const tester = new Tester();
  await tester.run();
}
main();
