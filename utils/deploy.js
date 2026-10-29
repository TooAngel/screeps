const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * Uploads the bot to screeps.com: every file of `src/` plus the profiler,
 * as the branch `default`.
 *
 * Usage: `node utils/deploy.js [main|season]` (default: main).
 * main: `email` and `password` from the environment or from
 * `account.screeps.com.js`; season: `token`.
 */

const servers = {
  main: {path: '/api/user/code'},
  season: {path: '/season/api/user/code'},
};

/**
 * getAccount
 *
 * @return {object} the account from `account.screeps.com.js`, if there is one
 */
function getAccount() {
  try {
    return require('../account.screeps.com'); // eslint-disable-line global-require
  } catch (e) {
    return {};
  }
}

/**
 * getModules
 *
 * @return {object} module name => code, as the server takes them
 */
function getModules() {
  const files = fs.readdirSync(path.join(__dirname, '../src'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join(__dirname, '../src', file));
  files.push(require.resolve('screeps-profiler/screeps-profiler.js'));
  const modules = {};
  for (const file of files) {
    modules[path.basename(file, '.js')] = fs.readFileSync(file, 'utf8');
  }
  return modules;
}

/**
 * upload
 *
 * @param {object} server
 * @param {object} auth email and password, or token
 * @param {object} modules
 * @return {Promise<object>} the server's answer
 */
function upload(server, auth, modules) {
  const body = JSON.stringify({branch: 'default', modules});
  const headers = {'Content-Type': 'application/json; charset=utf-8'};
  const options = {hostname: 'screeps.com', port: 443, path: server.path, method: 'POST', headers};
  if (auth.token) {
    headers['X-Token'] = auth.token;
  } else {
    options.auth = `${auth.email}:${auth.password}`;
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`server returned ${res.statusCode}: ${data}`));
          return;
        }
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.end(body);
  });
}

/**
 * main
 *
 * @param {string} name main or season
 */
async function main(name = 'main') {
  const server = servers[name];
  if (!server) {
    throw new Error(`unknown server ${name}, one of: ${Object.keys(servers).join(', ')}`);
  }
  const account = getAccount();
  const auth = name === 'season' ?
    {token: process.env.token || account.token} :
    {email: process.env.email || account.email, password: process.env.password || account.password};
  const modules = getModules();
  const answer = await upload(server, auth, modules);
  if (!answer.ok) {
    throw new Error(`upload failed: ${JSON.stringify(answer)}`);
  }
  console.log(`Uploaded ${Object.keys(modules).length} modules to ${name}, branch default.`);
}

if (require.main === module) {
  main(process.argv[2]).catch((error) => {
    console.log(error.message);
    process.exitCode = 1;
  });
}

module.exports = {getModules};
