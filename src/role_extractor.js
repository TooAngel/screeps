'use strict';

/*
 * extractor gets minerals from the extractor
 *
 * Moves, harvest, brings to the terminal
 */

roles.extractor = {};

roles.extractor.boostActions = ['harvest', 'capacity'];

roles.extractor.settings = {
  layoutString: 'MCW',
  amount: [5, 1, 4],
  maxLayoutAmount: 5,
};

function executeExtractor(creep) {
  return creep.handleExtractor();
}

roles.extractor.action = executeExtractor;

roles.extractor.execute = executeExtractor;
