'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.inline_less = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  default_options: function(test) {
    /**
     * Function to check if a the given file exists. Using test object.
     */
    function fileExist(file) {
      test.equal(grunt.file.exists(file), true, 'Expected the file "' + file + ' to exist.');
    }

    // Define variables to hold the output root folder for lessc and inline.
    var lesscRoot = 'tmp/test/lessc/';
    var inlineRoot = 'tmp/test/inline/';

    // Get all files created normally by less.
    var files = grunt.file.expand(lesscRoot + '/*.css');

    // There will be three tests per file.
    test.expect(files.length*3);

    // Perform the tests for all files.
    files.map(function(file) {
      // Get the file name without type extension.
      var name = file.match(/[^\/]*[.]css$/)[0].replace('.css', '');

      // Will point to the normally created css file using lessc.
      var lesscFile = lesscRoot + name + '.css';

      // Will point to the created less file by inline task.
      var inlineFileLESS = inlineRoot + name + '.less';

      // Will point to the created css file using lessc with the inline less file as source.
      var inlineFileCSS = inlineRoot + '/css/' + name + '.css';

      // There should be a file existing in the inline root, with the exact name except with '.less' ending.
      fileExist(inlineFileLESS)

      // There should be a compiled version (css) of the inline less file.
      fileExist(inlineFileCSS)

      // The css version of the inlined less file should be the same as the css file created by less.
      // (This means that all imports have been followed)
      test.equal(grunt.file.read(inlineFileCSS), grunt.file.read(lesscFile), 'Expected ' + inlineFileCSS + ' and ' + lesscFile + ' to be equal.');
    });

    test.done();
  }

  //TODO: Test custom options.
};
