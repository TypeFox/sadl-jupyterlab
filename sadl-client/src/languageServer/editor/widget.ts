import {
    Widget
} from 'phosphor/lib/ui/widget';

import {
    Message
} from 'phosphor/lib/core/messaging';

import {
    DocumentRegistry
} from 'jupyterlab/lib/docregistry';

import {
    EditorWidget
} from 'jupyterlab/lib/editorwidget';

import {
    CodeEditor
} from 'jupyterlab/lib/codeeditor';

import {
    MonacoEditor
} from '../../monaco/editor';

import Workspace from '../protocol/workspace';
import * as utils from '../../utils/notebook';

export class LanguageServerAwareEditorWidget extends EditorWidget {

    // FIXME: should be fetched from the editor model
    languageId: string;

    constructor(
        editorFactory: (host: Widget) => CodeEditor.IEditor,
        context: DocumentRegistry.IContext<DocumentRegistry.IModel>
    ) {
        super(editorFactory, context);

        this.updateURI();
        context.pathChanged.connect(() => this.updateURI(true));

        context.model.stateChanged.connect((model, args) => {
            if (args.name === 'dirty') {
                this.saveDocument()
            }
        });
        this.editor.model.valueChanged.connect(() => this.updateDocument());
    }

    get monacoEditor() {
        return this.editor as MonacoEditor;
    }

    protected onActivateRequest(msg: Message) {
        super.onActivateRequest(msg);
        this.openDocument();
    }

    protected onCloseRequest(msg: Message) {
        super.onCloseRequest(msg);
        this.closeDocument();
    }

    protected openDocument() {
        const uri = monaco.Uri.parse(this.monacoEditor.uri);
        if (!Workspace.isOpened(uri)) {
            Workspace.open(uri, this.languageId, this.context.model.toString());
        }
    }

    protected closeDocument() {
        Workspace.close(monaco.Uri.parse(this.monacoEditor.uri));
    }

    protected updateDocument() {
        const uri = this.monacoEditor.uri;
        const content = this.monacoEditor.model.value;
        // FIXME get langauge from monaco editor
        Workspace.update(monaco.Uri.parse(uri), this.languageId, content);
    }

    protected saveDocument() {
        if (!this.context.model.dirty && this.monacoEditor.version > 0) {
            Workspace.save(monaco.Uri.parse(this.monacoEditor.uri));
        }
    }

    protected updateURI(rename: boolean = false) {
        const oldUri = this.monacoEditor.uri;
        const newUri = utils.toNotebookUri(this.context.path);
        if (rename) {
            Workspace.rename(monaco.Uri.parse(oldUri), monaco.Uri.parse(newUri), this.languageId);
        }
        this.monacoEditor.uri = newUri;
    }

}
