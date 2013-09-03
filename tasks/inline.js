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
  var Tree = require('./lib/tree.js');

  grunt.registerMultiTask('inline', 'Inline less files.', function() {
    var options = this.options({
      separator: '\n\n',
      paths: [],
      concat: true
    });

    // Iterate over all src-dest file pairs.
    this.files.forEach(function(f) {

      var base = grunt.file.expand(f.src).map(function(src) {
        return '@import (less) "' + src + '";';
      }).join(options.separator);

      if(!base) {
        grunt.log.warn('Failed to read file(s): ' + f.orig.src.join(' '));
        return;
      }
      
      grunt.verbose.writeln(chalk.cyan('Building dependency tree for source files:\n' + base));

      //Create a new tree for each src file.
      // grunt.verbose.writeln(chalk.cyan('Building dependency tree for ' + f.src));
      var tree = new Tree(base, grunt);

      //Flatten the dependency tree.
      var dependencies = tree.flatten();

      //Remove the duplicates.
      var uniqueDependencies = tree.removeDuplicates(dependencies);

      //Create a variable that will hold the content to be written to dest file.
      var result = tree.content;

      grunt.verbose.writeln(chalk.cyan('Inlining content'));

      //Loop all unique dependencies.
      uniqueDependencies.reverse().forEach(function(dependency) {
        if(dependency.type === 'less') {
          //Inline the content for the dependency into where the statement was found (the first occurance).
          result = result.replace(dependency.statement, dependency.content);
        }
      });

      //Loop all dependencies and remove the statements from the content.
      dependencies.forEach(function(dependency) {
        if(dependency.type === 'less') {
          result = result.replace(dependency.statement, '');
        }
      });

      //Write the result to the dest file.
      grunt.verbose.writeln(chalk.cyan('Writing to dest file ' + f.dest));
      grunt.file.write(f.dest, result);
      grunt.log.writeln('File ' + chalk.cyan(f.dest) + ' created.');
    });
  });
};
