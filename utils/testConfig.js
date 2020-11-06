module.exports.cliPort = 21026;

module.exports.verbose = false;

module.exports.tickDuration = 10;

module.exports.playerRoom = 'W8N1';
players = {
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
  {tick: 30, check: {structures: 1}},
  {tick: 500, check: {level: 2}, required: true},
  {tick: 1700, check: {structures: 2}},
  {tick: 2800, check: {structures: 3}},
  {tick: 3300, check: {structures: 4}},
  {tick: 4200, check: {structures: 5}},
  {tick: 4900, check: {structures: 6}},
  {tick: 14100, check: {level: 3}, required: true},
  {tick: 14200, check: {structures: 7}},
  {tick: 14300, check: {structures: 8}},
  {tick: 14800, check: {structures: 9}},
  {tick: 15300, check: {structures: 10}},
  {tick: 15700, check: {structures: 11}},
  {tick: 33000, check: {level: 4}},
  {tick: 38000, check: {structures: 12}},
  {tick: 39000, check: {structures: 13}},
  {tick: 40000, check: {structures: 14}},
  {tick: 41000, check: {structures: 15}},
  {tick: 42000, check: {structures: 16}},
  {tick: 43000, check: {structures: 17}},
  {tick: 44000, check: {structures: 18}},
  {tick: 45000, check: {structures: 19}},
  {tick: 46000, check: {structures: 20}},
  {tick: 47000, check: {structures: 21}},
  {tick: 48000, check: {structures: 22}},
  {tick: 49000, check: {structures: 23}},
  {tick: 5000, check: {structures: 24}},
  {tick: 51000, check: {structures: 25}},
  {tick: 52000, check: {structures: 26}},
  {tick: 53000, check: {structures: 27}},
  {tick: 54000, check: {structures: 28}},
  {tick: 55000, check: {structures: 29}},
  {tick: 56000, check: {structures: 30}},
];
