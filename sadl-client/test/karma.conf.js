var monacoEditorPath = 'node_modules/monaco-editor-core/dev/vs';

module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha'],
    reporters: ['mocha', 'junit'],
    junitReporter: {
      outputDir: 'test/build/test-results'
    },
    files: [
      {
        pattern: monacoEditorPath + '/**',
        included: false,
        served: true,
        watched: false,
        nocache: true
      },
      'node_modules/es6-promise/dist/es6-promise.js',
      'test/build/bundle.js'
    ],
    port: 9876,
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO,
    client: {
      mocha: {
        delay: true
      }
    }
  });
};
