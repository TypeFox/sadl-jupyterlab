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

export interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
    services?: monaco.editor.IEditorOverrideServices
    application: JupyterLab;
    editorWidgetProvider?: (editorFactory: (host: Widget) => MonacoEditor, context: DocumentRegistry.IContext<DocumentRegistry.IModel>) => EditorWidget;
}

export class DocumentEditorFactory extends ABCWidgetFactory<Widget, DocumentRegistry.IModel> {

    constructor(private _options: IOptions) {
        super(_options);
    }

    /**
     * Create a new widget given a context.
     */
    protected createNewWidget(context: DocumentRegistry.IContext<DocumentRegistry.IModel>): Widget {
        const editorWidgetProvider = this._options.editorWidgetProvider || DocumentEditorFactory.createEditorWidget;
        const editorWidget = editorWidgetProvider(host => this.createDocumentEditor(host.node), context);
        return editorWidget;
    }

    static createEditorWidget(editorFactory: (host: Widget) => MonacoEditor, context: DocumentRegistry.IContext<DocumentRegistry.IModel>) {
        return new EditorWidget(editorFactory, context, undefined);
    }

    protected createDocumentEditor(domElement: HTMLElement) {
        const editorOptions: monaco.editor.IDiffEditorConstructionOptions = {
            folding: true
        };
        const uuid = utils.uuid();
        const editorServices = this._options.services;
        return new MonacoEditor({ uuid, domElement, editorOptions, editorServices });
    }

}
