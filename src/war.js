'use strict';

module.exports = {

  // E12S9, E7S6, E19S4 => E9N5
  // E27N12, E12N3 => E9N8
  // E3N19 => E4N17

  attacker: function(name) {
    Game.rooms[name].memory.queue.push({
      role: 'attacker'
    });
    Game.rooms[name].log(JSON.stringify(Game.rooms[name].memory.queue));
  },

  wave: function() {
    var rooms = [
      //    		'E12S9',
      //    		'E7S6',
      //    		'E19S4',
      //    		'E27N12',
      //    		'E12N3',
      //    		'E3N19',
      //    		'W8S9'
    ];
    for (var i in rooms) {
      var name = rooms[i];
      if (Game.rooms[name].storage.store.energy > 15000) {
        Game.rooms[name].memory.queue.push({
          role: 'attacker'
        });
        Game.rooms[name].log(JSON.stringify(Game.rooms[name].memory.queue));
      }
    }
  }
};
