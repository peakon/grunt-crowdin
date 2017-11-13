'use strict';

const CrowdinApi = require('crowdin-api');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const Bluebird = require('bluebird');
const streamBuffers = require('stream-buffers');
const _ = require('lodash');

function upload(api, project, localesFolder, filename, sourceLocale) {
  const options = {
    ['files[' + filename + '.json]']: fs.createReadStream(path.join(localesFolder, sourceLocale + '.json')),
    update_option: 'update_as_unapproved'
  };

  return api.updateFile(project, [], options);
}

async function download(api, project, localesFolder, filename, sourceLocale, mappings) {
  await api.exportTranslations(project);

  const zipPath = await api.downloadAllTranslations(project);

  await new Bluebird((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzip.Parse())
      .on('entry', async entry => {
        if (entry.type !== 'File') {
          return entry.autodrain();
        }

        const match = entry.path.match(/(.*)\/(.*)\.json/);
        if (!match) {
          throw new Error(`Unknown path ${entry.path}`);
        }
        const locale = mappings[match[1]] || match[1];
        const projectFile = match[2];
        if (projectFile !== filename) {
          return entry.autodrain();
        }
        const targetFile = path.join(localesFolder, locale + '.json');

        if (locale === sourceLocale) {
          // We must merge the source translation with the updated translations
          const buffer = new streamBuffers.WritableStreamBuffer();
          const current = await Bluebird.fromCallback(cb => fs.readFile(targetFile, 'utf8', cb));

          entry.on('end', async function () {
            const updated = buffer.getContentsAsString('utf8');
            const merged = _.merge(JSON.parse(current), JSON.parse(updated));

            await Bluebird.fromCallback(cb => fs.writeFile(targetFile, JSON.stringify(merged, null, '  ') + '\n', 'utf8', cb));
          })
            .pipe(buffer);
        } else {
          entry.pipe(fs.createWriteStream(targetFile));
        }
      })
      .on('close', resolve)
      .on('error', reject);
  });
}

module.exports = function (grunt) {
  grunt.registerTask('translations', async function (target) {
    const apiKey = grunt.config([this.name, 'key']);
    const project = grunt.config([this.name, 'project']);
    const filename = grunt.config([this.name, 'filename']);
    const folder = grunt.config([this.name, 'folder']);
    const sourceLocale = grunt.config([this.name, 'sourceLocale']);
    const mappings = grunt.config.getRaw([this.name, 'mappings']) || {};

    const api = new CrowdinApi({
      apiKey
    });

    const done = this.async();

    try {
      const localesFolder = path.join(process.cwd(), folder);

      if (target === 'upload') {
        await upload(api, project, localesFolder, filename, sourceLocale);
      } else if (target === 'download') {
        await download(api, project, localesFolder, filename, sourceLocale, mappings);
      } else {
        throw new Error('Unknown target \'' + target + '\', use \'upload\' or \'download\'.');
      }

      done();
    } catch (err) {
      done(err);
    }
  });
};
