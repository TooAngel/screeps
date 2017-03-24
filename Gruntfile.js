var localSync = [];
try {
  localSync = require('./.localSync');
} catch (e) {}

module.exports = function(grunt) {
  var account;
  try {
    account = require('./account.screeps.com');
  } catch (e) {
    account = {
      email: false,
      password: false
    };
  }

  grunt.loadNpmTasks('grunt-screeps');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-sync');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({
    screeps: {
      options: {
        email: process.env.email || account.email,
        password: process.env.password || account.password,
        branch: 'default',
        ptr: false
      },
      dist: {
        src: ['dist/*.js']
      }
    },
    jshint: {
      all: ['Gruntfile.js', 'src/*.js'],
      options: {
        jshintrc: true
      }
    },
    jsbeautifier: {
      files: ['Gruntfile.js', 'src/*.js'],
      options: {
        config: '.jsbeautifyrc'
      }
    },
    mochaTest: {
      src: ['test/**/*.js']
    },
    jscs: {
      src: 'src/*.js'
    },
    clean: ['dist/'],
    uglify: {
      my_target: {
        options: {
          compress: {
            global_defs: {
              'MINIFIED': true
            },
            dead_code: true
          }
        },
        files: {
          'dist/main.js': [
            'src/config.js',
            'src/config_local.js',
            'src/config_logging.js',
            'src/config_brain_memory.js',
            'src/config_brain_nextroom.js',
            'src/config_brain_squadmanager.js',
            'src/config_creep.js',
            'src/config_creep_resources.js',
            'src/config_creep_fight.js',
            'src/config_creep_harvest.js',
            'src/config_creep_mineral.js',
            //            'src/config_creep_move.js',
            'src/config_creep_routing.js',
            //            'src/config_creep_startup_tasks.js',
            'src/config_roomPosition_structures.js',
            'src/config_room.js',
            'src/config_room_basebuilder.js',
            'src/config_room_controller.js',
            'src/config_room_defense.js',
            'src/config_room_market.js',
            'src/config_room_mineral.js',
            'src/config_room_not_mine.js',
            'src/config_room_external.js',
            'src/config_room_flags.js',
            'src/config_room_routing.js',
            'src/config_room_wallsetter.js',
            'src/config_string.js',
            'src/main.js'
          ]
        }
      }
    },
    copy: {
      main: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: [
            '**',
            '!main.js',
            '!require.js',
            '!config.js',
            '!config_logging.js',
            '!config_brain_memory.js',
            '!config_brain_nextroom.js',
            '!config_brain_squadmanager.js',
            '!config_creep.js',
            '!config_creep_resources.js',
            '!config_creep_fight.js',
            '!config_creep_harvest.js',
            '!config_creep_mineral.js',
            //            '!config_creep_move.js',
            '!config_creep_routing.js',
            //            '!config_creep_startup_tasks.js',
            '!config_roomPosition_structures.js',
            '!config_room.js',
            '!config_room_basebuilder.js',
            '!config_room_controller.js',
            '!config_room_defense.js',
            '!config_room_market.js',
            '!config_room_mineral.js',
            '!config_room_not_mine.js',
            '!config_room_external.js',
            '!config_room_flags.js',
            '!config_room_routing.js',
            '!config_room_wallsetter.js',
            '!config_string.js'
          ],
          dest: 'dist/',
        }, {
          expand: true,
          cwd: 'node_modules/screeps-profiler',
          src: ['screeps-profiler.js'],
          dest: 'dist/'
        }, {
          expand: true,
          cwd: 'screeps-elk/js',
          src: ['utils.logger.js'],
          dest: 'dist/'
        }]
      },
      uglify: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: [
            'main.js',
            'require.js',
            'config.js',
            'config_logging.js',
            'config_brain_memory.js',
            'config_brain_nextroom.js',
            'config_brain_squadmanager.js',
            'config_creep.js',
            'config_creep_resources.js',
            'config_creep_fight.js',
            'config_creep_harvest.js',
            'config_creep_mineral.js',
            //            'config_creep_move.js',
            'config_creep_routing.js',
            //            'config_creep_startup_tasks.js',
            'config_roomPosition_structures.js',
            'config_room.js',
            'config_room_basebuilder.js',
            'config_room_controller.js',
            'config_room_defense.js',
            'config_room_market.js',
            'config_room_mineral.js',
            'config_room_not_mine.js',
            'config_room_external.js',
            'config_room_flags.js',
            'config_room_routing.js',
            'config_room_wallsetter.js',
            'config_string.js'
          ],
          dest: 'dist/',
        }]
      },
      profiler: {
        files: [{
          expand: true,
          cwd: 'node_modules/screeps-profiler/',
          src: [
            'screeps-profiler.js'
          ],
          dest: 'dist/',
        }]
      },
      visualizer: {
        files: [{
          expand: true,
          cwd: 'screeps-visual/',
          src: [
            'visual.js'
          ],
          dest: 'dist/',
        }]
      }
    },

    sync: {
      main: {
        files: localSync,
        updateAndDelete: true,
        verbose: true,
        compareUsing: 'md5'
      },
    }
  });

  grunt.registerTask('default', ['jshint', 'jsbeautifier', 'jscs', 'clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'copy:visualizer', 'screeps']);
  grunt.registerTask('release', ['jshint', 'jsbeautifier', 'jscs', 'clean', 'uglify', 'copy:main', 'requireFile', 'sync']);
  grunt.registerTask('local', ['jshint', 'jsbeautifier', 'jscs', 'clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'copy:visualizer', 'sync']);
  grunt.registerTask('test', ['jshint', 'jscs']);
  grunt.registerTask('dev', ['jshint', 'jsbeautifier', 'jscs']);
  grunt.registerTask('requireFile', 'Creates an empty file', function() {
    grunt.file.write('dist/require.js', '');
  });
};
