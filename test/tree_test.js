'use strict';

var Tree = require('../tasks/lib/tree.js');
var grunt = require('grunt');

exports.tree_test = {
  constructor: function(test) {
    var filename = 'test/less/import/urls.less';
    var tree = new Tree(filename, grunt);

    test.equals(tree.filename, filename, 'Filename should be right.');
    test.equals(tree.content, '// empty file showing that it loads from the relative path first\n', 'Content should be read.');
    test.equals(tree.nodes.length, 0, 'Tree should have no nodes.');

    test.done();
  },
  parseImports: function(test) {
    var filename = 'test/less/test.less';
    var tree = new Tree(filename, grunt);

    var result = tree.parseImports();

    var expected = [
      'import/urls.less',
      'import/import-test-e.less',
      'import/import-test-d.css',
      'import/import-test-d.css',
      'import/import-test-c.less',
      'import/import-test-d.css',
      'import/urls.less',
      'import/urls.less',
      'import/urls.less'
    ];

    test.equals(result.length, 9, 'Should find all imports in file.');

    test.deepEqual(result.map(function(object) {
      return object.filename;
    }), expected, 'Should have parsed all imports.');

    test.done();
  }
};