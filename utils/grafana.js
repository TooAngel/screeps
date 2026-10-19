'use strict';

const fs = require('fs');

const token = process.env.grafana_tooangel_token;

/**
 * request
 *
 * @param {string} url
 * @param {object} [body] - JSON body, sends a POST request if set
 * @return {object}
 */
async function request(url, body) {
  const options = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  if (body) {
    options.method = 'POST';
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw Error(`${options.method || 'GET'} ${url} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/**
 * getDashboard
 *
 * @param {string} name
 * @return {object}
 */
async function getDashboard(name) {
  const url = 'https://screepspl.us/grafana/api/dashboards/' + name;
  const dashboard = await request(url);
  return dashboard;
}

/**
 * getDashboardList
 * @return {list}
 */
async function getDashboardList() {
  const url = 'https://screepspl.us/grafana/api/search';
  const list = await request(url);
  return list;
}

/**
 * getDashboards
 */
async function getDashboards() {
  const list = await getDashboardList();

  for (const item of Object.keys(list)) {
    const path = list[item].uri;
    console.log(path);
    const obj = JSON.parse(fs.readFileSync('grafana/main/' + path + '.json', 'utf8'));
    const dashboard = await getDashboard(path);
    if (obj.dashboard.version === dashboard.dashboard.version) {
      continue;
    }
    if (obj.dashboard.version < dashboard.dashboard.version) {
      console.log(`Dashboard: ${JSON.stringify(dashboard)}`);
      console.log(`File: ${JSON.stringify(obj)}`);
      throw Error(`Dashboard ${path} was changed online`);
    }
    console.log(`Updating ${path}`);
    updateDashboard(path);
    break;
  }
}

/**
 * updateDashboard
 *
 * @param {string} path
 */
async function updateDashboard(path) {
  const obj = JSON.parse(fs.readFileSync('grafana/main/' + path + '.json', 'utf8'));

  let url = 'https://screepspl.us/grafana/api/search';
  url = 'https://screepspl.us/grafana/api/dashboards/db';
  console.log(url);

  const response = await request(url, obj);
  console.log(response);
}

// async function fetchDashboards() {
//   const list = await getDashboardList();
//   for (const item of Object.keys(list)) {
//     const dashboard = await getDashboard(list[item].uri);
//     fs.writeFileSync('grafana/tmp/' + list[item].uri + '.json', JSON.stringify(dashboard), 'utf8');
//   }
// }

/**
 * main
 */
function main() {
  getDashboards();

  // To download dashboard uncomment
  // fetchDashboards();
}

main();
