/// <reference path='../../node_modules/monaco-editor-core/monaco.d.ts'/>

declare module monaco.editor {

    export interface IEditorOverrideServices {
        editorService?: IEditorService;
    }

    export interface IResourceInput {
        resource: monaco.Uri;
        options?: IResourceInputOptions;
    }

    export interface IResourceInputOptions {
        selection?: monaco.IRange;
        revealIfVisible?: boolean;
    }

    export interface IEditorReference {
        getControl(): monaco.editor.ICommonCodeEditor;
    }

    export interface IModelReference {
        textEditorModel: monaco.editor.IModel;
    }

    export interface IEditorService {

        openEditor(input: IResourceInput, sideBySide?: boolean): Promise<IEditorReference>;

        resolveEditorModel(input: IResourceInput, refresh?: boolean): Promise<IModelReference>;

    }

    export interface ITokenInfo {
        type: string;
        lineNumber: number;
        startColumn: number;
        endColumn: number;
    }

    export interface ITokenIterator {
        hasNext(): boolean;
        next(): ITokenInfo;
        hasPrev(): boolean;
        prev(): ITokenInfo;
    }

    export interface ITokenizedModel extends ITextModel {

        /**
         * Returns an iterator that can be used to read
         * next and previous tokens from the provided position.
         * The iterator is made available through the callback
         * function and can't be used afterwards.
         */
        tokenIterator(position: IPosition, callback: (it: ITokenIterator) => any): any;

    }

}
