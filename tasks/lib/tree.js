'use strict';

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
  this.dir = this.filename.match(/^.*[\\\/]/)[0];
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

    if(type === 'less' && /^[^.]+$/.test(filename)) {
      //Add the less extension to the filename.
      filename += '.less';
    }

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

  var resultObject = function(statement, content) {
    this.statement = statement;
    this.content = content;
  };

  this.nodes.forEach(function(node) {
    var nodeResult = node.tree.flatten();

    if(nodeResult.length) {
      result = result.concat(nodeResult);
    }

    result.push(new resultObject(node.statement, node.tree.content));
  }, this);

  return result;
};

//-----------------------------------------------------------------------------
// Private functions
//-----------------------------------------------------------------------------

function getFilename(statement) {
  return statement.match(/("\S*")|('\S*')/)[0].replace(/^("|')|("|')$/g, '');
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
  var filename = getFilename(statement);

  if(filename.match(/\.css$/)) {
    return 'css';
  } else {
    return 'less';
  }
}

//-----------------------------------------------------------------------------
// Module exposure
//-----------------------------------------------------------------------------

//Expose the Tree constructor.
module.exports = Tree;