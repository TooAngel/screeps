'use strict';

require('config');
// load local config
try {
  require('local_config');
} catch (e) {}
// load friends
try {
  global.friends = require('friends');
} catch (e) {
  global.friends = [];
}

require('logging');
require('utils');
require('config_brain_memory');
require('config_brain_nextroom');
require('config_brain_squadmanager');
require('prototype_creep');
require('prototype_creep_clean');
require('prototype_creep_fight');
require('prototype_creep_resources');
require('prototype_creep_harvest');
require('prototype_creep_mineral');
require('prototype_creep_move');
require('prototype_creep_routing');
require('prototype_creep_startup_tasks');
require('prototype_roomPosition_structures');
require('prototype_room');
require('prototype_roomPosition');
require('prototype_room_init');
require('prototype_room_costmatrix');
require('prototype_room_attack');
require('prototype_room_basebuilder');
require('prototype_room_cached');
require('prototype_room_controller');
require('prototype_room_creepbuilder');
require('prototype_room_defense');
require('prototype_room_fight');
require('prototype_room_market');
require('prototype_room_memory');
require('prototype_room_mineral');
require('prototype_room_my');
require('prototype_room_external');
require('prototype_room_routing');
require('prototype_room_utils');
require('prototype_room_wallsetter');
require('prototype_string');
require('prototype_structure');
require('role_atkeeper');
require('role_atkeepermelee');
require('role_autoattackmelee');
require('role_carry');
require('role_defender');
require('role_defendmelee');
require('role_defendranged');
require('role_extractor');
require('role_harvester');
require('role_mineral');
require('role_nextroomer');
require('role_nextroomerattack');
require('role_planer');
require('role_powerattacker');
require('role_powerdefender');
require('role_powerhealer');
require('role_powertransporter');
require('role_reserver');
require('role_repairer');
require('role_scout');
require('role_scoutnextroom');
require('role_sourcer');
require('role_squadsiege');
require('role_squadheal');
require('role_storagefiller');
require('role_structurer');
require('role_towerfiller');
require('role_upgrader');

try {
  require('local_autoload');
} catch (err) {
  //console.log('local_autoload not found');
}
