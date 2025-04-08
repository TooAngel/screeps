'use strict';
global.visualizer = {

  drawPosition(rv, position, text, color) {
    rv.text(text, position.x, position.y + 0.2, {
      color: color,
      font: 0.7,
      opacity: 0.5,
    });
  },

  drawPath(rv, path, color) {
    if (path.length) {
      rv.poly(path.map((p) => [p.x, p.y]), {
        stroke: color,
        strokeWidth: 0.1,
        opacity: 0.5,
      });
    }
  },

  /**
   * draw fixed paths in room
   */
  showRoomPaths() {
    for (const room of _.values(Game.rooms)) {
      const rv = room.visual;
      const paths = room.getMemoryPaths();
      for (const route of _.values(paths)) {
        this.drawPath(rv, route.path, 'white');
      }
    }
  },

  /**
   * draw creep paths from using moveTo
   */
  showCreepPaths() {
    for (const creep of _.values(Game.creeps)) {
      const rv = creep.room.visual;
      if (creep.memory._move) {
        const path = Room.deserializePath(creep.memory._move.path);
        this.drawPath(rv, path, 'red');
      }
    }
  },

  /**
   * draw structures
   */
  showStructures() {
    for (const room of _.values(Game.rooms)) {
      if (!room.isMy()) {
        continue;
      }
      const rv = room.visual;
      if (room.memory.position && room.memory.position.structure) {
        const structures = room.memory.position.structure;
        for (const structType of Object.keys(structures)) {
          const text = structType.substr(0, 1).toUpperCase() + structType.substr(1, 1);
          for (const structure of structures[structType]) {
            if (!structure) {
              continue;
            }
            this.drawPosition(rv, structure, text, 'blue');
          }
        }
      }
    }
  },

  showBlockers() {
    for (const room of _.values(Game.rooms)) {
      if (!room.isMy()) {
        continue;
      }
      const rv = room.visual;
      if (room.memory.walls && room.memory.walls.layer) {
        for (const layer of Object.keys(room.memory.walls.layer)) {
          for (const pos of room.memory.walls.layer[layer]) {
            this.drawPosition(rv, pos, layer, 'blue');
            rv.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, {
              fill: 'transparent',
              stroke: 'blue',
            });
          }
        }
      }
      if (room.memory.walls && room.memory.walls.ramparts) {
        for (const pos of room.memory.walls.ramparts) {
          rv.circle(pos, {
            radius: 0.5,
            fill: 'transparent',
            stroke: 'blue',
          });
        }
      }
    }
  },

  /**
   * draw creep positions
   */
  showCreeps() {
    for (const room of _.values(Game.rooms)) {
      if (!room.isMy()) {
        continue;
      }
      const rv = room.visual;
      if (room.memory.position) {
        const creeps = room.memory.position.creep;
        for (const positionName of Object.keys(creeps)) {
          let text = positionName.substr(0, 1);
          const target = Game.getObjectById(positionName);
          if (target) {
            if (target.structureType) {
              text = target.structureType.substr(0, 1);
            } else {
              text = 's'; // source
            }
          }
          for (const creep of creeps[positionName]) {
            if (creep) {
              this.drawPosition(rv, creep, text, 'yellow');
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
          let fill = '#00FF00';
          const value = cm.get(x, y);
          const calculated = Math.min(255, 5 * value);
          if (config.visualizer.showCostMatrixValues) {
            this.drawPosition(rv, new RoomPosition(x, y, roomName), value, 'blue');
          }

          if (value) {
            fill = `#${(0.8 * calculated).toString(16)}0A0A`;
          }
          let opacity = 0;
          if (value > 0) {
            opacity = 0.15 + 0.3 * (calculated / 255);
          }
          rv.rect(x - 0.5, y - 0.5, 1, 1, {
            fill: fill,
            opacity: opacity,
          });
        }
      }
    }
  },

  showCostMatrices() {
    for (const room of _.values(Game.rooms)) {
      if (!room.isMy()) {
        continue;
      }
      if (room.isMy()) {
        this.showCostMatrix(room.name, room.getCostMatrixCallback());
      }
    }
  },

  showSearch(search) {
    if (search) {
      const rv = {};
      const getRV = (pos) => {
        if (!rv[pos.roomName]) {
          rv[pos.roomName] = new RoomVisual(pos.roomName);
        }
        return rv[pos.roomName];
      };
      let prevPos = search.path[0];
      const style = {
        color: search.incomplete ? 'red' : 'green',
      };
      for (const pi of search.path) {
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
    if (config.visualizer.showCostMatrices) {
      this.showCostMatrices();
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
  },
};

const getLines = function(room) {
  if (!room.controller) {
    return [];
  }
  const energy = (room.memory.energyStats && Math.floor(room.memory.energyStats.average)) ||
    room.energyAvailable;
  const storedE = room.storage ? room.storage.store[RESOURCE_ENERGY] : 0;
  const queueL = room.memory.queue ? room.memory.queue.length : 0;
  const rclP = Math.floor(100 * (room.controller.progressTotal ? room.controller.progress / room.controller.progressTotal : 1));

  const lines = [
    {label: `Energy Average :`, value: energy, coefficient: energy / room.energyCapacityAvailable},
    {label: `Stored Energy :`, value: storedE, coefficient: Math.min(storedE, 500000) / 500000},
    {label: `Queue length :`, value: queueL, coefficient: (20 - Math.min(queueL, 20)) / 20},
    {label: `RCL ${room.controller.level} progress :`, value: rclP, coefficient: rclP / 100},
  ];
  return lines;
};

global.visualizer.myRoomDataDraw = function(roomName) {
  const room = Game.rooms[roomName];
  const lines = getLines(room);

  const fontSize = 0.65;
  const color = (coefficient) => `rgb(${Math.floor(-(coefficient - 1) * 255)},${Math.floor(coefficient * 255)},0)`;

  let y = 0;
  let line;
  for (line of lines) {
    room.visual.text(line.label, 0.5, 0.75 + 2 * y * fontSize, {
      color: 'rgb(255,255,255)',
      font: fontSize,
      align: 'left',
    });
    if (line.value !== undefined) {
      room.visual.text(`${line.value}`, 6, 1.5 * fontSize + 2 * y * fontSize, {
        color: color(line.coefficient),
        font: fontSize * 2,
        align: 'left',
      });
    }
    y++;
  }
};
