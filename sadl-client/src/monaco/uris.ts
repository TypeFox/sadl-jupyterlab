import {
    IServiceManager
} from 'jupyterlab/lib/services';

import {
    JupyterLab
} from 'jupyterlab/lib/application';

import * as notebook from '../utils/notebook';

export function getExtension(uri: monaco.Uri): string | null {
    const path = uri.path;
    const index = path.lastIndexOf('.');
    return index === -1 ? null : path.substring(index);
}

export interface IPathResolver {
    resolve(uri: monaco.Uri): string;
}

export interface IPathHandler {
    open(path: string, sideBySide?: boolean): Promise<{}>
    loadContent(path: string): Promise<string>
}

export interface IUriHandler {
    open(uri: monaco.Uri, sideBySide?: boolean): Promise<{}>
    loadContent(uri: monaco.Uri): Promise<string>
}

export class PathResolver implements IPathResolver {

    resolve(uri: monaco.Uri): string {
        return notebook.resolvePath(uri.path);
    }

}

export class PathHandler implements IPathHandler {

    constructor(
        protected app: JupyterLab,
        protected serviceManager: IServiceManager
    ) {
    }

    open(path: string, sideBySide?: boolean): Promise<{}> {
        return this.app.commands.execute('file-operations:open', { path });
    }

    loadContent(path: string): Promise<string> {
        return this.serviceManager.contents.get(path).then(file => file.content);
    }

}

export class UriHandler implements IUriHandler {

    constructor(
        protected pathResolver: IPathResolver,
        protected pathHandler: IPathHandler
    ) {
    }

    open(uri: monaco.Uri, sideBySide?: boolean): Promise<{}> {
        const path = this.pathResolver.resolve(uri);
        return this.pathHandler.open(path, sideBySide);
    }

    loadContent(uri: monaco.Uri): Promise<string> {
        const path = this.pathResolver.resolve(uri);
        return this.pathHandler.loadContent(path);
    }

}

export const defaultPathResolver = new PathResolver();