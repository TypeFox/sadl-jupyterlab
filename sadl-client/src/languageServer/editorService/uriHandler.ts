import {
    IUriHandler
} from '../../monaco/uris';

import {
    findLanguageForPath
} from 'jupyterlab/lib/monaco/languages';


export default class JLabHandler implements IUriHandler {

    constructor(private uriHandler: IUriHandler) {
    }

    open(uri: monaco.Uri, sideBySide?: boolean): Promise<{}> {
        return new Promise(resolve => {
            const languageId = findLanguageForPath(uri.path);
            if (!languageId) {
                resolve(this.uriHandler.open(uri, sideBySide));
            }
        });
    }

    loadContent(uri: monaco.Uri): Promise<string> {
        return this.uriHandler.loadContent(uri);
    }

}