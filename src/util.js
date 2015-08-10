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
    for (let roomName of Memory.my_rooms) {
      let room = Game.rooms[roomName];
      if (room.terminal) {
        console.log(`${roomName} ${JSON.stringify(room.terminal.store)}`);
      }
    }
  }
};
