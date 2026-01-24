const https = require('https');

/**
 * getUserInfo
 *
 * @return {object}
 */
function getUserInfo() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'screeps.com',
      port: 443,
      path: '/api/auth/me',
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
        const parsed = JSON.parse(data);
        console.log(`Response: ${data}`);
        resolve(parsed);
      });
    }).on('error', (err) => {
      console.log('Error: ' + err.message);
    });
    req.write(data);
    req.end();
  });
}

/**
 * setShardLimits
 *
 * @param {string} shardName
 * @param {number} cpuLimit
 * @return {object}
 */
function setShardLimits(shardName, cpuLimit) {
  return new Promise((resolve) => {
    const expression = `Game.cpu.setShardLimits({${shardName}: ${cpuLimit}})`;
    const dataObject = {
      expression: expression,
      shard: shardName,
    };
    console.log(`Setting shard limits: ${expression}`);
    const data = JSON.stringify(dataObject);
    const options = {
      hostname: 'screeps.com',
      port: 443,
      path: '/api/user/console',
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
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        const parsed = JSON.parse(data);
        console.log(`Response: ${data}`);
        resolve(parsed);
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
 * @return {object} - Returns {success: boolean, shardName: string} or {success: false}
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
            console.log(`✓ Successfully placed spawn in ${room} on ${shard.name}`);
            return {success: true, shardName: shard.name};
          } else {
            console.log(`✗ Failed to place spawn in ${room}: ${response.error}`);
          }
        }
      }
    }
  }
  console.log('✗ Failed to place spawn in any available room');
  return {success: false};
}

/**
 * sleep
 *
 * @param {number} ms
 * @return {Promise}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  // Wait 185 seconds for the respawn cooldown (180s + 5s buffer)
  console.log('Waiting 185 seconds for respawn cooldown...');
  await sleep(185000);
  console.log('Cooldown complete, attempting to place spawn...');

  // Get user info to determine total CPU available
  const userInfo = await getUserInfo();
  const totalCpu = userInfo.cpu;
  console.log(`User has ${totalCpu} total CPU available`);

  const shardsInfo = await getShards();
  // Use all shards - we can spawn on any shard and then allocate CPU to it
  const shardsReduced = shardsInfo.shards.map((shard) => {
    return {
      name: shard.name,
      rooms: shard.rooms,
      user: shard.users,
      tick: shard.tick,
      value: shard.rooms / shard.users / (shard.tick / 1000),
    };
  });
  shardsReduced.sort((a, b) => b.value - a.value);
  console.log(`Shards ranked by value: ${shardsReduced.map((s) => s.name).join(', ')}`);

  const result = await findRoomAndSpawn(shardsReduced);

  if (!result.success) {
    throw new Error('Respawner failed to place spawn');
  }

  // Allocate all CPU to the shard where we spawned
  console.log(`Allocating ${totalCpu} CPU to ${result.shardName}...`);
  const shardLimitResult = await setShardLimits(result.shardName, totalCpu);
  if (shardLimitResult.error) {
    console.log(`⚠ Warning: Failed to set shard limits: ${shardLimitResult.error}`);
  } else {
    console.log(`✓ Successfully allocated CPU to ${result.shardName}`);
  }

  console.log('✓ Respawner completed successfully');
}

main();
