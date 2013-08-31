/**
 * Dependency tree of less files.
 */
function Tree(filename, grunt) {
  if(!filename) {
    throw new Error('Invalid filename');
  }

  if(!grunt) {
    throw new Error('Invalid grunt object');
  }

  this.nodes = [];
  this.grunt = grunt;
  this.filename = filename;
  this.content = grunt.file.read(filename);
};

/**
 * Reads the content and returns an array with objects that will hold the filename (to be imported) and line number
 * where the statement was found. Returns an empty array if no imports was found.
 */
Tree.prototype.parseImports = function() {
  /**
   * The object that will be created for each import statement.
   */
  function Import(filename, line) {
    this.filename = filename;
    this.line = line;
  }

  //The array to return.
  var result = [];

  //The import regex to be searched for.
  var importRegex = /@import\s*([(](less|css)[)])?\s*("\S+"|'\S+')([^;])*;/g;

  //The filename regex to match in import lines.
  var filenameRegex = /("\S*")|('\S*')/;

  //Get all import occurances in the content and then process that import.
  (this.content.match(importRegex) || []).forEach(function(line) {
    //Get the filename of the import line and make sure to remove the surrounding "" or ''.
    var filename = filenameRegex.exec(line)[0].replace(/^("|')|("|')$/g, '');

    result.push(new Import(filename));
  });

  return result;
};

/**
 * Expose the Tree constructor.
 */
module.exports = Tree;