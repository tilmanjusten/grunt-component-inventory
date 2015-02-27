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
    var util = require('util');

    grunt.registerMultiTask('component-inventory', 'Build inventory of components from distinct files or data stored in JSON file.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        options = this.options({
            // Template file path
            template: path.resolve(__dirname, '../tmpl/template.html'),
            // Storage file path
            storage: 'component-inventory.json',
            // Component inventory file path
            dest: 'component-inventory.html',
            // Expand: create file per category
            expand: false
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

        // Split data by category
        var sections = renderingData.categories.map(function (category) {
            var renderingDataClone = util._extend({}, renderingData);

            renderingDataClone.categories = [];
            renderingDataClone.categories.push(category);
            renderingDataClone.itemLength = 1;
            renderingDataClone.name = category.name;
            renderingDataClone.isIndex = false;

            return renderingDataClone;
        });

        var navigation = {
            category: '',
            index: options.dest,
            items: []
        };

        navigation.items = sections.map(function (section) {
            //get id from section name (equals category name)
            var id = section.name.replace(/[^\w\d]+/ig, '').toLowerCase();
            var extension = options.dest.split('.').pop();
            // remove extension
            var file = options.dest.indexOf('.') > -1 ? options.dest.replace(/\..+$/, '') : extension;
            var dest = file + '--' + id + '.' + extension;
            var item = {
                href: dest,
                name: section.name
            };

            section.dest = dest;

            return item;
        });

        renderingData.navigation = navigation;

        grunt.log.writeln();

        // write file per category and an index file
        if (options.expand) {
            // Write section inventories
            sections.forEach(function (section) {
                navigation.category = section.name;
                section.navigation = navigation;

                writeTemplate(section.dest, tmpl, section);
            });

            // empty category name for index
            navigation.category = '';

            // Write index
            writeTemplate(options.dest, tmpl, {navigation: navigation, isIndex: true, categories: []});
        } else {
            // write all components to single file
            writeTemplate(options.dest, tmpl, renderingData);
        }
    });

    function writeTemplate(dest, tmpl, data) {
        var log = data.isIndex ? 'Built inventory index in ' : 'Built component inventory in ';

        grunt.verbose.writeln('Write inventory to file ' + dest);

        grunt.file.write(dest, tmpl(data));

        grunt.log.oklns(log + dest);
    }

    function prepareData(data) {
        if (typeof data !== 'object') {
            grunt.log.error('Item is not an object');
            return;
        }

        var prepared = {
            itemLength: 0,
            options: data.options || {},
            categories: [],
            isIndex: true,
            dest: options.dest
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
