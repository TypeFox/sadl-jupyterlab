import {
    createMessageConnection, MessageConnection
} from 'vscode-jsonrpc';

import {
    JupyterLab, JupyterLabPlugin
} from 'jupyterlab/lib/application';

import {
    IDocumentRegistry
} from 'jupyterlab/lib/docregistry'

import {
    IEditorServices
} from 'jupyterlab/lib/codeeditor';

import {
    IServiceManager
} from 'jupyterlab/lib/services';

import {
    LanguageDescription
} from '../languageserver/protocol/registry';

import {
    workspace
} from './protocol/workspace'

import { WebSocketMessageWriter } from './protocol/webSocketMessageWriter'
import { WebSocketMessageReader } from './protocol/webSocketMessageReader'
import { ConsoleLogger } from './protocol/services'
import { LanguageClient } from './protocol/languageClient'
import { URLs } from '../utils/urls'
import { createWebSocket } from './utils/utils'

import * as factory from '../monaco/standalone/factory';

import {
    LanguageServerAwareEditorWidget
} from './editor/widget';

import {
    registerLanguage, ILanguage
} from 'jupyterlab/lib/monaco';

import {
    MonacoEditor
} from '../monaco/editor';

import {
    sadlLanguage, InferenceEditorService, InferenceResultProvider
} from '../sadl';

import {
    IEditorTracker
} from 'jupyterlab/lib/editorwidget';

export const COMMANDS = {
    runSelection: 'editor:runSelection',
    sourceFile: 'editor:sourceFile'
};

export const languageServerExtension: JupyterLabPlugin<void> = {
    id: 'sadl.extensions.languageServer',
    requires: [
        IDocumentRegistry,
        IEditorTracker,
        IEditorServices,
    ],
    activate: activateLanguageServer,
    autoStart: true
};

function activateLanguageServer(
    app: JupyterLab,
    registry: IDocumentRegistry,
    serviceManager: IServiceManager,
    editorServices: IEditorServices,
    editorTracker: IEditorTracker): void {

    registerLanguages(app, registry, serviceManager, editorServices, editorTracker);
    doRegisterFileCreators(registry);
    openWebSocket();
}

function toMonacoLanguage(language: LanguageDescription): ILanguage {
    const extensions = language.fileExtensions.map((it) => {
        return '.' + it
    });
    return {
        id: language.languageId,
        extensions: extensions,
        aliases: language.aliases,
        mimetypes: language.mimeTypes,
        configuration: language.highlightingConfiguration,
        module: language.module
    };
}

export function registerLanguages(
    application: JupyterLab,
    registry: IDocumentRegistry,
    serviceManager: IServiceManager,
    editorServices: IEditorServices,
    editorTracker: IEditorTracker): void {

    for (const languageDescription of [sadlLanguage]) {
        const language = toMonacoLanguage(languageDescription);
        const factoryOptions: factory.IOptions = {
            sessionManager: serviceManager.sessions,
            application,
            editorServices,
            fileExtensions: language.extensions!,
            defaultFor: language.extensions,
            name: language.aliases![0] + ' Editor',
            modelName: 'text',
            preferKernel: false,
            canStartKernel: false,
            editorWidgetProvider: options => {
                const editorWidget = new LanguageServerAwareEditorWidget(options);
                editorWidget.languageId = language.id;
                return editorWidget;
            }
        };

        const editorFactory = new factory.DocumentEditorFactory(factoryOptions);
        editorFactory.widgetCreated.connect((factory, panel) => { });

        registry.addWidgetFactory(editorFactory);
        registerLanguage(language);
    }
}

export function doRegisterFileCreators(registry: IDocumentRegistry) {
    // add creators
    [sadlLanguage]
        .forEach(language => {
            registry.addFileType({
                name: language.aliases[0],
                extension: language.fileExtensions[0],
                contentType: 'file',
                mimetype: language.mimeTypes[0]
            });
            registry.addCreator({
                name: language.aliases[0] + ' File',
                fileType: language.aliases[0]
            });
        });
}


let connection: MessageConnection = null;

function openWebSocket() {
    // http://localhost:8080/sadlmonaco
    const wsUrl = new URLs(location).getWebSocketUrl(8080, '/sadlmonaco/languageServer')
    const webSocket = createWebSocket(wsUrl)
    webSocket.addEventListener('close', (event) => {
        if (event.code !== 1000) {
            console.debug(`Error during WS reconnect:  code = ${event.code}, reason = ${event.reason}`);
        }
    });
    webSocket.addEventListener('open', () => {
        const messageWriter = new WebSocketMessageWriter(webSocket);
        const messageReader = new WebSocketMessageReader(webSocket);

        const logger = new ConsoleLogger();
        connection = createMessageConnection(messageReader, messageWriter, logger);
        const languageClient = new LanguageClient(connection, [sadlLanguage]);
        languageClient.start().then(() => {
            // send open notification for all open editors
            for (const uri in workspace.allOpened()) {
                if (workspace.allOpened().hasOwnProperty(uri)) {
                    workspace.fireOpen(monaco.Uri.parse(uri));
                }
            }
        })
        webSocket.addEventListener('close', (event) => {
            connection.dispose();
            languageClient.dispose();
        });
    });

}
