'use strict';

if (config.visualizer.enabled) {
  try {
    var Visual = require('visual');
  } catch (e) {
    console.log('Visual not found, please disable config option or copy visual.js from screeps-visual');
    config.visualizer.enabled = false;
  }
}
if (config.visualizer.enabled) {
  global.visualizer = {
    // Draws path types configured in config.visualizer
    showPaths: function() {
      let colors = [];
      let COLOR_BLACK = colors.push('#000000') - 1;
      let COLOR_RED = colors.push('rgba(249,8,8,0.5)') - 1;
      let COLOR_WHITE = colors.push('rgba(255,255,255,0.5)') - 1;
      _.each(Game.rooms, (room, name) => {
        let visual = new Visual(name);
        visual.defineColors(colors);
        visual.setLineWidth = 0.5;

        if (config.visualizer.showRoomPaths) {
          let paths = room.getMemoryPaths();
          if (paths.length !== 0 && config.visualizer.showRoomPaths) {
            _.each(paths, route => {
              visual.drawLine(route.path.map(p => ([p.x, p.y])), COLOR_WHITE, {
                lineWidth: 0.1
              });
            });
          }
        }

        if (config.visualizer.showCreepPaths) {
          _.each(Game.creeps, creep => {
            if (creep.room != room) {
              return;
            }
            let mem = creep.memory;
            if (mem._move) {
              let path = Room.deserializePath(mem._move.path);
              if (path.length) {
                visual.drawLine(path.map(p => ([p.x, p.y])), COLOR_RED, {
                  lineWidth: 0.1
                });
              }
            }
          });
        }
        visual.commit();
      });
      return true;
    },
    // TODO: TEST
    // Draws provided deserialized path -- untested
    showPath: function(path) {
      let visual = new Visual(path);
      let colors = [];
      let COLOR_RED = colors.push('rgba(249,8,8,0.5)') - 1;

      if (path.length) {
        visual.drawLine(path.path.map(p => ([p.x, p.y])), COLOR_RED, {
          lineWidth: 0.1
        });
        visual.commit();
        return true;
      }
      return false;
    },
    // TODO: TEST
    // Removes provided deserialized path from canvas -- untested
    hidePath: function(path) {
      let visual = new Visual(path);
      visual.commit();
      RawVisual.commit();
      return true;
    },

    // renders one frame, this frame will stay in memory and keep showing in the client until you restart it or run visualizer.clear()
    render: function() {
      if (!config.visualizer.refresh) {
        console.log('Visualizer rendering frame...');
      }
      if (!this.showPaths()) {
        return false;
      }
      RawVisual.commit();
      return true;
    },

    // clears the screen of roomPaths, not that this wont really do much if you have config.visualizer.refreh = true
    // TODO fix so it clears the paths drawn for creeps aswell, even ones gone from memory.
    clear: function() {
      console.log('Visualizer clearing frame.');
      _.each(Game.rooms, (room, name) => {
        let visual = new Visual(name);
        visual.commit();
      });
      RawVisual.commit();
      return true;
    },

    // Loads the screeps-visual script for the client
    run: function() {
      return console.log('<script>' +
        'if(!window.visualLoaded){' +
        '  $.getScript("https://screepers.github.io/screeps-visual/src/visual.screeps.user.js");' +
        '  window.visualLoaded = true;' +
        '}</script>');
    },
  };
}
