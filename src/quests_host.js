

const {debugLog} = require('./logging');
const {splitRoomName} = require('./prototype_room_utils');

/**
 * handleQuests
 *
 * Checks the current quests, send a quester in case, or ends the quest
 */
function handleQuests() {
  Memory.quests = Memory.quests || {};
  for (const id of Object.keys(Memory.quests)) {
    const quest = Memory.quests[id];

    if (!quest.checked && quest.check < Game.time) {
      debugLog('quests', `Spawn quester: ${JSON.stringify(quest)}`);
      Memory.quests[id].checked = true;
      Game.rooms[quest.origin].checkRoleToSpawn('quester', 1, undefined, quest.room, quest.id, quest.origin);
    }

    if (quest.end < Game.time) {
      debugLog('quests', `handleQuests quest ended: ${JSON.stringify(quest)}`);
      delete Memory.quests[id];
    }
  }
}

module.exports.handleQuests = handleQuests;


/**
 * checkQuestForAcceptance
 *
 * @param {object} transaction
 * @return {bool}
 */
function checkQuestForAcceptance(transaction) {
  Memory.quests = Memory.quests || {};
  const data = getQuestFromTransactionDescription(transaction.description);
  if (!data) {
    return false;
  }
  if (Memory.quests[data.id]) {
    console.log(`Quest already ongoing ${JSON.stringify(data)}`);
    return;
  }
  const quest = getQuest(transaction, data);
  console.log(`Found quest acceptance on transaction ${JSON.stringify(quest)}`);

  Memory.quests[data.id] = quest;

  const response = {
    type: 'quest',
    id: quest.id,
    room: quest.room,
    quest: quest.quest,
    end: quest.end,
  };
  const room = Game.rooms[transaction.to];
  console.log(`Send accept quest: ${JSON.stringify(response)}`);
  const terminalResponse = room.terminal.send(RESOURCE_ENERGY, 100, transaction.from, JSON.stringify(response));
  console.log(`terminalResponse ${JSON.stringify(terminalResponse)}`);
  // TODO find reserver in room and remove quest hint
}
module.exports.checkQuestForAcceptance = checkQuestForAcceptance;

/**
 * getQuestRoom
 *
 * Finds a room close by `roomName`
 *
 * @param {string} roomName
 */
function getQuestRoom(roomName) {
  const parts = splitRoomName(roomName);
  debugLog('quests', `getQuestRoom parts: ${JSON.stringify(parts)}`);
  for (let x=-3; x<=3; x++) {
    const xvalue = x + parseInt(parts[2], 10);
    const roomName = `${parts[1]}${xvalue}${parts[3]}${parts[4]}`;
    debugLog('quests', `getQuestRoom roomName: ${roomName}`);
  }
}

/**
 * getQuestBuildConstructionSite
 *
 * @param {object} data
 * @param {string} roomName
 * @return {object}
 */
function getQuestBuildConstructionSite(data, roomName) {
  debugLog('quests', `getQuestBuildConstructionSite(${JSON.stringify(data)})`);
  const quest = {};
  quest.room = getQuestRoom(roomName); // TODO a room needs to be selected where to build the construction sites
  quest.quest = 'buildcs';
  quest.end = Game.time + 15000;
  quest.check = Game.time + 0;
  return quest;
}

/**
 * getQuest
 *
 * @param {object} transaction
 * @param {object} data
 * @return {object}
 */
function getQuest(transaction, data) {
  const info = {};
  info.id = data.id;
  info.player = {
    name: transaction.sender.username,
    room: transaction.from,
  };
  info.origin = transaction.to;

  const quest = getQuestBuildConstructionSite(data, transaction.from);

  info.room = quest.room;
  info.quest = quest.quest;
  info.end = quest.end;
  info.check = quest.check;
  return info;
}

/**
 * getQuestFromTransactionDescription
 *
 * @param {object} description
 * @return {bool}
 */
function getQuestFromTransactionDescription(description) {
  let data;
  try {
    data = JSON.parse(description);
  } catch (e) {
    debugLog('quests', 'Quest transaction: Can not parse');
    return false;
  }
  if (data === null) {
    debugLog('quests', 'Quest transaction: No type');
    return false;
  }
  for (const key of ['type', 'action', 'id']) {
    if (!data[key]) {
      debugLog('quests', `Incoming transaction no Quest: No ${key}`);
      return false;
    }
  }
  if (data.type !== 'quest') {
    debugLog('quests', 'Quest transaction: Type not quest');
    return false;
  }
  if (data.action !== 'apply') {
    debugLog('quests', 'Quest transaction: action not apply');
    return false;
  }
  return data;
}

