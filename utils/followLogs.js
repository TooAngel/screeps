const {logConsole, followLog, setHostname} = require('./testHelpers');
const {playerRoom, rooms} = require('./testConfig');

/**
 * main
 */
async function main() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  if (process.argv.length > 2) {
    setHostname(process.argv[2]);
  }
  let onlyPlayerRoom;
  if (process.argv.length > 3) {
    onlyPlayerRoom = playerRoom;
  }
  for (let i=0; i<1000; i++) {
    console.log(i);
    try {
      await followLog(rooms, logConsole, undefined, onlyPlayerRoom);
    } catch (e) {
      console.log(e);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
main();
