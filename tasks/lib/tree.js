/**
 * Dependency tree of less files.
 */
function Tree(filename, grunt) {
  if(!filename) {
    throw new Error('Invalid filename.');
  }

  if(!grunt) {
    throw new Error('Invalid grunt object.');
  }

  this.nodes = [];
  this.grunt = grunt;
  this.filename = filename;
  this.dir = this.filename.match(/^.*[\\\/]/)[0];
  this.content = grunt.file.read(filename);
};

function Node(statement, tree) {
  if(!statement) {
    throw new Error('Statement is required.');
  }

  if(!tree) {
    throw new Error('A tree is required.');
  }

  this.statement = statement;
  this.tree = tree;
};

/**
 * Reads the content and returns an array with objects that will hold the filename (to be imported) and statement
 * where the statement was found. Returns an empty array if no imports was found.
 */
Tree.prototype.parseImports = function(content) {
  /**
   * The object that will be created for each import statement.
   */
  function Import(filename, statement) {
    this.filename = filename;
    this.statement = statement;
  }

  //The array to return.
  var result = [];

  //The import regex to be searched for.
  var importRegex = /@import\s*([(](less|css)[)])?\s*("\S+"|'\S+')([^;])*;/g;

  //The filename regex to match in import statement.
  var filenameRegex = /("\S*")|('\S*')/;

  //Get all import occurances in the content and then process that import.
  (content.match(importRegex) || []).forEach(function(statement) {
    //Get the filename of the import statement and make sure to remove the surrounding "" or ''.
    var filename = filenameRegex.exec(statement)[0].replace(/^("|')|("|')$/g, '');

    result.push(new Import(filename, statement));
  });

  return result;
};

Tree.prototype.build = function() {
  //Get all imports from the file content and then loop through each import statement.
  this.parseImports(this.content).forEach(function(imp) {
    //Create a new tree from the filename and and add it as a node to this tree.
    this.nodes.push(new Node(imp.statement, new Tree(this.dir + imp.filename, this.grunt)));
  }, this);
};

/**
 * Expose the Tree constructor.
 */
module.exports = Tree;