'use strict';
/**
 *
 * Paths by nodes module.
 * require it from your main
 * importants Room methods :
 * - .init() for init them when a room is discover. Path are memorized into
 *      room.memory.paths following above structure.
 * - .update() for dynamicly update roads type using used property.
 *
 * important Creep methods
 * - .get(target: roomPos/object/id, fullPath: bool) return segment actually
        creep is on or full path if fullPath is true,
 *
 */

////////////////////////////////////////////////////////////////////////////////
//e.g. paths structure :
// paths = {};
//paths.E1 = undefined;
//paths.E2 = {path: pathE2, used: 0};
//paths.E3 = {path: pathN1toE3, used: 0, node: [E2, 3]};
//paths.E4 = {path: pathE4, used: 0};
//paths.S1 = {path: pathN2toS1, used: 0, parentNode: [E2, 2]};
//paths.S2 = {path: pathN3toS2, used: 0, parentNode: [E4, 5]};
//paths.S3 = undefined;
//paths.M = {path: pathN4toM, used: 0, parentNode: [S2, 2]};
//
//paths.list = [['E2', 'E4'], ['E3', 'S1', 'S2'], ['M']];
//
// Roads types (road types dynamicly change depending of segment call amount):
// dirt: no road, path erased from memory, keep used property and parent node.
//        if segment is needed, path is newly generated but not memorized,
// alley: use road only on swamp terrain,
// street: use road on all segment,
// express: double the road,
//
////////////////////////////////////////////////////////////////////////////////

Room.prototype.getExits = function() {
  let exits = {};
  let exitTiles;
  let dir = 1;
  let dirs = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];
  for (dir; dir <= 4; dir++) {
    exitTiles = this.find(dirs[dir - 1]);
    if (exitTiles.length > 0) {
      exits['E' + dir] = exitTiles[Math.floor(exitTiles.length / 2)];
    }
  }
  return exits;
};

Room.prototype.getSources = function() {
  let sources = this.find(FIND_SOURCES);
  let id = 1;
  let newSources = {};
  for (id; id <= 3; id++) {
    if (sources[id - 1]) {
      newSources['S' + id] = sources[id - 1].id;
    }
  }
  return newSources;
};

Room.prototype.getMineral = function() {
  return {M: this.find(FIND_MINERALS)[0]};
};

RoomPosition.prototype.getInternPath = function(target) {
  let range;
  if (_.isString(target)) {
    range = 1;
    target = Game.getObjectById(target).pos;
  } else if (target instanceof RoomPosition) {
    range = 0;
  }
  if (!target || target.room != this.room) {
    return false;
  }
  console.log(JSON.stringify(target));
  return PathFinder.search(
    this, {
      pos: target,
      range: range,
    }, {
      swampCost: config.layout.swampCost,
      plainCost: config.layout.plainCost
    }
  ).path;

};

Room.prototype.formatPath = function(path, pathName) {
  let searchParent = (deep) => {
    let paths = this.memory.paths;
    let pathsNames = paths.list[deep];
    let pathsAmount = pathsNames ? pathsNames.length : 0;
    let p = 0;
    console.log(deep, ' - - - ', JSON.stringify(pathsNames));
    while (p < pathsAmount) {
      if (_.eq(path[pos], paths[pathsNames[p]].path[0])) {
        return pathsNames[p];
      }
      p++;
    }
    return false;
  }

  if (!path) {
      return false;
  }

  let finish = false;
  let parentEnd = false;
  let deep = 0;
  let pos = 0;
  let parentPos;
  let newPath = [];
  let actualParentName;
  let previousParentName;
  let previousParentPos;
  let paths = this.memory.paths;

  while (!finish) {
    actualParentName = searchParent(deep);

    if (actualParentName) {
      deep++;
      parentPos = 0;
      parentEnd = false;
      while (!parentEnd) {
        //console.log(JSON.stringify(paths[actualParentName].path[parentPos]));
        //console.log(JSON.stringify(path[pos]));
        if (!path[pos] || !_.eq(path[pos], paths[actualParentName].path[parentPos])) {
          parentEnd = true;
          previousParentName = actualParentName;
        }
        pos++;
        parentPos++;

      }
    } else {
      while (path[pos]) {
        newPath.push(path[pos]);
        pos++;
      }
      finish = true;
    }
  }

  this.memory.paths.list[deep] = this.memory.paths.list[deep] || []
  this.memory.paths.list[deep].push(pathName);
  this.memory.paths[pathName] = { path: newPath, parentNode: [previousParentName, parentPos]};
};

Room.prototype.init = function() {
  let controller = this.controller;
  if (!controller) {
    return false;
  }
  this.memory.paths = {list: []};
  let exits = this.getExits();      // should return {E2: E2pos, E3: E3pos, E4: E4pos}
  let sources = this.getSources();  // same
  let mineral = this.getMineral();  // same
  let n = 0;
  let path;

  while (n < 8) {
      console.log(n);
    if(n < 4) {
      path = controller.pos.getInternPath(exits['E' + (n + 1)]);
      this.formatPath(path, 'E' + (n + 1));
    } else if (n < 7) {
      path = controller.pos.getInternPath(sources['S' + (n - 3)]);
      this.formatPath(path, 'S' + (n - 3));
    } else {
      path = controller.pos.getInternPath(mineral['M']);
      this.formatPath(path, 'M');
    }
    n++;

  }
}
