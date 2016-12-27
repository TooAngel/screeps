Room.prototype.log = function(message) {
  console.log(`${Game.time} ${this.name.rpad(' ', 27)} ${message}`);
};

RoomObject.prototype.log = function(message) {
  console.log(`${Game.time} ${this.room.name.rpad(' ', 6)} ${this.name.rpad(' ', 20)} ${this.pos} ${message}`);
};
