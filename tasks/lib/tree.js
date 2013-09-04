/*
 * grunt-inline-less
 * https://github.com/jonschlinkert/grunt-inline-less
 *
 * Copyright (c) 2013 Jon Schlinkert, contributors
 * Licensed under the MIT license.
 */


'use strict';

var path = require('path');   // Required for path and file extension handling.
var _ = require('lodash');    // Required for extended array manipulation.



// -----------------------------------------------------------------------------
//  Module exposure
// -----------------------------------------------------------------------------

// Expose the Tree constructor.
module.exports = exports = Tree;



// -----------------------------------------------------------------------------
//  Constructors
// -----------------------------------------------------------------------------

/**
 * Dependency tree of less files.
 * First argument source can either be a filename or a string containing content.
 * If source is only content, both source and dir will be equal to ''.
 */
function Tree(source, grunt, build) {
  if(!source) {
    throw new Error('Invalid source.');
  }

  if(!grunt) {
    throw new Error('Invalid grunt object.');
  }

  // Default to build the tree when calling the constructor.
  if(build === undefined) {
    build = true;
  }

  this.nodes = [];
  this.grunt = grunt;
  this.filename = grunt.file.isFile(source) && source || '';
  this.dir = grunt.file.isFile(source) && getPath(source) || '';
  this.content = grunt.file.isFile(source) && grunt.file.read(source) || source;

  if(build) {

    // The build options is set to true, so build the tree and pass in
    // true as the build option, so that the tree will build recursively.
    this.build(true);
  }
}

/**
 * The node object which the tree object will hold.
 * Contains the import statement and the dependency tree of the file.
 */
function Node(statement, tree) {
  if(!statement) {
    throw new Error('Statement is required.');
  }

  if(!tree) {
    throw new Error('A tree is required.');
  }

  this.statement = statement;
  this.tree = tree;
}

// -----------------------------------------------------------------------------
//  Public functions
// -----------------------------------------------------------------------------

/**
 * Reads the content and returns an array with objects that will hold the
 * filename (to be imported) and statement where the statement was found.
 * Returns an empty array if no imports was found.
 */
Tree.prototype.parseImports = function(content) {
  /**
   * The object that will be created for each import statement.
   */
  function Import(statement) {
    this.statement = statement;

    // Read the filename (with path) from the import statement.
    this.filename = getFilename(statement);

    // Determine the file type (less or css) by the import statement.
    this.type = getType(statement);
  }

  // The array to return.
  var result = [];

  // The import regex to be searched for.
  var importRegex = /@import\s*([(](less|css)[)])?\s*("\S+"|'\S+')([^;])*;/g;

  // Get all import occurances in the content and then process that import.
  (content.match(importRegex) || []).forEach(function(statement) {
    // Create a new import object with the statement as parameter and push it to the result array.
    result.push(new Import(statement));
  });

  return result;
};

/**
 * Builds the tree by parsing the imports defined in the tree file.
 * If parameter build is set to true, the tree will build recursively.
 */
Tree.prototype.build = function(build) {

  // Get all imports from the file content and then loop through each import statement.
  this.parseImports(this.content).forEach(function(imp) {

    // Create a new tree from the filename and and add it as a node to this tree.
    // Prepend the filename with the current directory to avoid changing working directory
    // when reading file contents.
    this.nodes.push(new Node(imp.statement, new Tree(this.dir + imp.filename, this.grunt, build)));
  }, this);
};

/**
 * Flattens the tree. Recursively creates an array of dependencies from bottom to top.
 */
Tree.prototype.flatten = function() {
  var result = [];

  /**
   * The result object constructor that will be created for every dependency.
   */
  var ResultObject = function(statement, filename, content) {
    this.statement = statement;
    this.filename = filename;
    this.content = content;
    this.type = getType(statement);
  };

  // Loop through each node in the tree.
  this.nodes.forEach(function(node) {

    // Flatten the current node (since we want to flatten from bottom to top).
    var nodeResult = node.tree.flatten();

    // If the node had any dependencies, add it to the result array by concatination.
    if(nodeResult.length) {
      result = result.concat(nodeResult);
    }

    // Now add the current nodes file (as specified in the tree) as a dependency.
    result.push(new ResultObject(node.statement, node.tree.filename, node.tree.content));
  });

  return result;
};

/**
 * Removes duplicates from a dependency array (as created by flatten function).
 * If duplicate, the following rules will apply:
 * - imports without css selectors win.
 * - both imports will be kept if both have css selectors.
 * - less files win over css files.
 * - earlier imports will win over later.
 */
Tree.prototype.removeDuplicates = function(dependencies) {

  /**
   * Function to decide priority:
   *  -1 = first parameter wins
   *   0 = parity (since it's a tie, both will be added)
   *   1 = second parameter wins
   */
  function priority(dependency, existing) {
    function isLESS(dep) {
      return getType(dep.statement) === 'less';
    }

    function isCSS(dep) {
      return !isLESS(dep);
    }

    function hasSelector(dep) {
      return !!getSelector(dep.statement);
    }

    if(!hasSelector(dependency) && hasSelector(existing)) {
      return -1;
    }

    if(hasSelector(dependency) && !hasSelector(existing)) {
      return 1;
    }

    if(hasSelector(dependency) && hasSelector(existing)) {
      return 0;
    }

    if(isLESS(dependency) && isCSS(existing)) {
      return -1;
    }

    if(isCSS(dependency) && isLESS(existing)) {
      return 1;
    }

    // No special rules applies. Since the existing is added earlier,
    // the second parameter should win.
    return 1;
  }

  var result = [];

  // Loop through all the dependencies.
  dependencies.forEach(function(dependency) {

    // Get the index of the current dependency to see
    // if it already exists in the result array.
    var index = _.findIndex(result, function(dep) {

      // The dependencies are the same if the paths are equivalent and the content equal.
      return this.grunt.file.arePathsEquivalent(dep.filename, dependency.filename) && dep.content === dependency.content;
    }, this);

    if(!~index) {
      // The dependency was not found, so add it to the result array.
      result.push(dependency);
    } else {
      // The dependency was found, so check the prio status.
      var prio = priority(dependency, result[index]);
      if(prio < 0) {
        // The current dependecy have higher prio than the existing one, so replace it.
        result[index] = dependency;
      } else if(prio === 0){
        // Both have the same prio, so add the current one.
        result.push(dependency);
      }

      // The existing have higher prio, so do nothing.
    }
  }, this);

  return result;
};

// -----------------------------------------------------------------------------
//  Private functions
// -----------------------------------------------------------------------------

/**
 * Gets the filename of the import statement.
 */
function getFilenameRaw(statement) {
  return statement.match(/("\S*")|('\S*')/)[0].replace(/^("|')|("|')$/g, '');
}

/**
 * Gets the type of the import. Import option have higher priority than file extension.
 * If to option found, anything except .css is considered to be less.
 */
function getType(statement) {
  var optionLESS = /@import\s*[(]less[)]/;
  var optionCSS = /@import\s*[(]css[)]/;

  if(optionLESS.test(statement)) {
    // The statement has a less option set.
    return 'less';
  } else if(optionCSS.test(statement)) {
    // The statement has a css option set.
    return 'css';
  }

  // No options given. check if the filename has a .css ending.
  var filename = getFilenameRaw(statement);

  if(path.extname(filename) === '.css') {
    // The filename has .css file extension.
    return 'css';
  } else {
    // Any extension except for .css are considered to be less.
    return 'less';
  }
}

/**
 * Gets the computed filename. If the raw filename doesnt have any file extension
 * a .less file extension will be added to the filename.
 */
function getFilename(statement) {
  // Get the raw filename.
  var filename = getFilenameRaw(statement);

  // Check if the type of the import is less and if no file extension is present.
  if(getType(statement) === 'less' && !path.extname(filename)) {
    // Add the less extension to the filename.
    filename += '.less';
  }

  return filename;
}

/**
 * Gets any css selector after filename is import statement.
 */
function getSelector(statement) {
  return statement.replace(/@import\s*([(](less|css)[)])?\s*("\S+"|'\S+')\s*/, '').replace(/;$/, '');
}

/**
 * Gets the path of the filename with a trailing /.
 */
function getPath(filename) {
  return path.normalize(path.dirname(filename) + '/');
}