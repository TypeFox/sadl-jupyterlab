import {
    IDisposable
} from 'phosphor/lib/core/disposable';

import {
    TextDocument
} from 'vscode-languageserver-types';

import {
    Event, Emitter
} from 'vscode-jsonrpc/lib/events';

export class Workspace implements IDisposable {

    isDisposed: boolean = false;

    private onDidOpenTextDocumentEmitter = new Emitter<TextDocument>();
    onDidOpenTextDocument = this.onDidOpenTextDocumentEmitter.event;

    private onDidChangeTextDocumentEmitter = new Emitter<TextDocument>();
    onDidChangeTextDocument = this.onDidChangeTextDocumentEmitter.event;

    private onDidSaveTextDocumentEmitter = new Emitter<TextDocument>();
    onDidSaveTextDocument = this.onDidSaveTextDocumentEmitter.event;

    private onDidCloseTextDocumentEmitter = new Emitter<TextDocument>();
    onDidCloseTextDocument = this.onDidCloseTextDocumentEmitter.event;

    private _documents: { [uri: string]: TextDocument } = {}

    dispose() {
        if (this.isDisposed) {
            return;
        }
        this.isDisposed = true;
        this.closeAll();
        this._documents = null;

        this.onDidOpenTextDocumentEmitter.dispose();
        this.onDidOpenTextDocumentEmitter = null;
        this.onDidOpenTextDocument = null;

        this.onDidChangeTextDocumentEmitter.dispose();
        this.onDidChangeTextDocumentEmitter = null;
        this.onDidChangeTextDocument = null;

        this.onDidSaveTextDocumentEmitter.dispose();
        this.onDidSaveTextDocumentEmitter = null;
        this.onDidSaveTextDocument = null;

        this.onDidCloseTextDocumentEmitter.dispose();
        this.onDidCloseTextDocumentEmitter = null;
        this.onDidCloseTextDocument = null;
    }

    isOpened(uri: monaco.Uri): boolean {
        const document = this._documents[uri.toString()];
        return document !== null && document !== undefined;
    }

    open(uri: monaco.Uri, languageId: string, content: string) {
        if (this.createDocument(uri, languageId, content)) {
            this.fireOpen(uri);
        }
    }

    setContent(uri: monaco.Uri, content: string) {
        if (this.updateDocument(uri, content)) {
            this.fireChange(uri);
        }
    }

    update(uri: monaco.Uri, languageId: string, content: string) {
        if (this.isOpened(uri)) {
            this.setContent(uri, content);
        } else {
            this.open(uri, languageId, content);
        }
    }

    rename(oldUri: monaco.Uri, newUri: monaco.Uri, languageId: string) {
        if (this.isOpened(oldUri)) {
            const document = this._documents[oldUri.toString()];
            this.close(oldUri);
            this.open(newUri, languageId, document.getText());
        }
    }

    save(uri: monaco.Uri) {
        this.fireSave(uri);
    }

    close(uri: monaco.Uri) {
        this.fireClose(uri);
        delete this._documents[uri.toString()];
    }

    allOpened() {
        return this._documents;
    }

    saveAll() {
        for (const uri in this._documents) {
            if (this._documents.hasOwnProperty(uri)) {
                this.save(monaco.Uri.parse(uri));
            }
        }
    }

    closeAll() {
        for (const uri in this._documents) {
            if (this._documents.hasOwnProperty(uri)) {
                this.close(monaco.Uri.parse(uri));
            }
        }
    }

    protected createDocument(uri: monaco.Uri, languageId: string, content: string): boolean {
        if (this.isOpened(uri)) {
            return false;
        }
        this._documents[uri.toString()] = TextDocument.create(uri.toString(), languageId, 1, content);
        return true;
    }

    protected updateDocument(uri: monaco.Uri, content: string): boolean {
        const document = this._documents[uri.toString()];
        if (!document) {
            return false;
        }
        if (document.getText() === content) {
            return false;
        }
        const version = document.version + 1;
        this._documents[uri.toString()] = TextDocument.create(document.uri, document.languageId, version, content);
        return true;
    }

    public fireOpen(uri: monaco.Uri) {
        this.fire(this.onDidOpenTextDocumentEmitter, uri);
    }

    protected fireSave(uri: monaco.Uri) {
        this.fire(this.onDidSaveTextDocumentEmitter, uri);
    }

    protected fireChange(uri: monaco.Uri) {
        this.fire(this.onDidChangeTextDocumentEmitter, uri);
    }

    protected fireClose(uri: monaco.Uri) {
        this.fire(this.onDidCloseTextDocumentEmitter, uri);
    }

    protected fire(emitter: Emitter<TextDocument>, uri: monaco.Uri) {
        const document = this._documents[uri.toString()];
        if (document) {
            try {
                emitter.fire(document);
            } catch (e) {
                console.error(e);
            }
        }
    }

}

export const workspace = new Workspace();
export default workspace;