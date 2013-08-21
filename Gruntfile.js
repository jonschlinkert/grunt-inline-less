/*
 * grunt-inline-less
 * https://github.com/jps/grunt-inline-less
 *
 * Copyright (c) 2013 Jon Schlinkert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    inline: {
      test: {
        options: {
          paths: ['test/less/import']
        },
        files: {
          'tmp/test/inline/urls.less': ['test/less/import/urls.less'],
          'tmp/test/inline/import-test-e.less': ['test/less/import/import-test-e.less'],
          'tmp/test/inline/import-test-d.less': ['test/less/import/import-test-d.css'],
          'tmp/test/inline/import-test-c.less': ['test/less/import/import-test-c.less'],
          'tmp/test/inline/import-test-b.less': ['test/less/import/import-test-b.less'],
          'tmp/test/inline/import-test-a.less': ['test/less/import/import-test-a.less'],
          'tmp/test/inline/css/import-once-test-c.css': ['tmp/test/inline/import-once-test-c.less'],
          'tmp/test/inline/css/import-interpolation-tester.css': ['tmp/test/inline/import-interpolation-tester.less'],
          'tmp/test/inline/css/import-charset-test.css': ['tmp/test/inline/import-charset-test.less'],
          'tmp/test/inline/css/import-and-relative-paths-test.css': ['tmp/test/inline/import-and-relative-paths-test.less']

        }
      }
    },

    // For comparing the inline result with lessc.
    less: {
      lessc: {
        options: {
          paths: ['test/less/import']
        },
        files: {
          'tmp/test/lessc/urls.css': ['test/less/import/urls.less'],
          'tmp/test/lessc/import-test-e.css': ['test/less/import/import-test-e.less'],
          'tmp/test/lessc/import-test-d.css': ['test/less/import/import-test-d.css'],
          'tmp/test/lessc/import-test-c.css': ['test/less/import/import-test-c.less'],
          'tmp/test/lessc/import-test-b.css': ['test/less/import/import-test-b.less'],
          'tmp/test/lessc/import-test-a.css': ['test/less/import/import-test-a.less'],
          'tmp/test/lessc/import-once-test-c.css': ['test/less/import/import-once-test-c.less'],
          'tmp/test/lessc/import-interpolation2.css': ['test/less/import/import-interpolation2.less'],
          'tmp/test/lessc/import-charset-test.css': ['test/less/import/import-charset-test.less'],
          'tmp/test/lessc/import-and-relative-paths-test.css': ['test/less/import/import-and-relative-paths-test.less']
        } 
      },
      inline: {
        options: {
          paths: ['tmp/test/inline']
        },
        files: {
          'tmp/test/inline/css/urls.css': ['tmp/test/inline/urls.less'],
          'tmp/test/inline/css/import-test-e.css': ['tmp/test/inline/import-test-e.less'],
          'tmp/test/inline/css/import-test-d.css': ['tmp/test/inline/import-test-d.less'],
          'tmp/test/inline/css/import-test-c.css': ['tmp/test/inline/import-test-c.less'],
          'tmp/test/inline/css/import-test-b.css': ['tmp/test/inline/import-test-b.less'],
          'tmp/test/inline/css/import-test-a.css': ['tmp/test/inline/import-test-a.less'],
          'tmp/test/inline/css/import-once-test-c.css': ['tmp/test/inline/import-once-test-c.less'],
          'tmp/test/inline/css/import-interpolation-tester.css': ['tmp/test/inline/import-interpolation-tester.less'],
          'tmp/test/inline/css/import-charset-test.css': ['tmp/test/inline/import-charset-test.less'],
          'tmp/test/inline/css/import-and-relative-paths-test.css': ['tmp/test/inline/import-and-relative-paths-test.less']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // For testing.
  grunt.loadNpmTasks('grunt-contrib-less');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'inline:test', 'less', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
