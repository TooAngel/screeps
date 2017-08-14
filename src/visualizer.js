'use strict';

if (config.visualizer.enabled) {
  global.visualizer = {

    drawPosition(rv, position, text, color) {
      rv.text(text, position.x, position.y + 0.2, {
        color: color,
        font: 0.7,
        opacity: 0.5
      });
    },

    drawPath(rv, path, color) {
      if (path.length) {
        rv.poly(path.map(p => [p.x, p.y]), {
          stroke: color,
          strokeWidth: 0.1,
          opacity: 0.5
        });
      }
    },

    /**
     * draw fixed paths in room
     */
    showRoomPaths() {
      for (let room of _.values(Game.rooms)) {
        const rv = room.visual;
        let paths = room.getMemoryPaths();
        for (let route of _.values(paths)) {
          this.drawPath(rv, route.path, 'white');
        }
      }
    },

    /**
     * draw creep paths from using moveTo
     */
    showCreepPaths() {
      for (let creep of _.values(Game.creeps)) {
        const rv = creep.room.visual;
        if (creep.memory._move) {
          let path = Room.deserializePath(creep.memory._move.path);
          this.drawPath(rv, path, 'red');
        }
      }
    },

    /**
     * draw structures
     */
    showStructures() {
      for (let room of _.values(Game.rooms)) {
        const rv = room.visual;
        if (room.memory.position && room.memory.position.structure) {
          let structures = room.memory.position.structure;
          for (let structType of Object.keys(structures)) {
            let text = structType.substr(0, 1).toUpperCase() + structType.substr(1, 1);
            for (let structure of structures[structType]) {
              this.drawPosition(rv, structure, text, 'blue');
            }
          }
        }
      }
    },

    showBlockers() {
      for (let room of _.values(Game.rooms)) {
        const rv = room.visual;
        if (room.memory.walls && room.memory.walls.layer) {
          for (let layer of Object.keys(room.memory.walls.layer)) {
            for (let pos of room.memory.walls.layer[layer]) {
              this.drawPosition(rv, pos, layer, 'blue');
              rv.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, {
                fill: 'transparent',
                stroke: 'blue'
              });
            }
          }
        }
        if (room.memory.walls && room.memory.walls.ramparts) {
          for (let pos of room.memory.walls.ramparts) {
            rv.circle(pos, {
              radius: 0.5,
              fill: 'transparent',
              stroke: 'blue'
            });
          }
        }
      }
    },

    /**
     * draw creep positions
     */
    showCreeps() {
      for (let room of _.values(Game.rooms)) {
        const rv = room.visual;
        if (room.memory.position) {
          let creeps = room.memory.position.creep;
          for (let positionName of Object.keys(creeps)) {
            if (creeps[positionName]) {
              if (creeps[positionName].x || creeps[positionName].y) {
                let text = positionName.substr(0, 1);
                this.drawPosition(rv, creeps[positionName], text, 'yellow');
              } else {
                let text = positionName.substr(0, 1);
                for (let towerfiller of creeps[positionName]) {
                  this.drawPosition(rv, towerfiller, text, 'yellow');
                }
              }
            }
          }
        }
      }
    },

    showCostMatrix(roomName, costMatrixCallback) {
      const rv = new RoomVisual(roomName);
      const cm = costMatrixCallback(roomName);
      if (cm) {
        for (let x = 0; x < 50; ++x) {
          for (let y = 0; y < 50; ++y) {
            rv.rect(x - 0.5, y - 0.5, 1, 1, {
              fill: 'pink',
              opacity: Math.pow(cm.get(x, y) / 255, 1 / 4)
            });
          }
        }
      }
    },

    showCostMatrixes() {
      for (let room of _.values(Game.rooms)) {
        this.showCostMatrix(room.name, room.getCostMatrixCallback());
      }
    },

    showSearch(search) {
      if (search) {
        const rv = {};
        const getRV = pos => {
          if (!rv[pos.roomName]) {
            rv[pos.roomName] = new RoomVisual(pos.roomName);
          }
          return rv[pos.roomName];
        };
        let prevPos = search.path[0];
        let style = { color: search.incomplete ? 'red' : 'green' };
        for (let pi of search.path) {
          if (prevPos.roomName === pi.roomName) {
            getRV(pi).line(prevPos, pi, style);
          } else {
            const dx = prevPos.x === 0 ? -0.5 : prevPos.x === 49 ? 0.5 : 0;
            const dy = prevPos.y === 0 ? -0.5 : prevPos.y === 49 ? 0.5 : 0;
            getRV(prevPos).line(prevPos.x, prevPos.y, prevPos.x + dx, prevPos.y + dy, style);
            getRV(pi).line(pi.x, pi.y, pi.x - dx, pi.y - dy, style);
          }
          prevPos = pi;
        }
      }
    },

    render() {
      if (config.visualizer.showCostMatrixes) {
        this.showCostMatrixes();
      }
      if (config.visualizer.showRoomPaths) {
        this.showRoomPaths();
      }
      if (config.visualizer.showCreepPaths) {
        this.showCreepPaths();
      }
      if (config.visualizer.showStructures) {
        this.showStructures();
      }
      if (config.visualizer.showCreeps) {
        this.showCreeps();
      }
      if (config.visualizer.showBlockers) {
        this.showBlockers();
      }
    }
  };
}
