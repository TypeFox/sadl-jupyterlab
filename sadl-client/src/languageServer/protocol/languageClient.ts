import * as utils from '../../utils/notebook';

import * as is from 'vscode-jsonrpc/lib/is'
import { Disposable } from 'vscode-jsonrpc/lib/events'
import { MessageConnection, NotificationType } from 'vscode-jsonrpc'

import * as lstypes from 'vscode-languageserver-types'
import * as protocol from 'vscode-languageclient/lib/protocol'
import * as protocolConverter from './protocolConverter'
import * as languageConverter from './languageConverter'



import { LanguageDescription } from './registry'

import Workspace from './workspace';


// FIXME move to types module
export class ColoringParams {
    uri: string;
    infos: ColoringInformation[];
}

export class ColoringInformation {
    range: lstypes.Range;
    styles: number[];
}

export class ColoringIdToCssStyleMap {
    static map: Map<number, string> = new Map<number, string>([
        [1, 'identifier'],
        [2, 'entity'],
        [3, 'constructor'],
        [4, 'operators'],
        [5, 'tag'],
        [6, 'namespace'],
        [7, 'keyword'],
        [8, 'info-token'],
        [9, 'type'],
        [10, 'string'],
        [11, 'warn-token'],
        [12, 'predefined'],
        [13, 'string.escape'],
        [14, 'error-token'],
        [15, 'invalid'],
        [16, 'comment'],
        [17, 'debug-token'],
        [18, 'commen.doc'],
        [19, 'regexp'],
        [20, 'constant'],
        [21, 'attribute'],

        [22, 'public'],
        [23, 'private'],
        [24, 'protected'],
        [25, 'static'],
        [26, 'final']
    ]);
}

// FIXME move to protocol module
class ColoringNotification {
    static type: NotificationType<ColoringParams, any> = {
        method: 'textDocument/updateColoring',
        _: undefined
    };
}

export class LanguageClient implements
        monaco.languages.DefinitionProvider,
        monaco.languages.DocumentFormattingEditProvider,
        monaco.languages.HoverProvider,
        monaco.languages.ReferenceProvider,
        monaco.languages.DocumentHighlightProvider,
        Disposable {

    private _languages: LanguageDescription[]
    private _connection: MessageConnection

    private _capabilites: protocol.ServerCapabilities

    private _disposables: Disposable[] = [];
    private _isDisposed: boolean;

    constructor(connection: MessageConnection, languages: LanguageDescription[]) {
        this._languages = languages
        this._connection = connection

        let uriToDiagnosticMap = new Map<string, lstypes.Diagnostic[]>()
        // TODO: handle disposable
        this._connection.onNotification(protocol.PublishDiagnosticsNotification.type, params => {
            let diagnostics = params.diagnostics
            uriToDiagnosticMap.set(params.uri, diagnostics)
            this.updateMarkers(params.uri, diagnostics)
        })

        let uriToColoringDecorationIdsMap = new Map<string, string[]>();
        this._connection.onNotification(ColoringNotification.type, params => {
            let infos = params.infos;
            let uri = params.uri;
            this.updateColoringDecorators(uri, infos, uriToColoringDecorationIdsMap);
        });


        this._connection.onDispose(params => {
            this.dispose();
        })
        this._disposables.push(Workspace.onDidOpenTextDocument(textDocument => {
            let diagnostics = uriToDiagnosticMap.get(textDocument.uri)
            this.updateMarkers(textDocument.uri, diagnostics)
        }));
    }

    // FIXME move to coloring service
    protected updateColoringDecorators(uri: string, infos: ColoringInformation[], uriToColoringDecorationIdsMap: Map<string, string[]>) {
        let modelUri = monaco.Uri.parse(uri)
        let model = monaco.editor.getModel(modelUri)
        if (is.undefined(model) || is.nil(model)) {
            return;
        }

        const decorationIdsToRemove = uriToColoringDecorationIdsMap.get(uri);
        if (decorationIdsToRemove) {
            while (decorationIdsToRemove.length !== 0) {
                const oldId = decorationIdsToRemove.pop();
                model.deltaDecorations([oldId], []);
            }
        }

        const newDecorationIds: string[] = [];
        infos.forEach(info => {
            const monacoRange = protocolConverter.asRange(info.range);
            info.styles.forEach(style => {
                const cssClass = ColoringIdToCssStyleMap.map.get(style);
                newDecorationIds.push(model.deltaDecorations([], [{ range: monacoRange, options: { inlineClassName: cssClass } }])[0]);
            })
        });
        uriToColoringDecorationIdsMap.set(uri, newDecorationIds);
    }

    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        for (let i = 0; i < this._disposables.length; i++) {
            this._disposables[i].dispose();
        }
        this._disposables = null;
    }

    public start(): PromiseLike<void> {
        this._connection.listen()

        let initializeParams = this.getInitializeParams()
        return this._connection.sendRequest(protocol.InitializeRequest.type, initializeParams).then(initializeResult => {
            this._capabilites = initializeResult.capabilities
            this.hookCapabilites()
        })
    }

    protected updateMarkers(uri: string, diagnostics: lstypes.Diagnostic[]): void {
        let modelUri = monaco.Uri.parse(uri)
        let model = monaco.editor.getModel(modelUri)
        if (is.undefined(model) || is.nil(model)) {
            return;
        }

        let markers: monaco.editor.IMarkerData[] = []
        if (is.defined(diagnostics) && !is.nil(diagnostics)) {
            markers = diagnostics.map(protocolConverter.asMarker)
        }
        monaco.editor.setModelMarkers(model, 'LanguageClient', markers)
    }

    // TODO: stop to dispose all elements

    protected getInitializeParams(): protocol.InitializeParams {
        return {
            processId: null,
            rootPath: utils.getNotebookPath(),
            capabilities: {},
            initializationOptions: {}
        }
    }

    protected hookCapabilites(): void {

        if (this._capabilites.textDocumentSync !== protocol.TextDocumentSyncKind.None) {
            this._disposables.push(Workspace.onDidOpenTextDocument((t) => this.filterTextDocument(t, (document) => this.onDidOpenTextDocument(document))));
            this._disposables.push(Workspace.onDidChangeTextDocument((t) => this.filterTextDocument(t, (document) => this.onDidChangeTextDocument(document))));
            this._disposables.push(Workspace.onDidSaveTextDocument((t) => this.filterTextDocument(t, (document) => this.onDidSaveTextDocument(document))));
            this._disposables.push(Workspace.onDidCloseTextDocument((t) => this.filterTextDocument(t, (document) => this.onDidCloseTextDocument(document))));
        }
        // TODO: move completion registration to below for loop once, TODOs are clarified.
        this.hookCompletionProvider()

        for (let language of this._languages) {
            // hover
            if (this._capabilites.hoverProvider) {
                this._disposables.push(monaco.languages.registerHoverProvider(language.languageId, this));
            }
            // definition
            if (this._capabilites.definitionProvider) {
                this._disposables.push(monaco.languages.registerDefinitionProvider(language.languageId, this));
            }
            // references
            if (this._capabilites.referencesProvider) {
                this._disposables.push(monaco.languages.registerReferenceProvider(language.languageId, this));
            }
            // formatting
            if (this._capabilites.documentFormattingProvider) {
                this._disposables.push(monaco.languages.registerDocumentFormattingEditProvider(language.languageId, this));
            }
            // signatureHelp
            if (this._capabilites.signatureHelpProvider) {
                this.signatureHelpTriggerCharacters = this._capabilites.signatureHelpProvider.triggerCharacters
                this._disposables.push(monaco.languages.registerSignatureHelpProvider(language.languageId, this));
            }
            // highlights
            if (this._capabilites.documentHighlightProvider) {
                this._disposables.push(monaco.languages.registerDocumentHighlightProvider(language.languageId, this));
            }
        }
    }

    // TODO neccessary checks? workspace already checks document before fire
    protected filterTextDocument(textDocument: lstypes.TextDocument, acceptor: (textDocument: lstypes.TextDocument) => void) {
        if (is.undefined(textDocument)) {
            return;
        }
        if (is.nil(textDocument)) {
            return;
        }
        if (!this.isLanguageSupported(textDocument.languageId)) {
            return;
        }
        acceptor(textDocument);
    }

    protected onDidOpenTextDocument(textDocument: lstypes.TextDocument): void {
        const params = languageConverter.asDidOpenTextDocumentParams(textDocument);
        this._connection.sendNotification(protocol.DidOpenTextDocumentNotification.type, params);
    }

    protected onDidChangeTextDocument(textDocument: lstypes.TextDocument, contentChanges?: lstypes.TextDocumentContentChangeEvent[]): void {
        const params = languageConverter.asDidChangeTextDocumentParams(textDocument);
        if (this._capabilites.textDocumentSync === protocol.TextDocumentSyncKind.Incremental) {
            if (is.defined(contentChanges) && !is.nil(contentChanges)) {
                params.contentChanges = contentChanges.map((change) => {
                    return languageConverter.asTextDocumentContentChangeEvent(change);
                })
            }
        }
        this._connection.sendNotification(protocol.DidChangeTextDocumentNotification.type, params);
    }

    protected onDidSaveTextDocument(textDocument: lstypes.TextDocument): void {
        const params = languageConverter.asDidSaveTextDocumentParams(textDocument);
        this._connection.sendNotification(protocol.DidSaveTextDocumentNotification.type, params);
    }

    protected onDidCloseTextDocument(textDocument: lstypes.TextDocument): void {
        const params = languageConverter.asDidCloseTextDocumentParams(textDocument);
        this._connection.sendNotification(protocol.DidCloseTextDocumentNotification.type, params);
    }

    provideDefinition(model: monaco.editor.IReadOnlyModel, position: monaco.IPosition, token: monaco.CancellationToken) : PromiseLike<monaco.languages.Location | monaco.languages.Location[]> {
        const params = languageConverter.asTextDocumentPositionParams(model.uri.toString(), position);
        return this._connection.sendRequest(protocol.DefinitionRequest.type, params).then(
            protocolConverter.asLocation,
            error => Promise.resolve([])
        );
    }

    provideHover(model: monaco.editor.IReadOnlyModel, position: monaco.IPosition, token: monaco.CancellationToken) {
        const params = languageConverter.asTextDocumentPositionParams(model.uri.toString(), position);
        return this._connection.sendRequest(protocol.HoverRequest.type, params).then(
            protocolConverter.asHover,
            error => Promise.resolve([])
        );
    }

    provideReferences(model: monaco.editor.IReadOnlyModel, position: monaco.IPosition, context: monaco.languages.ReferenceContext, token: monaco.CancellationToken) {
        let params = languageConverter.asTextDocumentPositionParams(model.uri.toString(), position) as protocol.ReferenceParams;
        params.context = context;

        return this._connection.sendRequest(protocol.ReferencesRequest.type, params).then(
            protocolConverter.asLocation,
            error => Promise.resolve([])
        );
    }

    provideDocumentFormattingEdits(model: monaco.editor.IReadOnlyModel, options: monaco.languages.FormattingOptions, token: monaco.CancellationToken): monaco.editor.ISingleEditOperation[] | Thenable<monaco.editor.ISingleEditOperation[]> {
        const params = {
            textDocument : {
                uri : model.uri.toString()
            },
            options : options
        }
        return this._connection.sendRequest(protocol.DocumentFormattingRequest.type, params).then(
            (edits) => edits.map(protocolConverter.asTextEdit),
            error => Promise.resolve([])
        )
    }

    provideDocumentHighlights(model: monaco.editor.IReadOnlyModel, position: monaco.Position, token: monaco.CancellationToken): monaco.languages.DocumentHighlight[] | Thenable<monaco.languages.DocumentHighlight[]> {
        let params = languageConverter.asTextDocumentPositionParams(model.uri.toString(), position) as protocol.ReferenceParams;

        return this._connection.sendRequest(protocol.DocumentHighlightRequest.type, params).then(
            protocolConverter.asDocumentHighlight,
            error => Promise.resolve([])
        );
    }

    signatureHelpTriggerCharacters: string[];
        /**
         * Provide help for the signature at the given position and document.
         */
    provideSignatureHelp(model: monaco.editor.IReadOnlyModel, position: monaco.Position, token: monaco.CancellationToken): monaco.languages.SignatureHelp | Thenable<monaco.languages.SignatureHelp> {
        let params = languageConverter.asTextDocumentPositionParams(model.uri.toString(), position) as protocol.ReferenceParams;

        return this._connection.sendRequest(protocol.SignatureHelpRequest.type, params).then(
            (help) => help as monaco.languages.SignatureHelp,
            error => Promise.resolve([])
        );
    }

    protected hookCompletionProvider(): void {
        if (!this._capabilites.completionProvider) {
            return;
        }
        for (let language of this._languages) {
            // TODO: handle disposable
            this._disposables.push(monaco.languages.registerCompletionItemProvider(language.languageId, {
                triggerCharacters: this._capabilites.completionProvider.triggerCharacters,
                provideCompletionItems: (model, position, token) => {
                    // TODO why is this checked again if the provider is registered by language.id?
                    if (!this.isLanguageSupported(model.getModeId())) {
                        return Promise.resolve([]);
                    }
                    return this.provideForOpened(model.uri.toString(), (uri) => this.completion(uri, position, token));
                },
                resolveCompletionItem: this._capabilites.completionProvider.resolveProvider ?
                    (item, token) => {
                        return this._connection.sendRequest(protocol.CompletionResolveRequest.type, languageConverter.asCompletionItem(item)).then(
                            protocolConverter.asCompletionItem,
                            error => Promise.resolve(item)
                        )
                    } : undefined
            }));
        }
    }

    protected completion(uri: string, position: monaco.IPosition, token: monaco.CancellationToken) {
        const params = languageConverter.asTextDocumentPositionParams(uri, position);
        return this._connection.sendRequest(protocol.CompletionRequest.type, params).then(
            protocolConverter.asCompletionList,
            error => Promise.resolve([])
        )
    }

    // TODO is this check really neccessary? How could it happen?
    protected provideForOpened<T>(uri: string, provider: (uri: string) => PromiseLike<T>): PromiseLike<T> {
        if (!Workspace.isOpened(monaco.Uri.parse(uri))) {
            return Promise.reject<T>(new Error(`A document for the given uri has not been opened yet, uri "${uri}"`));
        }
        return provider(uri);
    }

    protected isLanguageSupported(languageId:string): boolean {
        return this._languages.map(l => l.languageId).indexOf(languageId) !== -1;
    }

}