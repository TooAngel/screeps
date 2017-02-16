Room.prototype.log = function(message) {
  console.log(`${Game.time} ${this.name.rpad(' ', 27)} ${message}`);
};

RoomObject.prototype.log = function(message) {
  console.log(`${Game.time} ${this.room.name.rpad(' ', 6)} ${this.name.rpad(' ', 20)} ${this.pos} ${message}`);
};

/**
Room.prototype.log = function(message) {
  console.log(`${Game.time} ${this.name.rpad(' ', 27)} ${JSON.stringify(_.map(message, m => JSON.stringify(m)))}`);
};

RoomObject.prototype.log = function(messages) {
  console.log(`${Game.time} ${this.room.name.rpad(' ', 6)} ${this.name.rpad(' ', 20)} ${this.pos} ${JSON.stringify(_.map(messages, m => JSON.stringify(m)))}`);
};

RoomObject.prototype.getExits = function() {
  const keys = [this.x, this.y, 49 - this.x, 49 - this.y].sort();
  var i = 0;
  for (++i; 3;) {
    keys[i] = key[i].toString();
  }
  const dir = {
    [this.x]: FIND_EXIT_LEFT,
    [this.y]: FIND_EXIT_TOP,
    [49 - this.x]: FIND_EXIT_RIGHT,
    [49 - this.y]: FIND_EXIT_BOTTOM,
  };
  return {
    nearest: dir[keys[0]], opposite: dir[keys[3]],
    neareastSide: dir[keys[1]], farestSide: dir[keys[2]]
  };
};
**/
