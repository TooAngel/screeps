const {debugLog} = require('./logging');

/**
 * checkAppliedQuestForAcceptance
 *
 * @param {object} transaction
 * @return {bool}
 */
function checkAppliedQuestForAcceptance(transaction) {
  try {
    const response = JSON.parse(transaction.description);
    if (!response) {
      debugLog('quests', `No JSON.parse response: ${transaction.description}`);
    }
    if (!response.type) {
      debugLog('quests', `No type: ${JSON.stringify(response)}`);
    }
    if (response.type !== 'quest') {
      debugLog('quests', `Wrong type: ${JSON.stringify(response)}`);
      return false;
    }
    if (response.action) {
      debugLog('quests', `Action exist: ${JSON.stringify(response)}`);
      return false;
    }
    debugLog('quests', `Quest accept transaction: ${JSON.stringify(response)}`);
    if (!haveActiveQuest()) {
      debugLog('quests', 'No active quest');
      return false;
    }
    global.data.activeQuest.state = 'active';
    global.data.activeQuest.accept = response;
    debugLog('quests', `activeQuest: ${JSON.stringify(global.data.activeQuest)}`);
    if (global.data.activeQuest.accept.quest === 'buildcs') {
      debugLog('quests', `Should handle buildcs quest and spawn role_questplayer`);
    }
    return true;
  } catch (e) {
    console.log('checkAppliedQuestForAcceptance');
    console.log(e);
    console.log(e.stack);
    return false;
  }
}
module.exports.checkAppliedQuestForAcceptance = checkAppliedQuestForAcceptance;

/**
 * haveActiveQuest
 *
 * Check if we have an active quest as player
 *
 * @return {bool}
 */
function haveActiveQuest() {
  if (!global.data.activeQuest) {
    return false;
  }
  if (global.data.activeQuest.state === 'applied' &&
    global.data.activeQuest.tick + 10 < Game.time) {
    debugLog('quests', 'Applied but too old, no response');
    delete global.data.activeQuest;
    return false;
  }
  if (global.data.activeQuest.quest.end < Game.time) {
    delete global.data.activeQuest;
    return false;
  }
  return true;
}

module.exports.haveActiveQuest = haveActiveQuest;
