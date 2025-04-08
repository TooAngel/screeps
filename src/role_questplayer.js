'use strict';

/*
 * Solves quests
 */

roles.questplayer = {};
roles.questplayer.settings = {
  layoutString: 'MWMC',
  maxLayoutAmount: 5,
};

roles.questplayer.action = function(creep) {
  creep.setNextSpawn();
  creep.spawnReplacement();
  creep.log(`activeQuest: ${global.data.activeQuest}`);
  creep.moveRandom();
  return true;
};
