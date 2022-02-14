'use strict';

brain.handleQuests = function() {
  Memory.quests = Memory.quests || {};
  if (Object.keys(Memory.quests).length > 0) {
    brain.debugLog('brain', `brain.handleQuests quests: ${Object.keys(Memory.quests).length}`);
  }
  for (const id of Object.keys(Memory.quests)) {
    const quest = Memory.quests[id];

    if (!quest.checked && quest.check < Game.time) {
      Memory.quests[id].checked = true;
      Game.rooms[quest.origin].checkRoleToSpawn('quester', 1, undefined, quest.room, quest.id, quest.origin);
    }

    if (quest.end < Game.time) {
      delete Memory.quests[id];
    }
  }
};

brain.getQuestBuildcs = function(data) {
  const quest = {};
  quest.room = data.room;
  quest.quest = 'buildcs';
  quest.end = Game.time + 15000;
  quest.check = Game.time + 0;
  return quest;
};

brain.getQuest = function(transaction, data) {
  const info = {};
  info.id = data.id;
  info.player = {
    name: transaction.sender.username,
    room: transaction.from,
  };
  info.origin = transaction.to;

  const quest = brain.getQuestBuildcs(data);

  info.room = quest.room;
  info.quest = quest.quest;
  info.end = quest.end;
  info.check = quest.check;
  return info;
};

brain.getQuestFromTransactionDescription = function(description) {
  let data;
  try {
    data = JSON.parse(description);
  } catch (e) {
    brain.debugLog('quests', 'Quest transaction: Can not parse');
    return false;
  }
  if (data === null) {
    brain.debugLog('quests', 'Quest transaction: No type');
    return false;
  }
  console.log(JSON.stringify(data));
  for (const key of ['type', 'room', 'id']) {
    if (!data[key]) {
      brain.debugLog('quests', `Incoming transaction no Quest: No ${key}`);
      return false;
    }
  }
  if (data.type !== 'Quest') {
    brain.debugLog('quests', 'Quest transaction: Type not quest');
    return false;
  }
  return data;
};

brain.checkQuestForAcceptance = function(transaction) {
  Memory.quests = Memory.quests || {};
  const data = brain.getQuestFromTransactionDescription(transaction.description);
  if (!data) {
    return false;
  }
  if (Memory.quests[data.id]) {
    console.log(`Quest already ongoing ${JSON.stringify(data)}`);
    return;
  }
  const quest = brain.getQuest(transaction, data);
  console.log(`Found quest acceptance on transaction ${JSON.stringify(quest)}`);

  Memory.quests[data.id] = quest;

  const response = {
    type: 'Accept',
    id: quest.id,
    room: quest.room,
    quest: quest.quest,
    end: quest.end,
  };
  const room = Game.rooms[transaction.to];
  console.log(`Accept quest: ${JSON.stringify(response)}`);
  const terminalResponse = room.terminal.send(RESOURCE_ENERGY, 100, transaction.from, JSON.stringify(response));
  console.log(`terminalResponse ${JSON.stringify(terminalResponse)}`);
};
