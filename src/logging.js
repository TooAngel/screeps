Room.prototype.log = function(message) {
  console.log(`${this.name.rpad(' ', 27)} ${message}`);
};

RoomObject.prototype.log = function(message) {
  console.log(`${this.room.name.rpad(' ', 6)} ${this.name.rpad(' ', 20)} ${message}`);
};
