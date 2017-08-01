'use strict';

var rp = require('request-promise-native');
var fs = require('fs');

let token = process.env.grafana_tooangel_token;

async function getDashboard(name) {
  let url = 'https://screepspl.us/grafana/api/dashboards/' + name;
  let dashboard = await rp.get({
    uri: url,
    auth: {
      'bearer': token
    },
    json: true
  });
  return dashboard
}

async function getDashboardList() {
  let url = 'https://screepspl.us/grafana/api/search';
  let list = await rp.get({
    uri: url,
    auth: {
      'bearer': token
    },
    json: true
  });
  return list;
}

async function getDashboards() {
  let list = await getDashboardList();

  let dashboards = {};
  for (let item of Object.keys(list)) {
    let path = list[item].uri;
    console.log(path);
    var obj = JSON.parse(fs.readFileSync('grafana/main/' + path + '.json', 'utf8'));
    let dashboard = await getDashboard(path);
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
    break
  }

}

async function updateDashboard(path) {
  var obj = JSON.parse(fs.readFileSync('grafana/main/' + path + '.json', 'utf8'));

  let url = 'https://screepspl.us/grafana/api/search';
  url = 'https://screepspl.us/grafana/api/dashboards/db';
  console.log(url);

  var options = {
    uri: url,
    method: 'POST',
    json: obj,
    auth: {
      bearer: token
    }
  };

  let response = await rp(options);
  console.log(response);
}

async function fetchDashboards() {
  let list = await getDashboardList();
  for (item of Object.keys(list)) {
    let dashboard = await getDashboard(list[item].uri);
    fs.writeFileSync('grafana/tmp/' + list[item].uri + '.json', JSON.stringify(dashboard), 'utf8');
  }
}

function main() {
  getDashboards();

  // To download dashboard uncomment
  //fetchDashboards();
}

main();
