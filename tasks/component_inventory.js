/*
 * grunt-component-inventory
 * https://github.com/tilmanjusten/grunt-component-inventory
 *
 * Copyright (c) 2015 Tilman Justen
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    var options = {};
    var _ = require('lodash');
    var template = require('lodash/string/template');
    var path = require('path');

    grunt.registerMultiTask('component-inventory', 'Build inventory of components from distinct files or data stored in JSON file.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        options = this.options({
            // Template file path
            template: path.resolve(__dirname, '../tmpl/template.html'),
            // Storage file path
            storage: 'component-inventory.json',
            // Component inventory file path
            dest: 'component-inventory.html'
        });

        var templateFile;
        var storageFile;
        var renderingData = {
            items: [
                {
                    name: 'Component name',
                    partial: '<p>Partial code</p>'
                },
                {
                    name: 'Another component',
                    partial: '<div class="another-component">\n    <p>Another component</p>\n</div>'
                }
            ]
        };
        var tmpl;
        var inventory;

        grunt.verbose.writeln('Read storage file ' + options.storage);

        if (!grunt.file.exists(options.template)) {
            grunt.fail.warn('Template file ' + options.storage + ' does not exist.');
        }

        if (!grunt.file.exists(options.storage)) {
            grunt.fail.warn('Storage file ' + options.storage + ' does not exist.');
        }


        grunt.verbose.writeln('Read template file ' + options.template);
        templateFile = grunt.file.read(options.template);

        grunt.verbose.writeln('Read storage file ' + options.storage);
        storageFile = grunt.file.readJSON(options.storage);

        renderingData = prepareData(storageFile);

        // prepare template
        tmpl = template(templateFile, {imports: {'_': _}});
        inventory = tmpl(renderingData);

        grunt.verbose.writeln('Write inventory to file ' + options.dest);

        grunt.file.write(options.dest, inventory);

        grunt.log.writeln();

        grunt.log.oklns('Built component inventory in ' + options.dest);
    });

    function prepareData(data) {
        if (typeof data !== 'object') {
            grunt.log.error('Item is not an object');
            return;
        }

        var prepared = {
            itemLength: 0,
            options: data.options || {},
            categories: []
        };
        var item;

        _.forEach(data.items, function (el) {
            item = prepareItem(el);

            if (!item) {
                return false;
            }

            var category = item.category || 'Unknown';
            var categoryIndex = getIndexByName(prepared.categories, category);

            if (categoryIndex < 0) {
                grunt.verbose.writeln('Create and prepare category ' + category);

                var categoryObj = {
                    items: [],
                    name: category
                };

                prepared.categories.push(categoryObj);
                categoryIndex = prepared.categories.length - 1;
            }

            prepared.categories[categoryIndex].items.push(item);
            prepared.itemLength++;
        });

        // sort categories by name
        prepared.categories = _.sortBy(prepared.categories, 'name');

        prepared.categories.forEach(function (category) {
            category.items = _.sortBy(category.items, 'name');
        });

        grunt.log.writeln('Categories: ' + prepared.categories.length);
        grunt.log.writeln('Items: ' + prepared.itemLength);

        return prepared;
    }

    function prepareItem(item) {
        if (!_.isPlainObject(item)) {
            grunt.log.error('Item is not an object');
            return false;
        }

        return {
            name:           item.name || 'Unknown',
            category:       item.category || 'Unknown',
            options:        item.options || {},
            optionsData:    item.optionsData || '',
            dest:           item.dest || '',
            filename:       item.filename || '',
            path:           item.path || '',
            origin:         item.origin || '',
            partial:        item.partial || '',
            view:           item.view || '',
            lines:          item.lines || []
        };
    }

    function getIndexByName(arr, name) {
        if (!_.isArray(arr)) {
            grunt.fail.warn('getIndexByName: Given parameter is not an array.');
            return false;
        }

        var index = -1;

        arr.map(function(item, i) {
            if (item.hasOwnProperty('name') && item.name === name) {
                index = i;
            }
        });

        return index;
    }

};
