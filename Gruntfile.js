let localSync = [];
try {
  localSync = require('./.localSync'); // eslint-disable-line global-require
} catch (e) {
  // empty
}

module.exports = function(grunt) {
  let account;
  try {
    account = require('./account.screeps.com'); // eslint-disable-line global-require
  } catch (e) {
    account = {
      email: false,
      password: false,
    };
  }

  let account_local;
  try {
    account_local = require('./account_local.screeps.com')
  } catch (e) {
    account_local = {
      email: false,
      password: false,
    };
  }

  grunt.loadNpmTasks('grunt-screeps');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-sync');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-exec');

  grunt.initConfig({
    screeps: {
      main: {
        options: {
          email: process.env.email || account.email,
          password: process.env.password || account.password,
          branch: 'default',
          ptr: false,
        },
        files: [
          {
            src: ['dist/*.js'],
          }
        ],
      },
      local: {
        options: {
          email: account_local.email,
          password: account_local.password,
          branch: account_local.branch,
          ptr: false,
          server: {
            http: account_local.http,
            port: account_local.port,
            host: account_local.host,
          }
        },
        files: [
          {
            src: ['dist/*.js'],
          }
        ],
      }
    },
    mochaTest: {
      src: ['test/**/*.js'],
    },
    eslint: {
      check: {
        src: 'src/*.js',
      },
      fix: {
        src: 'src/*.js',
        options: {
          fix: true,
        },
      },
    },
    clean: ['dist/'],
    uglify: {
      my_target: {
        options: {
          compress: {
            global_defs: {
              'MINIFIED': true,
            },
            dead_code: true,
          },
        },
        files: {
          'dist/main.js': [
            'src/config.js',
            'src/config_local.js',
            'src/config_logging.js',
            'src/brain_memory.js',
            'src/brain_nextroom.js',
            'src/brain_squadmanager.js',
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
            'src/main.js',
          ],
        },
      },
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
            '!brain_memory.js',
            '!brain_nextroom.js',
            '!brain_squadmanager.js',
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
            '!config_string.js',
          ],
          dest: 'dist/',
        }, {
          expand: true,
          cwd: 'node_modules/screeps-profiler',
          src: ['screeps-profiler.js'],
          dest: 'dist/',
        }, {
          expand: true,
          cwd: 'screeps-elk/js',
          src: ['utils.logger.js'],
          dest: 'dist/',
        }],
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
            'brain_memory.js',
            'brain_nextroom.js',
            'brain_squadmanager.js',
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
            'config_string.js',
          ],
          dest: 'dist/',
        }],
      },
      profiler: {
        files: [{
          expand: true,
          cwd: 'node_modules/screeps-profiler/',
          src: [
            'screeps-profiler.js',
          ],
          dest: 'dist/',
        }],
      },
    },

    sync: {
      main: {
        files: localSync,
        updateAndDelete: true,
        verbose: true,
        compareUsing: 'md5',
      },
    },

    exec: {
      test_on_private_server: 'node utils/test.js 200',
    },
  });

  grunt.log.writeln(new Date().toString());
  grunt.registerTask('default', ['eslint:fix', 'clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'screeps:main']);
  grunt.registerTask('release', ['eslint:fix', 'clean', 'uglify', 'copy:main', 'requireFile', 'sync']);
  grunt.registerTask('local', ['eslint:fix', 'clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'sync']);
  grunt.registerTask('test', ['eslint:check', 'mochaTest', 'exec:test_on_private_server']);
  grunt.registerTask('dev', ['eslint:fix']);
  grunt.registerTask('screeps_local', ['eslint:fix', 'clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'screeps:local']);
  grunt.registerTask('deploy', ['clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'screeps']);
  grunt.registerTask('requireFile', 'Creates an empty file', () => {
    grunt.file.write('dist/require.js', '');
  });
};
