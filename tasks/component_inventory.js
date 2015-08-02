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
    var InventoryObject = require('./../lib/inventory-object');

    // extend InventoryObject
    InventoryObject.prototype.addUsage = function (value) {
        if (this.usage === undefined) {
            this.usage = [];
        }

        if (this.usage.indexOf(value) < 0) {
            this.usage.push(value);
        }
    };

    grunt.registerMultiTask('component-inventory', 'Build inventory of components from distinct files or data stored in JSON file.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        options = this.options({
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
            renderingDataClone.itemLength = category.items.length;
            renderingDataClone.name = category.name;
            renderingDataClone.isIndex = false;

            return renderingDataClone;
        });

        var navigation = {
            category: '',
            index: options.dest,
            items: [],
            lengthUnique: renderingData.lengthUnique,
            legthTotal: renderingData.lengthTotal
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
                name: section.name,
                itemLength: section.itemLength
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

    /**
     * write template code to file
     *
     * @param dest
     * @param tmpl
     * @param data
     */
    function writeTemplate(dest, tmpl, data) {
        var log = data.isIndex ? 'Built inventory index in ' : 'Built component inventory in ';

        grunt.verbose.writeln('Write inventory to file ' + dest);

        grunt.file.write(dest, tmpl(data));

        grunt.log.oklns(log + dest);
    }

    /**
     * get and prepare list of inventory items
     *
     * @param data
     * @returns {{options: (*|{}), categories: Array, isIndex: boolean, dest: string}}
     */
    function prepareData(data) {
        if (typeof data !== 'object') {
            grunt.log.error('Item is not an object');
            return;
        }

        var prepared = {
            options: data.options || {},
            categories: [],
            isIndex: true,
            dest: options.dest,
            lengthUnique: data.lengthUnique || 0,
            lengthTotal: data.lengthTotal || 0
        };
        var item;
        var uniquePartials = [];
        var uniqueViewPartials = [];
        var i = 0;

        _.forEach(data.items, function (el) {
            item = makeInventoryObject(el);

            if (!item) {
                return false;
            }

            // set default category to item
            item.category = item.category || options.categoryFallback;

            var categoryIndex = _.findIndex(prepared.categories, function (category) {
                return category.name === item.category;
            });
            var isDuplicate = false;

            if (categoryIndex < 0) {
                grunt.verbose.writeln('Create and prepare category ' + item.category);

                var categoryObj = {
                    items: {},
                    name: item.category,
                };

                prepared.categories.push(categoryObj);
                // the index of the added item is the last one
                categoryIndex = prepared.categories.length - 1;
            }

            var categoryItems = prepared.categories[categoryIndex].items;

            // store unique partials
            if (uniquePartials.indexOf(item.id) < 0) {
                //item.addUsage(item.origin);
                uniquePartials.push(item.id);
                categoryItems[item.id] = item;
            } else {
                isDuplicate = true;
            }
            // add usage (itemIndex of first is 0)
            categoryItems[item.id].addUsage(item.origin);

            if (uniqueViewPartials.indexOf(item.viewId) < 0) {
                uniqueViewPartials.push(item.viewId);
            }

            // store partial if not already happen
            if (options.storePartials && !isDuplicate) {
                var filename = item.id + options.partialExt;
                grunt.file.write(path.resolve(options.partials, filename), item.template);
            }
        });

        // sort categories and items by name
        prepared.categories = _.sortBy(prepared.categories, 'name');

        prepared.categories.forEach(function (category) {
            category.items = _.sortBy(category.items, 'name');
        });

        grunt.log.writeln('Categories: ' + prepared.categories.length);
        grunt.log.writeln('Items: ' + uniquePartials.length);
        grunt.log.writeln('View items: ' + uniqueViewPartials.length);

        return prepared;
    }

    /**
     *
     * @param item
     * @returns {*}
     */
    function makeInventoryObject(item) {
        if (!_.isPlainObject(item)) {
            grunt.log.error('Item is not an object');
            return false;
        }

        return new InventoryObject(item);
    }
};
