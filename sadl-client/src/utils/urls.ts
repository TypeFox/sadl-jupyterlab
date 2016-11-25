
export class URLs {

    constructor(location: any) {
        this._location = location
    }

    /**
     * websocket url e.g. for lsp 
     */
    getWebSocketUrl(port: number, path: string): string {
        if (this._location.protocol === 'https:') {
            return this.getUrl(port, path, 'wss:')
        }
        return this.getUrl(port, path, 'ws:')
    }

    /**
     *  http/https url
     */
    getUrl(port: number, path: string, protocol: string = this._location.protocol): string {
        let contextPath = this.getContextPath()
        let host = this._location.hostname
        let proxyPort = 8080
        if (this._location.protocol === 'https:') {
            proxyPort = 8443
        }
        if (host === 'localhost') {
            // devmode
            return protocol + '//' + host + `:${port}` + contextPath + path
        }
        return protocol + '//' + host + `:${proxyPort}` + contextPath + `/p${port}` + path
    }

    /**
     * R helpserver url
     */
    getHelpServerURL(path: string) {
        return this.getUrl(33100, path)
    }

    // compute the prefix before the sadl segment, and reappend it.
    // this will make sure that any segments inserted by a proxy are retained. 
    getContextPath(): string {
        return this._location.pathname.substr(0, this._location.pathname.length - "/sadl".length)
    }

    private _location: Location;
}

export namespace Schemas {
    export const http: string = 'http';
    export const https: string = 'https';
}