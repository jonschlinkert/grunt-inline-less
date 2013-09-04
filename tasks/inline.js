/*
 * grunt-inline-less
 * https://github.com/jonschlinkert/grunt-inline-less
 *
 * Copyright (c) 2013 Jon Schlinkert, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var chalk = require('chalk');         // Required to output colored messages.
  var Tree = require('./lib/tree.js');  // Required to parse and build dependency tree.

  grunt.registerMultiTask('inline', 'Inline less files.', function() {
    var options = this.options({
      separator: '\n\n',
      paths: [],
      concat: true
    });

    // Iterate over all src-dest file pairs.
    this.files.forEach(function(f) {

      // The idea is to first create temporary content (not written to a file) that will import
      // all the src files. Then parse the content with a dependency tree which. The key here
      // is to parse all src files with a root tree so that duplicate dependencies will be removed
      // cross-src-files. If a tree would be built for each src file and then concatinated, duplicates
      // could occur in the dest file.

      // Create the temporary base content by concatinating import statements that imports each src file.
      // By concatinating the imports with given separator, in the end this will result in concatinated
      // less files without duplicate imports, separated by given separator.
      var base = grunt.file.expand(f.src).map(function(src) {
        // Since css imports are kept, the src files are forced to be imported as less.
        return '@import (less) "' + src + '";';
      }).join(options.separator);

      // Validate the base content.
      if(!base) {
        grunt.log.warn('Failed to read file(s): ' + f.orig.src.join(' '));
        return;
      }

      grunt.verbose.writeln(chalk.cyan('Building dependency tree for source files:\n' + base));

      // Create a tree for the base content.
      var tree = new Tree(base, grunt);

      // Flatten the dependency tree.
      var dependencies = tree.flatten();

      // Remove the duplicates.
      var uniqueDependencies = tree.removeDuplicates(dependencies);

      // Create a variable that will hold the content to be written to dest file.
      var result = tree.content;

      grunt.verbose.writeln(chalk.cyan('Inlining content'));

      // Loop all unique dependencies.
      uniqueDependencies.reverse().forEach(function(dependency) {
        // Only inline dependencies that are less files.
        if(dependency.type === 'less') {
          // Inline the content for the dependency into where the statement was found (the first occurance).
          result = result.replace(dependency.statement, dependency.content);
        }
      });

      // Loop all dependencies and remove the statements from the content.
      // The statements that already have been inlined do not exist any more,
      // so this will only remove the duplicate dependency statements.
      dependencies.forEach(function(dependency) {
        // Only remove less dependency statements.
        if(dependency.type === 'less') {
          // Replace the statement with an empty string.
          result = result.replace(dependency.statement, '');
        }
      });

      // Write the result to the dest file.
      grunt.verbose.writeln(chalk.cyan('Writing to dest file ' + f.dest));
      grunt.file.write(f.dest, result);
      grunt.log.writeln('File ' + chalk.cyan(f.dest) + ' created.');
    });
  });
};
