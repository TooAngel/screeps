'use strict';
global.visualizer = {};
if (config.visualizer.enabled) {
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
        const rv = room.visual;
        if (room.memory.position && room.memory.position.structure) {
          const structures = room.memory.position.structure;
          for (const structType of Object.keys(structures)) {
            const text = structType.substr(0, 1).toUpperCase() + structType.substr(1, 1);
            for (const structure of structures[structType]) {
              this.drawPosition(rv, structure, text, 'blue');
            }
          }
        }
      }
    },

    showBlockers() {
      for (const room of _.values(Game.rooms)) {
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
        const rv = room.visual;
        if (room.memory.position) {
          const creeps = room.memory.position.creep;
          for (const positionName of Object.keys(creeps)) {
            if (creeps[positionName]) {
              if (creeps[positionName].x || creeps[positionName].y) {
                let text = positionName.substr(0, 1);
                const target = Game.getObjectById(positionName);
                if (target) {
                  if (target.structureType) {
                    text = target.structureType.substr(0, 1);
                  } else {
                    text = 's'; // source
                  }
                }
                this.drawPosition(rv, creeps[positionName], text, 'yellow');
              } else {
                const text = positionName.substr(0, 1); // always 't'
                for (const towerfiller of creeps[positionName]) {
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
              opacity: Math.pow(cm.get(x, y) / 255, 1 / 4),
            });
          }
        }
      }
    },

    showCostMatrixes() {
      for (const room of _.values(Game.rooms)) {
        this.showCostMatrix(room.name, room.getCostMatrixCallback());
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
    },
  };
}

global.visualizer.myRoomDatasDraw = function(roomName) {
  const fontSize = 0.65;
  const room = Game.rooms[roomName];
  const energy = (room.memory.energyStats && Math.floor(room.memory.energyStats.average)) ||
    room.energyAvailable;
  const storedE = room.storage ? room.storage.store[RESOURCE_ENERGY] : 0;
  const queueL = room.memory.queue ? room.memory.queue.length : 0;
  const rclP = Math.floor(100 * (room.controller.progressTotal ? room.controller.progress / room.controller.progressTotal : 1));

  const color = (coeff) => `rgb(${Math.floor(-(coeff - 1) * 255)},${Math.floor(coeff * 255)},0)`;
  const lines = [
    {label: `Energy Average :`, value: energy, coeff: energy / room.energyCapacityAvailable},
    {label: `Stored Energy :`, value: storedE, coeff: Math.min(storedE, 500000) / 500000},
    {label: `Queue length :`, value: queueL, coeff: (20 - Math.min(queueL, 20)) / 20},
    {label: `RCL ${room.controller.level} progress :`, value: rclP, coeff: rclP / 100},
  ];
  if (config.stats.summary && Memory.summary) {
    const rclSpeed = Math.floor(room.memory.upgraderUpgrade / (Game.time % 100 || 1));
    lines.push({label: `RCL speed:`, value: rclSpeed, coeff: rclSpeed / 50});
  }
  if (room.memory.queue.length) {
    const lowestInQueue = [
      _.chain(room.memory.queue).sortBy((creep) => creep.ttl).value()[0],
      room.memory.queue[0],
    ];
    const labels = ['ttl', 'priority'];
    let lowest;
    for (let id = 0; id < 2; id++) {
      lowest = lowestInQueue[id];
      lines.push({label: `Lowest ${labels[id]}: ${lowest.role} --> ${(lowest.routing && lowest.routing.targetRoom) || '?'} | TTL: ${lowest.ttl || '?'}`});
    }
  }
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
        color: color(line.coeff),
        font: fontSize * 2,
        align: 'left',
      });
    }
    y++;
  }

  if (config.stats.summary && Memory.summary) {
    const highterQueue = _.chain(Memory.myRooms)
      .map((roomName) => ({
        roomName: roomName,
        length: (Memory.rooms[roomName] && Memory.rooms[roomName].queue) ?
          -Memory.rooms[roomName].queue.length :
          0,
      }))
      .sortBy('length')
      .value()[0];
    const output = `=========================
      Game time: ${Game.time}
      Progress: ${(Game.gcl.progress - Memory.progress) / 100}/${Memory.myRooms.length * 15}
      ConstructionSites: ${Object.keys(Memory.constructionSites).length}
      -------------------------
      No storage: ${Memory.summary.storageNoString}
      Low storage: ${Memory.summary.storageLowString}
      Middle storage: ${Memory.summary.storageMiddleString}
      High storage: ${Memory.summary.storageHighString}
      -------------------------
      Power storage: ${Memory.summary.storagePower}
      -------------------------
      Upgrade less: ${Memory.summary.upgradeLess}
      -------------------------
      Highter queue: ${highterQueue.roomName}:${-highterQueue.length}
      =========================`;
    const lines = output.split('\n');
    let summaryCenterX = 25;
    let summaryTopLineY = 25;
    if (Memory.rooms[roomName].summaryCenter) {
      summaryCenterX = Math.min(Math.max(Memory.rooms[roomName].summaryCenter.x, 5), 44);
      const summaryHeight = lines.length * (fontSize - 0.05);
      summaryTopLineY = Memory.rooms[roomName].summaryCenter.y - summaryHeight / 2 + (fontSize - 0.05);
      summaryTopLineY = Math.min(Math.max(summaryTopLineY, 1), 49 - summaryHeight + (fontSize - 0.05));
    }

    for (let l = 0; l < lines.length; l++) {
      room.visual.text(lines[l], summaryCenterX, summaryTopLineY + (l * (fontSize - 0.05)), {font: fontSize});
    }
  }
};
