# grunt-inline-less

> Proof-of-concept task to inline LESS dependencies.

## Getting Started
_If you haven't used [grunt][] before, be sure to check out the [Getting Started][] guide._

From the same directory as your project's [Gruntfile][Getting Started] and [package.json][], install this plugin with the following command:

```bash
npm install grunt-inline-less --save-dev
```

Once that's done, add this line to your project's Gruntfile:

```js
grunt.loadNpmTasks('grunt-inline-less');
```

If the plugin has been installed correctly, running `grunt --help` at the command line should list the newly-installed plugin's task or tasks. In addition, the plugin should be listed in package.json as a `devDependency`, which ensures that it will be installed whenever the `npm install` command is run.

[grunt]: http://gruntjs.com/
[Getting Started]: https://github.com/gruntjs/grunt/blob/devel/docs/getting_started.md
[package.json]: https://npmjs.org/doc/json.html

## The "inline" task

### Overview
In your project's Gruntfile, add a section named `inline` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  inline: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.separator
Type: `String`
Default value: `\n\n`

Specify the separator to use between concatenated files.

#### options.paths
Type: `String`
Default value: `undefined`

Paths to the directories of LESS files to be inlined. For resolving paths to files referenced in `@import` statements.

### Usage Examples

#### Default Options

```js
inline: {
  bootstrap: {
    options: {
      separator: '\n\n',
      paths: ['vendor/bootstrap/less']
    },
    files: {
      'tmp/bootstrap.less': ['vendor/bootstrap/less/bootstrap.less']
    }
  }
},
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][].

## Release History
_(Nothing yet)_
