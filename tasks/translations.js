'use strict';

const api = require('crowdin-api');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const Promise = require('bluebird');
const streamBuffers = require('stream-buffers');
const _ = require('lodash');

function upload(project, localesFolder, filename, sourceLocale) {
  const options = {
    ['files[' + filename + '.json]']: fs.createReadStream(path.join(localesFolder, sourceLocale + '.json')),
    update_option: 'update_as_unapproved'
  };

  return api.updateFile(project, [], options);
}

function download(project, localesFolder, filename, sourceLocale, mappings) {
  return api.exportTranslations(project).then(function () {
    return Promise.fromNode(function (callback) {
      api.downloadAllTranslations(project).pipe(unzip.Parse())
        .on('entry', function (entry) {
          if (entry.type !== 'File') {
            entry.autodrain();
            return;
          }

          const [locale, ...rest] = entry.path.split('/');
          const name = rest.join('/');
          if (name !== filename + '.json') {
            entry.autodrain();
            return;
          }

          const targetFile = path.join(localesFolder, (mappings[locale] || locale) + '.json');

          if (locale === sourceLocale) {
            // We must merge the source translation with the updated translations
            const localeBuffer = new streamBuffers.WritableStreamBuffer();

            entry.on('end', function () {
              const updatedTranslations = JSON.parse(localeBuffer.getContentsAsString('utf8'));

              fs.readFile(targetFile, 'utf8', function (err, data) {
                if (err) return callback(err);

                const mergedTranslations = _.merge(JSON.parse(data), updatedTranslations);

                fs.writeFile(targetFile, JSON.stringify(mergedTranslations, null, 4), 'utf8');
              });
            })
              .pipe(localeBuffer);
          } else {
            entry.pipe(fs.createWriteStream(targetFile));
          }
        })
        .on('close', callback)
        .on('error', callback);
    });
  });
}

module.exports = function (grunt) {
  grunt.registerTask('translations', function (target) {
    const key = grunt.config([this.name, 'key']);
    const project = grunt.config([this.name, 'project']);
    const filename = grunt.config([this.name, 'filename']);
    const folder = grunt.config([this.name, 'folder']);
    const sourceLocale = grunt.config([this.name, 'sourceLocale']);
    const mappings = grunt.config.getRaw([this.name, 'mappings']) || {};

    api.setKey(key);

    const localesFolder = path.join(process.cwd(), folder);

    let taskPromise;
    if (target === 'upload') {
      taskPromise = upload(project, localesFolder, filename, sourceLocale);
    } else if (target === 'download') {
      taskPromise = download(project, localesFolder, filename, sourceLocale, mappings);
    } else {
      throw new Error('Unknown target \'' + target + '\', use \'upload\' or \'download\'.');
    }

    return taskPromise.nodeify(this.async());
  });
};
