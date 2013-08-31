/*
 * grunt-contrib-concat
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var path = require('path');
  var chalk = require('chalk');
  var _ = require('lodash');

  grunt.registerMultiTask('inline', 'Inline less files.', function() {
    var options = this.options({
      separator: '\n\n',
      paths: [],
      concat: true,
    });

    var parseManifest = function(filename) {
      var manifestFile = grunt.file.read(filename);
      var importRegex = /@import "([\w\.\-]+)";/;
      var start = 0;
      var match;
      var manifest = [];
      while (match = importRegex.exec(manifestFile.substring(start))) {
        manifest.push(match[1]);
        start += match['index'] + 1;
      }
      return manifest;
    };

    // Iterate over all src-dest file pairs.
    this.files.forEach(function(f) {
      var src = grunt.file.expand(f.src).map(function(path) {
        return {
          path: path,
          imports: parseManifest(path)
        };
      }).map(function(obj) {

        grunt.verbose.writeln("Import statements: " + chalk.cyan(obj.imports));

        var content = _(obj.imports).map(function(filepath) {
          filepath = options.paths + '/' + filepath;
          return grunt.file.read(filepath);
        }).join(grunt.util.normalizelf(grunt.util.linefeed));

        grunt.file.write(f.dest, content);

      }).join(grunt.util.normalizelf(grunt.util.linefeed));
    });
  });

};
