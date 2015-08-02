# grunt-content-inventory

> Create inventory of components from individual files or data stored in JSON file.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-content-inventory --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-content-inventory');
```

## The "content-inventory" task

### Overview
In your project's Gruntfile, add a section named `content-inventory` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  'content-inventory': {
    options: {
      // Task specific options goes here.
    },
    your_target: {
      // Target specific file lists and/or options goes here.
    },
  },
});
```

### Options

```js
grunt.initConfig({
  'content-inventory': {
    options: {
      // Template file path
      template: path.resolve(__dirname, '../tmpl/template.html'),
      // Storage file path
      storage: 'component-inventory.json',
      // Partial directory where individual partial files will be stored (relative to base)
      partials: './partials',
      // Component inventory file path
      dest: 'component-inventory.html',
      // Expand: create file per category
      expand: false,
      // Create partial files
      storePartials: false,
      // Partial extension when stored
      partialExt: '.html',
      // Category for items without category
      categoryFallback: 'No category'
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
