// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Widget
} from 'phosphor/lib/ui/widget';

import {
  TabPanel
} from 'phosphor/lib/ui/tabpanel';

import {
  JupyterLab, JupyterLabPlugin
} from 'jupyterlab/lib/application';

import {
  ICommandPalette
} from 'jupyterlab/lib/commandpalette';

import {
  IPathTracker
} from 'jupyterlab/lib/filebrowser';

import {
  IServiceManager
} from 'jupyterlab/lib/services';

/**
 * The landing page extension.
 */
export
const landingExtension: JupyterLabPlugin<void> = {
  id: 'sadl.extensions.landing',
  requires: [IServiceManager, IPathTracker, ICommandPalette],
  activate: activateLanding,
  autoStart: true
};


function activateLanding(app: JupyterLab, services: IServiceManager, pathTracker: IPathTracker, palette: ICommandPalette): void {
  let widget = new Widget();
  widget.id = 'landing-jupyterlab';
  widget.title.label = 'Launcher';
  widget.title.closable = true;
  widget.addClass('jp-Landing');

  let dialog = document.createElement('div');
  dialog.className = 'jp-Landing-dialog';
  widget.node.appendChild(dialog);

  let logo = document.createElement('span');
  logo.className = 'jp-ImageJupyterLab jp-Landing-logo';
  dialog.appendChild(logo);

  let subtitle = document.createElement('span');
  subtitle.textContent = 'alpha preview';
  subtitle.className = 'jp-Landing-subtitle';
  dialog.appendChild(subtitle);

  let tour = document.createElement('span');
  tour.className = 'jp-Landing-tour';
  dialog.appendChild(tour);
  tour.addEventListener('click', () => {
    app.commands.execute('about-jupyterlab:show', void 0);
  });

  let header = document.createElement('span');
  header.textContent = 'Start a new activity';
  header.className = 'jp-Landing-header';
  dialog.appendChild(header);

  let body = document.createElement('div');
  body.className = 'jp-Landing-body';
  dialog.appendChild(body);

  for (let name of ['Notebook', 'Code Console', 'Terminal', 'Text Editor']) {
    let column = document.createElement('div');
    body.appendChild(column);
    column.className = 'jp-Landing-column';

    let img = document.createElement('span');
    let imgName = name.replace(' ', '');
    img.className = `jp-Image${imgName} jp-Landing-image`;

    column.appendChild(img);

    let text = document.createElement('span');
    text.textContent = name;
    text.className = 'jp-Landing-text';
    column.appendChild(text);
  }

  let img = body.getElementsByClassName('jp-ImageNotebook')[0];
  img.addEventListener('click', () => {
    app.commands.execute('file-operations:new-notebook', void 0);
  });

  img = body.getElementsByClassName('jp-ImageCodeConsole')[0];
  img.addEventListener('click', () => {
    app.commands.execute(`console:create-${services.specs.default}`, void 0);
  });

  img = body.getElementsByClassName('jp-ImageTextEditor')[0];
  img.addEventListener('click', () => {
    app.commands.execute('file-operations:new-text-file', void 0);
  });

  img = body.getElementsByClassName('jp-ImageTerminal')[0];
  img.addEventListener('click', () => {
    app.commands.execute('terminal:create-new', void 0);
  });

  let cwd = document.createElement('div');
  cwd.className = 'jp-Landing-cwd';


  let folderImage = document.createElement('span');
  folderImage.className = 'jp-Landing-folder';


  let path = document.createElement('span');
  path.textContent = 'home';
  pathTracker.pathChanged.connect(() => {
    if (pathTracker.path.length > 0) {
      path.textContent = 'home > ';
      let path2 = pathTracker.path;
      path2 = path2.replace('/', ' > ');
      path.textContent += path2;
    } else {
      path.textContent = 'home';
    }
  });
  path.className = 'jp-Landing-path';

  cwd.appendChild(folderImage);
  cwd.appendChild(path);
  dialog.appendChild(cwd);

  app.commands.addCommand('jupyterlab-launcher:show', {
    label: 'Show Launcher',
    execute: () => {
      if (!widget.isAttached) {
        app.shell.addToMainArea(widget);
      }
      let stack = widget.parent;
      if (!stack) {
        return;
      }
      let tabs = stack.parent;
      if (tabs instanceof TabPanel) {
        tabs.currentWidget = widget;
      }
      app.shell.activateMain(widget.id);
    }
  });

  palette.addItem({
    command: 'jupyterlab-launcher:show',
    category: 'Help'
  });

  app.shell.addToMainArea(widget);
}
