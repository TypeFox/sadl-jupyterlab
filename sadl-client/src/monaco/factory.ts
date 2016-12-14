import {
    CodeEditor
} from 'jupyterlab/lib/codeeditor';

import {
    MonacoCodeEditor, MonacoCodeEditorFactory
} from 'jupyterlab/lib/monaco';

import {
    MonacoEditor
} from './editor';

import {
    IEditorService
} from './editorService';

export class MonacoEditorFactory extends MonacoCodeEditorFactory {

    editorService: IEditorService;

    protected newEditor(host: HTMLElement, monacoOptions: MonacoCodeEditor.IOptions, options: CodeEditor.IOptions): CodeEditor.IEditor {
        monacoOptions.editorOptions.glyphMargin = true;
        monacoOptions.editorServices = {
            editorService: this.editorService
        };
        const editor = new MonacoEditor(monacoOptions);
        this.applyOptions(editor, options);
        return editor;
    }

}