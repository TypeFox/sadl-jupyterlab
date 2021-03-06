import {
    CodeEditor
} from 'jupyterlab/lib/codeeditor';

import {
    IChangedArgs
} from 'jupyterlab/lib/common/interfaces';

import {
    IObservableString, ObservableString
} from 'jupyterlab/lib/common/observablestring';

import {
    MonacoCodeEditor, findLanguageIdForPath, findLanguageById
} from 'jupyterlab/lib/monaco';

export type EditorPredicate = (editor: MonacoEditor) => boolean;
export namespace EditorPredicate  {
    export const isFocused: EditorPredicate = editor => editor.editor.isFocused() || editor.editor.hasWidgetFocus();
}

export class MonacoEditorRegistry {

    private editors: {
        [uri: string]: MonacoEditor
    } = {};

    constructor() {
        monaco.editor.onWillDisposeModel(model => this.remove(model.uri));
    }

    find(match: EditorPredicate): MonacoEditor | null {
        for (const uri in this.editors) {
            if (this.editors.hasOwnProperty(uri)) {
                const editor = this.editors[uri];
                if (match(editor)) {
                    return editor;
                }
            }
        }
        return null;
    }

    get(uri: string | monaco.Uri): MonacoEditor | null {
        const key = this.toKey(uri);
        return this.editors[key];
    }

    register(editor: MonacoEditor): monaco.IDisposable {
        this.put(editor.uri, editor);

        const disposable = editor.editor.onDidChangeModel(e => {
            this.remove(e.oldModelUrl);
            this.put(e.newModelUrl, editor);
        });
        return {
            dispose() {
                disposable.dispose();
                registry().remove(editor.uri);
            }
        };
    }

    protected put(uri: string | monaco.Uri | undefined, editor: MonacoEditor): void {
        if (uri) {
            const key = this.toKey(uri);
            this.editors[key] = editor;
        }
    }

    protected remove(uri: string | monaco.Uri | undefined): void {
        if (uri) {
            const key = this.toKey(uri);
            delete this.editors[key];
        }
    }

    protected toKey(uri: string | monaco.Uri): string {
        return typeof uri === 'string' ? uri : uri.toString();
    }

}

let _registry: MonacoEditorRegistry | undefined = undefined;
export function registry(): MonacoEditorRegistry {
    if (!_registry) {
        _registry = new MonacoEditorRegistry();
    }
    return _registry;
}

export interface IMonacoEditor extends CodeEditor.IEditor {
    /**
     * A model version
     * - `'version` - a version before change
     * - `versionId'` - a version after change
     * - `editor.uri === a` and `editor.uri = a` => `version' === 'version`
     * - `editor.uri !== a` and `editor.uri = a` => `version' === 0`
     * - any model change => `version' === 'version + 1`
     */
   readonly version: number;
   uri: string;
   readonly languageId: string;
   readonly language: monaco.languages.ILanguageExtensionPoint | null;
}

export class MonacoEditor extends MonacoCodeEditor implements IMonacoEditor {

    protected _version: number = 0;

    constructor(options: MonacoCodeEditor.IOptions) {
        super(options);
        this._listeners.push(registry().register(this));
    }

    focus(): void {
        // FIXME: remove the guard when https://github.com/Microsoft/monaco-editor/issues/254 is fixed
        if (this.isFocusable()) {
            super.focus();
        }
    }

    /**
     * Returns `true` if the topmost element at the host node's coordinates belongs to the host node;
     * otherwise `false`. 
     */
    protected isFocusable(): boolean {
        const hostNode = this.getHostNode();
        if (!hostNode) {
            return false;
        }
        const { left, top } = hostNode.getBoundingClientRect();
        const element = document.elementFromPoint(left, top)
        if (!element) {
            return false;
        }
        return hostNode === element || hostNode.contains(element);
    }

     get version(): number {
        return this._version;
    }

    protected _onDidChangeModel(event: monaco.editor.IModelChangedEvent) {
        this._version = 0;
        super._onDidChangeModel(event);
    }

    get languageId() {
        return this.editor.getModel().getModeId();
    }

    get language(): monaco.languages.ILanguageExtensionPoint | null {
        return findLanguageById(this.languageId);
    }

    get uri(): string {
        return this.editor.getModel().uri.toString();
    }

    set uri(uri: string) {
        if (this.uri === uri) {
            return;
        }
        const model = this.createModel(uri);
        const focused = this.editor.isFocused();
        const viewState = this.editor.saveViewState();
        this.editor.setModel(model);
        this.editor.restoreViewState(viewState);
        if (focused) {
            this.editor.focus();
        }
    }

    protected createModel(uri: string): monaco.editor.IEditorModel {
        const monacoUri = monaco.Uri.parse(uri);
        const languageId = findLanguageIdForPath(monacoUri.path);

        const editorModel = this.editor.getModel();
        const value = editorModel.getValue();

        const loadedModel = monaco.editor.getModel(monacoUri);
        if (loadedModel !== null) {
            loadedModel.setValue(value);
            monaco.editor.setModelLanguage(loadedModel, languageId);
            return loadedModel;
        }
        return monaco.editor.createModel(value, languageId, monacoUri);
    }

    protected _onValueChanged(value: IObservableString, args: ObservableString.IChangedArgs): void {
        this._version = this._version + 1;
        super._onValueChanged(value, args);
    }

}
