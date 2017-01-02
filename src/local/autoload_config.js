'use strict';

// load local config
try {
  require('config');
} catch (e) {
}

// load friends
try {
  global.friends = require('local/friends');
} catch (e) {
  global.friends = [];
}
