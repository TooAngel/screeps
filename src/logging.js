Room.prototype.log = function(...messages) {
  console.log(`${Game.time} ${this.name.rpad(' ', 27)} ${messages.join(' ')}`);
};

RoomObject.prototype.log = function(...messages) {
  console.log(`${Game.time} ${this.room.name.rpad(' ', 6)} ${this.name.rpad(' ', 20)} ${this.pos} ${messages.join(' ')}`);
};
