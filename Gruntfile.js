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

  let accountLocal;
  try {
    // eslint-disable-next-line global-require
    accountLocal = require('./account_local.screeps.com');
  } catch (e) {
    accountLocal = {
      email: false,
      password: false,
    };
  }

  grunt.loadNpmTasks('grunt-screeps');
  grunt.loadNpmTasks('grunt-mocha-test');
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
        },
        files: [
          {
            src: ['dist/*.js'],
          },
        ],
      },
      season: {
        options: {
          email: process.env.email || account.email,
          token: process.env.token || account.token,
          branch: 'default',
          server: 'season',
        },
        files: [
          {
            src: ['dist/*.js'],
          },
        ],
      },
      local: {
        options: {
          email: accountLocal.email,
          password: accountLocal.password,
          branch: accountLocal.branch,
          server: {
            http: accountLocal.http,
            port: accountLocal.port,
            host: accountLocal.host,
          },
        },
        files: [
          {
            src: ['dist/*.js'],
          },
        ],
      },
    },
    mochaTest: {
      src: ['test/**/*.js'],
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
      test_on_private_server: 'node utils/test.js 49 true',
    },
  });

  grunt.log.writeln(new Date().toString());
  grunt.registerTask('default', ['clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'screeps:main']);
  grunt.registerTask('release', ['clean', 'uglify', 'copy:main', 'requireFile', 'sync']);
  grunt.registerTask('local', ['clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'sync']);
  grunt.registerTask('test', ['mochaTest', 'exec:test_on_private_server']);
  grunt.registerTask('test_no_server', ['eslint:check', 'mochaTest']);
  grunt.registerTask('screeps_local', ['clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'screeps:local']);
  grunt.registerTask('deploy', ['clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'screeps:main']);
  grunt.registerTask('season', ['clean', 'copy:uglify', 'copy:main', 'copy:profiler', 'screeps:season']);
  grunt.registerTask('requireFile', 'Creates an empty file', () => {
    grunt.file.write('dist/require.js', '');
  });
};
