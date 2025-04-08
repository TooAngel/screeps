const https = require('https');

/**
 * getWorldStatus
 *
 * @return {object}
 */
function getWorldStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'screeps.com',
      port: 443,
      path: '/api/user/world-status',
      method: 'GET',
      headers: {
        'X-Token': process.env.token,
        'X-Username': process.env.token,
      },
    };
    https.get(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      console.log('Error: ' + err.message);
    });
  });
}

/**
 * respawn
 *
 * @return {object}
 */
function respawn() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'screeps.com',
      port: 443,
      path: '/api/user/respawn',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': 0,
        'X-Token': process.env.token,
        'X-Username': process.env.token,
      },
    };
    const req = https.request(options, (resp) => {
      console.log(`STATUS: ${resp.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      console.log('Error: ' + err.message);
    });
    req.write('');
    req.end();
  });
}

/**
 * getShards
 *
 * @return {object}
 */
function getShards() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'screeps.com',
      port: 443,
      path: '/api/game/shards/info',
      method: 'GET',
      headers: {
        'X-Token': process.env.token,
        'X-Username': process.env.token,
      },
    };
    https.get(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      console.log('Error: ' + err.message);
    });
  });
}

/**
 * getWorldStartRooms
 *
 * @param {string} shardName
 * @return {object}
 */
function getWorldStartRooms(shardName) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'screeps.com',
      port: 443,
      path: `/api/user/world-start-room?shard=${shardName}`,
      method: 'GET',
      headers: {
        'X-Token': process.env.token,
        'X-Username': process.env.token,
      },
    };
    https.get(options, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        console.log(data);
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      console.log('Error: ' + err.message);
    });
  });
}

/**
 * placeSpawn
 *
 * @param {string} room
 * @param {string} shard
 * @return {object}
 */
function placeSpawn(room, shard) {
  return new Promise((resolve) => {
    const dataObject = {
      room: room,
      name: 'Spawn1',
      x: 25,
      y: 25,
      shard: shard,
    };
    console.log(dataObject);
    const data = JSON.stringify(dataObject);
    const options = {
      hostname: 'screeps.com',
      port: 443,
      path: '/api/game/place-spawn',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Token': process.env.token,
        'X-Username': process.env.token,
      },
    };
    const req = https.request(options, (resp) => {
      console.log(`STATUS: ${resp.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(resp.headers)}`);
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', (err) => {
      console.log('Error: ' + err.message);
    });
    req.write(data);
    req.end();
  });
}

/**
 * findRoomAndSpawn
 *
 * @param {list} shardsReduced
 * @return {void}
 */
async function findRoomAndSpawn(shardsReduced) {
  for (const shard of shardsReduced) {
    const rooms = await getWorldStartRooms(shard.name);
    for (const roomCenter of rooms.room) {
      const matcher = /(\D+)(\d+)(\D+)(\d+)/;
      const result = roomCenter.match(matcher);
      for (let x = -3; x < 3; x++) {
        for (let y = -3; y < 3; y++) {
          const xValue = x + parseInt(result[2], 10);
          const yValue = y + parseInt(result[4], 10);
          const room = `${result[1]}${xValue}${result[3]}${yValue}`;
          const response = await placeSpawn(room, shard.name);
          if (!response.error) {
            return;
          }
        }
      }
    }
  }
}

/**
 * main
 *
 * @return {void}
 */
async function main() {
  const worldStatus = await getWorldStatus();
  if (!['empty', 'lost'].includes(worldStatus.status)) {
    console.log(`Not respawning, world status: ${JSON.stringify(worldStatus)}`);
    return;
  }
  console.log(worldStatus);
  const response = await respawn();
  console.log(response);
  const shardsInfo = await getShards();
  const shards = shardsInfo.shards.filter((shard) => shard.cpuLimit === 0);
  const shardsReduced = shards.map((shard) => {
    return {
      name: shard.name,
      rooms: shard.rooms,
      user: shard.users,
      tick: shard.tick,
      value: shard.rooms / shard.users / (shard.tick / 1000),
    };
  });
  shardsReduced.sort((a, b) => b.value - a.value);
  findRoomAndSpawn(shardsReduced);
}

main();
