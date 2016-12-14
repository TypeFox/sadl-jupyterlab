import {
  JupyterLab, JupyterLabPlugin
} from 'jupyterlab/lib/application';

import {
  IEditorServices
} from 'jupyterlab/lib/codeeditor';

import {
  MonacoMimeTypeService
} from 'jupyterlab/lib/monaco';


import {
  MonacoEditorFactory
} from './factory';

import {
  IEditorService
} from './editorService';

export const servicesPlugin: JupyterLabPlugin<IEditorServices> = {
  id: IEditorServices.name,
  requires: [
    IEditorService
  ],
  provides: IEditorServices,
  activate: (app: JupyterLab, editorService: IEditorService): IEditorServices => {
    const factory = new MonacoEditorFactory();
    factory.editorService = editorService;
    const mimeTypeService = new MonacoMimeTypeService();
    return { factory, mimeTypeService };
  }
};
