/*
 * grunt-inline-less
 * https://github.com/jonschlinkert/grunt-inline-less
 *
 * Copyright (c) 2013 Jon Schlinkert, contributors
 * Licensed under the MIT license.
 */

'use strict';

var Tree = require('../tasks/lib/tree.js');
var grunt = require('grunt');

exports.tree_test = {
  constructor: function(test) {
    var filename = 'test/less/import/urls.less';
    var tree = new Tree(filename, grunt);

    test.equals(tree.filename, filename, 'Filename should be right.');
    test.equals(tree.dir, 'test/less/import/', 'Directury should be right.');
    test.equals(tree.content, '// empty file showing that it loads from the relative path first\n', 'Content should be read.');
    test.equals(tree.nodes.length, 0, 'Tree should have no nodes.');

    test.done();
  },
  parseImports: function(test) {
    var filename = 'test/less/import-syntax.less';
    var tree = new Tree(filename, grunt, false);

    var result = tree.parseImports(tree.content);

    var expected = [
      {
        filename: 'import/urls.less',
        statement: '@import "import/urls.less";',
        type: 'less'
      },
      {
        filename: 'import/import-test-e.less',
        statement: '@import \t \t \t"import/import-test-e.less";',
        type: 'less'
      },
      {
        filename: 'import/import-test-d.css',
        statement: '@import "import/import-test-d.css";',
        type: 'css'
      },
      {
        filename: 'import/import-test-d.css',
        statement: '@import (less) "import/import-test-d.css";',
        type: 'less'
      },
      {
        filename: 'import/import-test-c.less',
        statement: '@import "import/import-test-c.less" screen and (max-width: 400px);',
        type: 'less'
      },
      {
        filename: 'import/import-test-d.css',
        statement: '@import (less) "import/import-test-d.css" screen and (max-width: 400px);',
        type: 'less'
      },
      {
        filename: 'import/urls.less',
        statement: '@import"import/urls.less";',
        type: 'less'
      },
      {
        filename: 'import/urls.less',
        statement: '@import (css) "import/urls.less";',
        type: 'css'
      },
      {
        filename: 'import/urls.less',
        statement: '@import \'import/urls.less\';',
        type: 'less'
      },
      {
        filename: 'import/urls.less',
        statement: '@import "import/urls";',
        type: 'less'
      },
      {
        filename: 'import/urls',
        statement: '@import (css) "import/urls";',
        type: 'css'
      }
    ];

    test.equals(result.length, 11, 'Should find all imports in file.');

    test.deepEqual(result, expected, 'Should have parsed all imports and with right statements.');

    test.done();
  },
  build: function(test) {
    var filename = 'test/less/import-syntax.less';
    var tree = new Tree(filename, grunt);

    test.equal(tree.nodes.length, 11, 'Should have created nodes for all imports.');

    test.done();
  },
  flatten: function(test) {
    var filename = 'test/less/deep.less';
    var tree = new Tree(filename, grunt);

    var expected = [
      {
        statement: '@import "../css/background.css";',
        filename: 'test/less/import/../css/background.css',
        content: 'body {\n  background-color: red;\n}\n',
        type: 'css'
      },
      {
        statement: '@import "import-test-d.css";',
        filename: 'test/less/import/import-test-d.css',
        content: '#css { color: yellow; }\n',
        type: 'css'
      },
      {
        statement: '@import "imports/logo";',
        filename: 'test/less/import/imports/logo.less',
        content: '#logo {\n  width: 100px;\n  height: 100px;\n  background: url(\'../assets/logo.png\');\n}\n',
        type: 'less'
      },
      {
        statement: '@import "imports/font";',
        filename: 'test/less/import/imports/font.less',
        content: '@font-face {\n\tfont-family: xecret;\n\tsrc: url(\'../assets/xecret.ttf\');\n}\n#secret {\n\tfont-family: xecret, sans-serif;\n}\n',
        type: 'less'
      },
      {
        statement: '@import "import/import-and-relative-paths-test.less";',
        filename: 'test/less/import/import-and-relative-paths-test.less',
        content: '@import "../css/background.css";\n@import "import-test-d.css";\n@import "imports/logo";\n@import "imports/font";\n',
        type: 'less'
      },
      {
        statement: '@import "import-test-c.less";',
        filename: 'test/less/import/import-test-c.less',
        content: '\n@c: red;\n#import {\n  color: @c;\n}\n',
        type: 'less'
      },
      {
        statement: '@import "import-test-b.less";',
        filename: 'test/less/import/import-test-b.less',
        content: '@import "import-test-c.less";\n@b: 100%;\n.mixin {\n  height: 10px;\n  color: @c;\n}\n',
        type: 'less'
      },
      {
        statement: '@import "urls.less";',
        filename: 'test/less/import/urls.less',
        content: '// empty file showing that it loads from the relative path first\n',
        type: 'less'
      },
      {
        statement: '@import "import/import-test-a.less";',
        filename: 'test/less/import/import-test-a.less',
        content: '@import "import-test-b.less";\n@a: 20%;\n@import "urls.less";',
        type: 'less'
      }
    ];

    test.deepEqual(tree.flatten(), expected, 'Should flatten all dependencies.');

    test.done();
  },
  removeDuplicates: function(test) {
    var filename = 'test/less/duplicates.less';
    var tree = new Tree(filename, grunt);

    var result = tree.removeDuplicates(tree.flatten());

    var expected = [
      {
        statement: '@import "import/urls.less";',
        filename: 'test/less/import/urls.less',
        content: '// empty file showing that it loads from the relative path first\n',
        type: 'less'
      },
      {
        statement: '@import (less) "import/import-test-d.css";',
        filename: 'test/less/import/import-test-d.css',
        content: '#css { color: yellow; }\n',
        type: 'less'
      },
      {
        statement: '@import "import/import-test-e.less" screen and (max-width: 400px);',
        filename: 'test/less/import/import-test-e.less',
        content: '\nbody { width: 100% }\n',
        type: 'less'
      },
      {
        statement: '@import "import/import-test-e.less" print;',
        filename: 'test/less/import/import-test-e.less',
        content: '\nbody { width: 100% }\n',
        type: 'less'
      },
      {
        statement: '@import "import-test-c.less";',
        filename: 'test/less/import/import-test-c.less',
        content: '\n@c: red;\n#import {\n  color: @c;\n}\n',
        type: 'less'
      },
      {
        statement: '@import "import-test-b.less";',
        filename: 'test/less/import/import-test-b.less',
        content: '@import "import-test-c.less";\n@b: 100%;\n.mixin {\n  height: 10px;\n  color: @c;\n}\n',
        type: 'less'
      },
      {
        statement: '@import \'import/import-test-a.less\';',
        filename: 'test/less/import/import-test-a.less',
        content: '@import "import-test-b.less";\n@a: 20%;\n@import "urls.less";',
        type: 'less'
      },
      {
        statement: '@import (css) "import/urls";',
        filename: 'test/less/import/urls',
        content: '// empty file showing that it loads from the relative path first\n',
        type: 'css'
      }
    ];

    test.deepEqual(result, expected, 'Should remove all duplicates.');

    test.done();
  }
};