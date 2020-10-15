const {logConsole, followLog, setHostname} = require('./testHelpers');
const {cliPort, verbose, tickDuration, playerRoom, players, rooms, milestones} = require('./testConfig');
let {hostname} = require('./testHelpers');

async function main() {
  if (process.argv.length > 2) {
    setHostname(process.argv[2]);
  }
  followLog(rooms, logConsole, undefined, playerRoom);
}
main();
