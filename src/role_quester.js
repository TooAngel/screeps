'use strict';

const {initPlayer, addToReputation} = require('./diplomacy');
const {debugLog} = require('./logging');

/*
 * quester checks if quests are solved
 */

roles.quester = {};
roles.quester.settings = {
  layoutString: 'M',
  maxLayoutAmount: 1,
};

roles.quester.questLost = function(creep, quest, reason, value) {
  creep.log(`Quest lost cs: ${value} ${JSON.stringify(quest)}`);
  delete Memory.quests[creep.memory.level];
  creep.suicide();
};

roles.quester.questWon = function(creep, quest) {
  const name = quest.player.name;
  initPlayer(name);
  debugLog('diplomacy', `Quest won ${JSON.stringify(quest)}`);
  addToReputation(name, 100);

  creep.log(`Quest won: ${JSON.stringify(quest)}`);
  const response = {
    type: 'quest',
    id: quest.id,
    result: 'won',
  };
  creep.room.terminal.send(RESOURCE_ENERGY, 100, quest.player.room, JSON.stringify(response));
  delete Memory.quests[creep.memory.level];
  creep.suicide();
};

roles.quester.handleBuildConstructionSite = function(creep, quest) {
  // Give time before end to build the last CS
  if (quest.end - Game.time > 300) {
    const cs = creep.room.findConstructionSites();
    if (cs.length === 0) {
      creep.pos.createConstructionSite(STRUCTURE_ROAD);
    }
  }
  if (quest.end < Game.time) {
    const cs = creep.room.findConstructionSites();

    if (cs.length > 0) {
      roles.quester.questLost(creep, quest, 'cs', cs.length);
      return;
    }

    const roads = creep.room.findPropertyFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_ROAD]);
    if (roads.length < 3) {
      roles.quester.questLost(creep, quest, 'roads', roads.length);
      return;
    }
    roles.quester.questWon(creep, quest);
  }
};

roles.quester.action = function(creep) {
  creep.setNextSpawn();
  creep.spawnReplacement();
  const quest = Memory.quests[creep.memory.level];
  if (!quest) {
    creep.log(`Quest ${creep.memory.level} not found, suiciding`);
    creep.suicide();
    return;
  }
  if (quest.quest === 'buildcs') {
    roles.quester.handleBuildConstructionSite(creep, quest);
    creep.moveRandom();
    return true;
  }

  creep.moveRandom();
  return true;
};
