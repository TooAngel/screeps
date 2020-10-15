const net = require('net');
const q = require('q');
const _ = require('lodash');

const {setPassword, sleep, initServer, startServer, spawnBots, helpers, logConsole, followLog} = require('./testHelpers');

const {cliPort, verbose, tickDuration, playerRoom, players, rooms, milestones} = require('./testConfig');

const controllerRooms = {};
const status = {};
let lastTick = 0;

process.once('SIGINT', (code) => {
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

class Tester {
  constructor(length) {
    this.roomsSeen = {};
    this.maxRuntime = 0;
    if (process.argv.length > 2) {
      try {
        this.maxRuntime = parseInt(process.argv[2], 10) * 60;
      } catch (e) {
        console.log(`Cannot parse runtime argument ${process.argv} ${e}`);
      }
    }
  }

  /**
   *
   * @param {string} line
   * @param {object} defer
   * @return {undefined}
   */
  async checkForSucces(line, defer) {
    if (botsSpawned && line.startsWith(`'OK'`)) {
      let appendix = '';
      if (this.maxRuntime > 0) {
        appendix = ` with runtime ${this.maxRuntime / 60} minutes`
      }
      console.log(`> Start the simulation${appendix}`);
      if (this.maxRuntime > 0) {
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

    socket.on('data', async (raw) => {
      const data = raw.toString('utf8');
      const line = data.replace(/^< /, '').replace(/\n< /, '');
      if (await spawnBots(line, socket, rooms, players, tickDuration)) {
        botsSpawned = true;
        return;
      }
      if (setPassword(line, socket, rooms, this.roomsSeen, playerRoom)) {
        if (rooms.length === Object.keys(this.roomsSeen).length) {
          console.log('> Listen to the log');
          followLog(rooms, logConsole, statusUpdater);
          await sleep(5);
          console.log(`> system.resumeSimulation()`);
          socket.write(`system.resumeSimulation()\r\n`);
        }
        return;
      }

      await this.checkForSucces(line, defer);
    });

    socket.on('connect', () => {
      console.log('connected');
    });
    socket.on('error', (error) => {
      defer.reject(error);
    });

    return defer.promise;
  }

  async run() {
    const start = Date.now();
    await initServer();
    await startServer();
    await sleep(5);
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
 * updates the stauts object
 *
 * @param {object} event
 */
const statusUpdater = (event) => {
  if (event.data.gameTime !== lastTick) {
    lastTick = event.data.gameTime;
    if (event.data.gameTime % 300 === 0) {
      printCurrentStatus(event.data.gameTime);
    }
    for (const milestone of milestones) {
      const failedRooms = [];
      if (typeof milestone.success === 'undefined' || milestone.success === null) {
        let success = Object.keys(status).length === Object.keys(players).length;
        for (const room of Object.keys(status)) {
          for (const key of Object.keys(milestone.check)) {
            if (status[room][key] < milestone.check[key]) {
              success = false;
              failedRooms.push(room);
              break;
            }
          }
        }
        if (success) {
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
      }

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

  helpers.initControllerID(event, status, controllerRooms);
  if (_.size(event.data.objects) > 0) {
    helpers.updateCreeps(event, status);
    helpers.updateStructures(event, status);
    helpers.updateController(event, status, controllerRooms);
  }
};

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
