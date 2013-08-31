'use strict';

var _ = require('lodash');

//-----------------------------------------------------------------------------
// Constructors
//-----------------------------------------------------------------------------

/**
 * Dependency tree of less files.
 */
function Tree(filename, grunt, build) {
  if(!filename) {
    throw new Error('Invalid filename.');
  }

  if(!grunt) {
    throw new Error('Invalid grunt object.');
  }

  //Default to build the tree when calling the constructor.
  if(build === undefined) {
    build = true;
  }

  this.nodes = [];
  this.grunt = grunt;
  this.filename = filename;
  this.dir = getPath(filename);
  this.content = grunt.file.read(filename);

  if(build) {
    //The build options is set to true, so build the tree and pass in
    //true as the build option, so that the tree will build recursively.
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

//-----------------------------------------------------------------------------
// Public functions
//-----------------------------------------------------------------------------

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

    //Read the filename (with path) from the import statement.
    this.filename = getFilename(statement);

    //Determine the file type (less or css) by the import statement.
    this.type = getType(statement);
  }

  //The array to return.
  var result = [];

  //The import regex to be searched for.
  var importRegex = /@import\s*([(](less|css)[)])?\s*("\S+"|'\S+')([^;])*;/g;

  //Get all import occurances in the content and then process that import.
  (content.match(importRegex) || []).forEach(function(statement) {
    //Create a new import object with the statement as parameter and push it to the result array.
    result.push(new Import(statement));
  });

  return result;
};

/**
 * Builds the tree by parsing the imports defined in the tree file.
 * If parameter build is set to true, the tree will build recursively.
 */
Tree.prototype.build = function(build) {
  //Get all imports from the file content and then loop through each import statement.
  this.parseImports(this.content).forEach(function(imp) {
    //Create a new tree from the filename and and add it as a node to this tree.
    //Prepend the filename with the current directory to avoid changing working directory
    //when reading file contents.
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
  var ResultObject = function(statement, content) {
    this.statement = statement;
    this.content = content;
  };

  //Loop through each node in the tree.
  this.nodes.forEach(function(node) {
    //Flatten the current node (since we want to flatten from bottom to top).
    var nodeResult = node.tree.flatten();

    //If the node had any dependencies, add it to the result array by concatination.
    if(nodeResult.length) {
      result = result.concat(nodeResult);
    }

    //Now add the current nodes file (as specified in the tree) as a dependency.
    result.push(new ResultObject(node.statement, node.tree.content));
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
   * Function to decide priority.
   * -1 = first parameter wins.
   *  0 = same prio (both should be added).
   *  1 = second parameter wins.
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

    //No special rules applies. Since the existing is added earlier,
    //the second parameter should win.
    return 1;
  }

  var result = [];

  //Loop through all the dependencies.
  dependencies.forEach(function(dependency) {
    //Get the index of the current dependency to see if it already exists in the result array.
    var index = _.findIndex(result, function(dep) {
      return getFilename(dep.statement, false) === getFilename(dependency.statement, false) && dep.content === dependency.content;
    });

    if(!~index) {
      result.push(dependency);
    } else {
      var prio = priority(dependency, result[index]);
      if(prio < 0) {
        result[index] = dependency;
      } else if(prio === 0){
        result.push(dependency);
      }
    }
  });

  return result;
};

//-----------------------------------------------------------------------------
// Private functions
//-----------------------------------------------------------------------------

function getFilenameRaw(statement, path) {
  if(path === undefined) {
    path = true;
  }

  var result = statement.match(/("\S*")|('\S*')/)[0].replace(/^("|')|("|')$/g, '');

  if(!path) {
    result = result.replace(getPath(result), '');
  }

  return result;
}

function getType(statement) {
  if(!statement) {
    throw new Error('Requires a statement.');
  }

  var optionLESS = /@import\s*[(]less[)]/;
  var optionCSS = /@import\s*[(]css[)]/;

  if(optionLESS.test(statement)) {
    return 'less';
  } else if(optionCSS.test(statement)) {
    return 'css';
  }

  //No options given. check if the filename has a .css ending.
  var filename = getFilenameRaw(statement);

  if(filename.match(/\.css$/)) {
    return 'css';
  } else {
    return 'less';
  }
}

function getFilename(statement, path) {
  var filename = getFilenameRaw(statement, path);

  if(getType(statement) === 'less' && /^[^.]+$/.test(filename)) {
    //Add the less extension to the filename.
    filename += '.less';
  }

  return filename;
}

function getSelector(statement) {
  return statement.replace(/@import\s*([(](less|css)[)])?\s*("\S+"|'\S+')\s*/, '').replace(/;$/, '');
}

function getPath(filename) {
  var path = filename.match(/^.*[\\\/]/)
  return path && path[0] || '';
}

//-----------------------------------------------------------------------------
// Module exposure
//-----------------------------------------------------------------------------

//Expose the Tree constructor.
module.exports = Tree;