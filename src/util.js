module.exports = {
  roomCheck: function() {
    for (let roomName in Memory.rooms) {
      if (Memory.rooms[roomName].state == 'Occupied') {
        console.log(`${roomName} ${Memory.rooms[roomName].player}`);
      }
    }
  },

  terminals: function() {
    console.log('Terminals:');
    for (let roomName of Memory.myRooms) {
      let room = Game.rooms[roomName];
      if (room.terminal) {
        console.log(`${roomName} ${JSON.stringify(room.terminal.store)}`);
      }
    }
  },

  csstats: function() {
    let aggregate = function(result, value, key) {
      result[value.pos.roomName] = (result[value.pos.roomName] || (result[value.pos.roomName] = 0)) + 1;
      return result;
    };
    let resultReduce = _.reduce(Game.constructionSites, aggregate, {});
    console.log(JSON.stringify(resultReduce));
  }

};
