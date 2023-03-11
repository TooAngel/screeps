module.exports.cliPort = 21026;

module.exports.verbose = false;

module.exports.tickDuration = 10;

// todo for local-testing
// if your machine is slow try increment this
module.exports.waitForConnection = 10;

module.exports.playerRoom = 'W8N8';
const players = {
  'W1N7': {x: 43, y: 35},
  'W8N8': {x: 21, y: 28},
  'W8N1': {x: 33, y: 13},
  'W5N1': {x: 10, y: 9},
  'W8N3': {x: 14, y: 17},
  'W7N4': {x: 36, y: 11},
  'W2N5': {x: 8, y: 26},
};
module.exports.players = players;
module.exports.rooms = Object.keys(players);

module.exports.milestones = [
  {tick: 500, check: {structures: 1}, required: true},
  {tick: 1000, check: {level: 2}, required: true},
  {tick: 2000, check: {structures: 2}, required: true},
  {tick: 3300, check: {structures: 3}, required: true},
  {tick: 3700, check: {structures: 4}, required: true},
  {tick: 4300, check: {structures: 5}, required: true},
  {tick: 4900, check: {structures: 6}, required: true},
  {tick: 14100, check: {level: 3}, required: true},
  {tick: 14200, check: {structures: 7}, required: true},
  {tick: 14300, check: {structures: 8}, required: true},
  {tick: 14800, check: {structures: 9}, required: true},
  {tick: 15300, check: {structures: 10}, required: true},
  {tick: 15700, check: {structures: 11}, required: true},
  {tick: 30000, check: {level: 4}, required: false},
  {tick: 30100, check: {structures: 12}, required: false},
  {tick: 30400, check: {structures: 13}, required: false},
  {tick: 30500, check: {structures: 14}, required: false},
  {tick: 30800, check: {structures: 15}, required: false},
  {tick: 31000, check: {structures: 16}, required: false},
  {tick: 31400, check: {structures: 17}, required: false},
  {tick: 31600, check: {structures: 18}, required: false},
  {tick: 32000, check: {structures: 19}, required: false},
  {tick: 32500, check: {structures: 20}, required: false},
  {tick: 33000, check: {structures: 21}, required: false},
  {tick: 37000, check: {structures: 22}, required: false},
  {tick: 49000, check: {structures: 23}, required: false},
  {tick: 50000, check: {structures: 24}},
  {tick: 51000, check: {structures: 25}},
  {tick: 52000, check: {structures: 26}},
  {tick: 53000, check: {structures: 27}},
  {tick: 54000, check: {structures: 28}},
  {tick: 55000, check: {structures: 29}},
  {tick: 56000, check: {structures: 30}},
];
