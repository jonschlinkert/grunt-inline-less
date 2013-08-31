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

  if(build === undefined) {
    build = true;
  }

  this.nodes = [];
  this.grunt = grunt;
  this.filename = filename;
  this.dir = getPath(this.filename);
  this.content = grunt.file.read(filename);

  if(build) {
    this.build(build);
  }
}

/**
 * The node object which the tree object will hold.
 * Contains the import statement and the dependency tree of
 * the file.
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
 * Reads the content and returns an array with objects that will hold the filename (to be imported) and statement
 * where the statement was found. Returns an empty array if no imports was found.
 */
Tree.prototype.parseImports = function(content) {
  /**
   * The object that will be created for each import statement.
   */
  function Import(filename, statement, type) {
    this.filename = filename;
    this.statement = statement;
    this.type = type;
  }

  //The array to return.
  var result = [];

  //The import regex to be searched for.
  var importRegex = /@import\s*([(](less|css)[)])?\s*("\S+"|'\S+')([^;])*;/g;

  //Get all import occurances in the content and then process that import.
  (content.match(importRegex) || []).forEach(function(statement) {
    //Get the filename of the import statement and make sure to remove the surrounding "" or ''.
    var filename = getFilename(statement);

    //Get the type of the statement (less or css).
    var type = getType(statement);

    result.push(new Import(filename, statement, type));
  });

  return result;
};

Tree.prototype.build = function(build) {
  //Get all imports from the file content and then loop through each import statement.
  this.parseImports(this.content).forEach(function(imp) {
    //Create a new tree from the filename and and add it as a node to this tree.
    this.nodes.push(new Node(imp.statement, new Tree(this.dir + imp.filename, this.grunt, build)));
  }, this);
};

Tree.prototype.flatten = function() {
  var result = [];

  var ResultObject = function(statement, content) {
    this.statement = statement;
    this.content = content;
  };

  this.nodes.forEach(function(node) {
    var nodeResult = node.tree.flatten();

    if(nodeResult.length) {
      result = result.concat(nodeResult);
    }

    result.push(new ResultObject(node.statement, node.tree.content));
  });

  return result;
};

Tree.prototype.removeDuplicates = function(dependencies) {
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

    return 1;
  }

  var result = [];

  dependencies.forEach(function(dependency) {
    var index = _.findIndex(result, function(dep) {
      return getFilename(dep.statement, false) === getFilename(dependency.statement, false) && dep.content === dependency.content;
    });
    debugger;
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