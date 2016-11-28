import {
    IServiceManager
} from 'jupyterlab/lib/services';

import {
    JupyterLab, JupyterLabPlugin
} from 'jupyterlab/lib/application';

import {
    IDocumentManager
} from 'jupyterlab/lib/docmanager';

import {
    IEditorService, JupyterLabEditorService
} from '../../monaco/editorService';


import {
    defaultPathResolver, PathHandler, UriHandler
} from '../../monaco/uris';

export const editorServiceProvider: JupyterLabPlugin<IEditorService> = {
    id: 'sadl.extensions.languageServer.editorService',
    requires: [
        IServiceManager, IDocumentManager
    ],
    provides: IEditorService,
    activate: activateEditorServices,
    autoStart: true
};

function activateEditorServices(app: JupyterLab, serviceManager: IServiceManager, documentManager: IDocumentManager): IEditorService {
    const pathHandler = new PathHandler(app, serviceManager, documentManager);
    const uriHandler = new UriHandler(defaultPathResolver, pathHandler);
    return new JupyterLabEditorService(uriHandler);
}
