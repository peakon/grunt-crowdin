# grunt-travis-restart

Task to upload and download translations from [Crowdin](https://crowdin.com). The translation files must be in json format.

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-crowdin --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-crowdin');
```


### Settings

#### key
Type: `String`

The API key for the Crowdin project. Find it under the project settings.

#### project
Type: `String`

The name of the Crowdin project.

#### filename
Type: `String`

The name of the file to update on Crowdin. This is the logical filename.

#### folder
Type: `String`

The folder the translation files are located in.

#### sourceLocale
Type: `String`

The name of the source of translations, f.ex. `en`. This means the task will upload the file name `en.json` from the above `folder` to the file named `filename.json` on Crowdin.

Example:
```js
travis-crowdin: {
    key: 'abcdefg',
    project: 'google',
    filename: 'input',
    folder: 'locales',
    sourceLocale: 'en'
}
```
