'use strict';

const api = require('crowdin-api');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const Promise = require('bluebird');

module.exports = function(grunt) {
	grunt.registerTask('translations', function(target) {
		var key = grunt.config([this.name, 'key']);
		var project = grunt.config([this.name, 'project']);
		var filename = grunt.config([this.name, 'filename']);
		var folder = grunt.config([this.name, 'folder']);
		var sourceLocale = grunt.config([this.name, 'sourceLocale']);

		api.setKey(key);

		const localesFolder = path.join(process.cwd(), folder);

		if (target === 'upload') {
			const options = {};
			options['files[' + filename + '.json]'] = fs.createReadStream(path.join(localesFolder, sourceLocale + '.json'));

			api.updateFile(project, [], options).nodeify(this.async());
		} else if (target === 'download') {
			api.exportTranslations(project).then(function() {
				return Promise.fromNode(function(callback) {
					const zipPipe = api.downloadAllTranslations(project).pipe(unzip.Parse());
					zipPipe.on('entry', function(entry) {
						if (entry.type === 'File') {
							const splitPath = entry.path.split('/')
							const locale = splitPath[0];
							const name = splitPath[1];
							if (name === filename + '.json') {
								entry.pipe(fs.createWriteStream(path.join(localesFolder, locale + '.json')));
							}
						} else {
							entry.autodrain();
						}
					}).on('close', callback).on('error', callback);
				});
			}).nodeify(this.async());
		} else {
			throw new Error('Unknown target \'' + target + '\', use \'upload\' or \'download\'.');
		}
	});
};