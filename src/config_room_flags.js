'use strict';

function check_for_source_or_wall(pos) {
  var look_items = pos.look();
  for (var look_item in look_items) {
    if (look_items[look_item].type == 'source') {
      return true;
    }
    if (look_items[look_item].type == 'terrain' &&
      look_items[look_item].terrain == 'wall') {
      return true;
    }
  }
  return false;
}

Room.prototype.setLinkPos = function(source, sourcerpos, i) {
  var name = this.name + '-link-' + i;

  var pos;
  if (Game.flags[name]) {
    return Game.flags[name].pos;
  }

  var links = this.find(FIND_STRUCTURES, {
    filter: function(object) {
      return object.structureType == STRUCTURE_LINK;
    }
  });
  if (links.length > i) {
    pos = links[i].pos;
    this.createFlag(pos.x, pos.y, name, COLOR_ORANGE);
    return pos;
  }

  var pos_offsets = [-1, 0, 1];
  for (var x_i in pos_offsets) {
    for (var y_i in pos_offsets) {
      if (x_i === 0 && y_i === 0) {
        continue;
      }
      pos = this.getPositionAt(sourcerpos.x + pos_offsets[x_i], sourcerpos.y + pos_offsets[y_i]);
      if (pos.x == source.pos.x && pos.y == source.pos.y) {
        continue;
      }
      if ((pos.x + pos.y) % 2 === 0) {
        continue;
      }
      if (pos.x == sourcerpos.x && pos.y == sourcerpos.y) {
        continue;
      }
      var range = pos.getRangeTo(source);
      if (range < 2) {
        continue;
      }
      if (!check_for_source_or_wall(pos)) {
        this.createFlag(pos.x, pos.y, name, COLOR_ORANGE);
        return pos;
      }
    }
  }
};

Room.prototype.setStoragePos = function(source, link_pos, sourcerpos) {
  var name = this.name + '-storage';
  if (Game.flags[name]) {
    return Game.flags[name].pos;
  }

  if (this.storage) {
    this.log(this.createFlag(this.storage.pos.x, this.storage.pos.y, name, COLOR_ORANGE));
    return this.storage.pos;
  }

  var pos_offsets = [-1, 0, 1];
  for (var x_i in pos_offsets) {
    for (var y_i in pos_offsets) {
      if (x_i === 0 && y_i === 0) {
        continue;
      }
      var pos = this.getPositionAt(sourcerpos.x + pos_offsets[x_i], sourcerpos.y + pos_offsets[y_i]);

      if ((pos.x + pos.y) % 2 === 0) {
        continue;
      }

      if (pos.x == source.pos.x && pos.y == source.pos.y) {
        continue;
      }
      if (pos.x == sourcerpos.x && pos.y == sourcerpos.y) {
        continue;
      }
      if (pos.x == link_pos.x && pos.y == link_pos.y) {
        continue;
      }
      var range = pos.getRangeTo(source);
      if (range < 2) {
        continue;
      }
      if (!check_for_source_or_wall(pos)) {
        var return_code = this.createFlag(pos.x, pos.y, name, COLOR_ORANGE);
        if (return_code == ERR_NAME_EXISTS) {
          var flag = Game.flags[name];
          if (flag.pos.x == pos.x && flag.pos.y == pos.y) {
            return pos;
          }
          flag.remove();
        }
        return pos;
      }
    }
  }
};

Room.prototype.setFillerPos = function(source, link_pos, storage_pos, sourcerpos) {
  var name = this.name + '-filler';
  if (Game.flags[name]) {
    return Game.flags[name].pos;
  }

  var pos_offsets = [-1, 0, 1];
  for (var x_i in pos_offsets) {
    for (var y_i in pos_offsets) {
      if (x_i === 0 && y_i === 0) {
        continue;
      }
      var pos = this.getPositionAt(storage_pos.x + pos_offsets[x_i], storage_pos.y + pos_offsets[y_i]);
      if ((pos.x + pos.y) % 2 === 1) {
        continue;
      }
      if (pos.x == source.pos.x && pos.y == source.pos.y) {
        continue;
      }
      if (pos.x == sourcerpos.x && pos.y == sourcerpos.y) {
        continue;
      }
      if (pos.x == link_pos.x && pos.y == link_pos.y) {
        continue;
      }
      var range = pos.getRangeTo(source);
      if (range < 2) {
        continue;
      }
      var range_link = pos.getRangeTo(link_pos);
      if (range_link > 1) {
        continue;
      }
      if (!check_for_source_or_wall(pos)) {
        var return_code = this.createFlag(pos.x, pos.y, name, COLOR_GREEN);
        if (return_code == ERR_NAME_EXISTS) {
          var flag = Game.flags[name];
          if (flag.pos.x == pos.x && flag.pos.y == pos.y) {
            return pos;
          }
          flag.remove();
        }
        return pos;
      }
    }
  }
};

Room.prototype.setSourcerPos = function(source, i) {
  var name = this.name + '-sourcer-' + (+i + 1);
  if (Game.flags[name]) {
    return Game.flags[name].pos;
  }

  var pos_offsets = [-1, 0, 1];
  for (var x_i in pos_offsets) {
    for (var y_i in pos_offsets) {
      var pos = this.getPositionAt(source.pos.x + pos_offsets[x_i], source.pos.y + pos_offsets[y_i]);
      if (!check_for_source_or_wall(pos)) {
        this.createFlag(pos.x, pos.y, name, COLOR_BLUE);
        return pos;
      }
    }
  }
};

Room.prototype.setBuilderPos = function(source) {
  var name = this.name + '-builder';
  var pos;
  if (Game.flags[name]) {
    pos = Game.flags[name].pos;
  } else {
    var pos_offsets = [-1, 0, 1];
    for (var x_i in pos_offsets) {
      for (var y_i in pos_offsets) {
        pos = this.getPositionAt(source.pos.x + pos_offsets[x_i], source.pos.y + pos_offsets[y_i]);
        if (!check_for_source_or_wall(pos)) {
          this.createFlag(pos.x, pos.y, name, COLOR_RED);
          break;
        }
      }
    }
  }

  var link_pos = this.setLinkPos(source, pos, 0);
  var storage_pos = this.setStoragePos(source, link_pos, pos);
  var filler_pos = this.setFillerPos(source, link_pos, storage_pos, pos);
};

Room.prototype.build = function() {
  var interval = 100;
  // To execute it in different ticks per room
  var offset = this.controller.pos.x + this.controller.pos.y + 1;

  var value = Game.time + offset;
  if ((value % interval) !== 0) {
    return false;
  }

  var sources = this.find(FIND_SOURCES);
  for (var i in sources) {
    var source = sources[i];
    // this.log(JSON.stringify(sources[i]))
    var pos = this.setSourcerPos(source, i);
    this.setLinkPos(source, pos, +i + 1);
  }

  this.setBuilderPos(this.controller);

  // this.log('build')
};
