const {ScreepsAPI} = require('screeps-api');

const api = new ScreepsAPI({
  email: 'TooAngel',
  password: 'tooangel',
  protocol: 'http',
  hostname: 'localhost',
  port: 21025,
  path: '/',
});

/**
 * main method
 *
 * Connects to the api and reads and prints the console log, if messages
 * are available
 */
async function main() {
  await api.auth();

  api.socket.connect();
  api.socket.on('connected', ()=>{});
  api.socket.on('auth', (event)=>{});

  api.socket.subscribe('console', (event)=>{
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

main();
