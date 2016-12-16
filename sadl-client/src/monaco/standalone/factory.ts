import {
    Widget
} from 'phosphor/lib/ui/widget';

import {
    Session, utils
} from '@jupyterlab/services';

import {
    JupyterLab
} from 'jupyterlab/lib/application';

import {
    ABCWidgetFactory, DocumentRegistry
} from 'jupyterlab/lib/docregistry';

import {
    EditorWidget
} from 'jupyterlab/lib/editorwidget/widget';

import {
    MonacoEditor
} from '../editor';

import {
    IEditorServices
} from 'jupyterlab/lib/codeeditor';

export interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
    editorServices: IEditorServices;
    sessionManager: Session.IManager;
    application: JupyterLab;
    editorWidgetProvider?: (options: EditorWidget.IOptions) => EditorWidget;
}

export class DocumentEditorFactory extends ABCWidgetFactory<Widget, DocumentRegistry.IModel> {

    constructor(private _options: IOptions) {
        super(_options);
    }

    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(context: DocumentRegistry.IContext<DocumentRegistry.IModel>): Widget {
        const editorWidget = this._options.editorWidgetProvider({
            context,
            factory: (host) => this.createDocumentEditor(host.node),
            mimeTypeService: this._options.editorServices.mimeTypeService
        });
        return editorWidget;
    }

    static createEditorWidget(editorFactory: (host: Widget) => MonacoEditor, context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
        return new EditorWidget({factory: editorFactory, context, mimeTypeService: undefined});
    }

    protected createDocumentEditor(domElement: HTMLElement) {
        return this._options.editorServices.factory.newDocumentEditor(domElement, {}) as MonacoEditor;
    }

}
