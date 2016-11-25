// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var SADL = require('sadl-client/lib/application').SADL;

// ES6 Promise polyfill
require('es6-promise').polyfill();

var sadl = new SADL();

sadl.registerPlugins([
    require('sadl-client/lib/languageServer/plugin').languageServerExtension,
    require('sadl-client/lib/languageServer/editorService/plugin').editorServiceProvider,

    require('sadl-client/lib/about/plugin').aboutExtension,
    require('sadl-client/lib/landing/plugin').landingExtension,
    
    require('jupyterlab/lib/clipboard/plugin').clipboardProvider,
    //require('jupyterlab/lib/commandlinker/plugin').commandLinkerProvider,
    require('jupyterlab/lib/commandpalette/plugin').commandPaletteProvider,
    //require('jupyterlab/lib/console/plugin').consoleTrackerProvider,
    require('jupyterlab/lib/csvwidget/plugin').csvHandlerExtension,
    require('jupyterlab/lib/docregistry/plugin').docRegistryProvider,
    require('jupyterlab/lib/editorwidget/monaco/plugin').editorHandlerProvider,
    //require('jupyterlab/lib/faq/plugin').faqExtension,
    require('jupyterlab/lib/filebrowser/plugin').fileBrowserProvider,
    //require('jupyterlab/lib/imagewidget/plugin').imageHandlerExtension,
    //require('jupyterlab/lib/inspector/plugin').inspectorProvider,
    require('jupyterlab/lib/main/plugin').mainExtension,
    require('jupyterlab/lib/mainmenu/plugin').mainMenuProvider,
    require('jupyterlab/lib/markdownwidget/plugin').markdownHandlerExtension,
    //require('jupyterlab/lib/notebook/plugin').notebookTrackerProvider,
    require('jupyterlab/lib/rendermime/plugin').renderMimeProvider,
    //require('jupyterlab/lib/running/plugin').runningSessionsExtension,
    require('jupyterlab/lib/services/plugin').servicesProvider,
    //require('jupyterlab/lib/shortcuts/plugin').shortcutsExtension,
    require('jupyterlab/lib/statedb/plugin').stateProvider,
    require('jupyterlab/lib/terminal/plugin').terminalExtension,

    // require('jupyterlab/lib/codemirror/plugin').editorFactory
    require('jupyterlab/lib/monaco/plugin').editorFactory
]);

require('font-awesome/css/font-awesome.min.css');
require('material-design-icons/iconfont/material-icons.css');

require('jupyterlab/lib/default-theme/index.css');
require('toastr/package/toastr.css');

require('sadl-client/lib/default-theme/index.css');


window.onload = function () {
    sadl.start();
}

