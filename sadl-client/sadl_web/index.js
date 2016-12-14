// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var SADL = require('sadl-client/lib/application').SADL;

// ES6 Promise polyfill
require('es6-promise').polyfill();

var sadl = new SADL();

sadl.registerPlugins([
    require('sadl-client/lib/languageServer/plugin').languageServerExtension,
    require('sadl-client/lib/languageServer/editorService/plugin').editorServiceProvider,
    //require('sadl-client/lib/wizard/plugin').wizardExtension,


    require('jupyterlab/lib/clipboard/plugin').plugin,
    require('jupyterlab/lib/monaco/plugin').editorCommands,
    require('jupyterlab/lib/commandlinker/plugin').plugin,
    require('jupyterlab/lib/commandpalette/plugin').plugin,
    require('jupyterlab/lib/console/plugin').plugin,
    require('jupyterlab/lib/csvwidget/plugin').plugin,
    require('jupyterlab/lib/docmanager/plugin').plugin,
    require('jupyterlab/lib/docregistry/plugin').plugin,
    require('jupyterlab/lib/editorwidget/plugin').plugin,
    require('jupyterlab/lib/faq/plugin').plugin,
    require('jupyterlab/lib/filebrowser/plugin').plugin,
    require('jupyterlab/lib/imagewidget/plugin').plugin,
    require('jupyterlab/lib/inspector/plugin').plugin,
    //require('jupyterlab/lib/launcher/plugin').plugin,
    require('jupyterlab/lib/layoutrestorer/plugin').plugin,
    require('jupyterlab/lib/mainmenu/plugin').plugin,
    require('jupyterlab/lib/markdownwidget/plugin').plugin,
    require('jupyterlab/lib/notebook/plugin').plugin,
    require('jupyterlab/lib/rendermime/plugin').plugin,
    require('jupyterlab/lib/running/plugin').plugin,
    require('jupyterlab/lib/services/plugin').plugin,
    require('jupyterlab/lib/shortcuts/plugin').plugin,
    require('jupyterlab/lib/statedb/plugin').plugin,
    require('jupyterlab/lib/terminal/plugin').plugin,

]);

require('font-awesome/css/font-awesome.min.css');
require('material-design-icons/iconfont/material-icons.css');

require('jupyterlab/lib/default-theme/index.css');
require('toastr/package/toastr.css');

require('sadl-client/lib/default-theme/index.css');


window.onload = function () {
    sadl.start();
}

