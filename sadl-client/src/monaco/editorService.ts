import {
    registry, MonacoEditor, EditorPredicate
} from './editor';

import {
    Schemas
} from '../utils/urls';

import {
    Token
} from 'phosphor/lib/core/token';

import {
    IUriHandler
} from './uris';

import {
    findLanguageForPath
} from 'jupyterlab/lib/monaco';

export type IEditorService = monaco.editor.IEditorService;

/* tslint:disable */
export const IEditorService = new Token<monaco.editor.IEditorService>('services.monaco.editorService');
/* tslint:enabled */

export type MonacoEditorPromise = monaco.Promise<monaco.editor.ICommonCodeEditor | null>;

export class JupyterLabEditorService implements IEditorService {

    protected uriHandler: IUriHandler;

    constructor(uriHandler: IUriHandler) {
        this.uriHandler = uriHandler;
    }

    openEditor(input: monaco.editor.IResourceInput, sideBySide?: boolean): monaco.Promise<monaco.editor.IEditorReference> {
        return this.doOpenEditor(input, sideBySide).then(editor => {
            return {
                getControl() {
                    return editor;
                }
            }
        });
    }

    /**
     * - postcondition:
     *   - `x & e = null |`
     *   - `y & e = fE |`
     *   - `!x & !y & e = null`
     *     - the last conjunct should be `e = oE` when [Microsoft/monaco-editor#254](https://github.com/Microsoft/monaco-editor/issues/254) is fixed
     * - where:
     *   - `e` - a resulted editor
     *   - `fE` - a focused editor
     *   - `oE` - an editor opened for the given uri
     *   - `x` - if the given uri is URL
     *   - `y` = `uri(fE) = uri`
     */
    protected doOpenEditor(input: monaco.editor.IResourceInput, sideBySide?: boolean): MonacoEditorPromise {
        const uri = input.resource;
        if (this.isURL(uri)) {
            window.open(uri.toString());
            return monaco.Promise.as(null);
        }
        const focusedWidget = this.findFocusedWidget(uri);
        if (focusedWidget) {
            return monaco.Promise.as(focusedWidget.editor);
        }
        return this._doOpenEditor(input, sideBySide)
    }

    /** 
     * - because of [Microsoft/monaco-editor#254](https://github.com/Microsoft/monaco-editor/issues/254):
     *   - returns `null` and postpone opening of another editor to focus the current editor
     */
    protected _doOpenEditor(input: monaco.editor.IResourceInput, sideBySide?: boolean): MonacoEditorPromise {
        setTimeout(() => {
            this.uriHandler.open(input.resource, sideBySide).then(() => {
                const editor = registry().get(input.resource);
                if (editor) {
                    this.reveal(editor, input.options);
                }
            });
        });
        return monaco.Promise.as(null);
    }

    protected isURL(uri: monaco.Uri): boolean {
        const schema = uri.scheme;
        return schema === Schemas.http || schema === Schemas.https;
    }

    protected findFocusedWidget(uri: monaco.Uri): MonacoEditor | null {
        const editor = registry().get(uri);
        return editor && EditorPredicate.isFocused(editor) ? editor : null;
    } 

    protected reveal(editor: MonacoEditor, options?: monaco.editor.IResourceInputOptions): void {
        if (this.shouldBeRevealed(editor, options)) {
            this.focus(editor).then(() => {
                this.doReveal(editor, options);
            });
        }
    }

    protected doReveal(widget: MonacoEditor, options?: monaco.editor.IResourceInputOptions): void {
        const editor = widget.editor;
        const selection = options && options.selection;
        if (selection) {
            this.onModelInitialized(widget).then(() => {
                const position = {
                    lineNumber: selection.startLineNumber,
                    column: selection.startColumn
                };
                editor.setPosition(position);
                if (typeof selection.endLineNumber === 'number' && typeof selection.endColumn === 'number') {
                    editor.setSelection(selection);
                    editor.revealRangeInCenter(selection);
                } else {
                    editor.revealPositionInCenter(position);
                }
            });
        }
    }

    protected onModelInitialized(editor: MonacoEditor): Promise<any> {
        if (editor.version > 0) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const onValueChanged = () => {
                if (editor.version > 0) {
                    editor.model.valueChanged.disconnect(onValueChanged);
                    resolve();
                }
            }
            editor.model.valueChanged.connect(onValueChanged);
        });
    }

    protected focus(editor: MonacoEditor): Promise<any> {
        if (editor.editor.isFocused()) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const disposable = editor.editor.onDidFocusEditor(() => {
                disposable.dispose();
                resolve();
            });
            editor.focus();
        });
    }

    protected shouldBeRevealed(editor: MonacoEditor, options?: monaco.editor.IResourceInputOptions): boolean {
        if (options && options.revealIfVisible) {
            const domNode = editor.editor.getDomNode();
            const style = window.getComputedStyle(domNode);
            return style.display !== 'none';
        }
        return true;
    }

    resolveEditorModel(input: monaco.editor.IResourceInput, refresh?: boolean): monaco.Promise<monaco.editor.IModelReference> {
        return new monaco.Promise(resolve => {
            this.getEditorModel(input, refresh).then(textEditorModel => {
                resolve({ textEditorModel });
            });
        });
    }

    protected getEditorModel(input: monaco.editor.IResourceInput, refresh?: boolean): Promise<monaco.editor.IModel> {
        if (refresh) {
            return this.loadEditorModel(input);
        }
        const cachedModel = monaco.editor.getModel(input.resource);
        if (cachedModel) {
            return Promise.resolve(cachedModel);
        }
        return this.loadEditorModel(input);
    }

    protected loadEditorModel(input: monaco.editor.IResourceInput): Promise<monaco.editor.IModel> {
        return this.uriHandler.loadContent(input.resource).then(
            content => this.loadEditorModelForContent(input, content)
        );
    }

    protected loadEditorModelForContent(input: monaco.editor.IResourceInput, content: string | undefined): monaco.editor.IModel | undefined {
        const cachedModel = monaco.editor.getModel(input.resource);
        if (!content) {
            return cachedModel;
        }
        if (cachedModel) {
            cachedModel.setValue(content);
            return cachedModel;
        }
        const uri = input.resource;
        const language = findLanguageForPath(uri.path);
        if (language) {
            return monaco.editor.createModel(content, language.id, uri);
        } else {
            return undefined;
        }
    }

}
