import {
  KernelMessage, Kernel, Session, Contents, utils
} from '@jupyterlab/services';

const NOTEBOOK_PATH = 'notebookPath';

export function toNotebookUri(...parts: string[]): string {
    const notebookPath = getNotebookPath();
    const fullPath = utils.urlPathJoin(notebookPath, ...parts);
    return toUri(fullPath);
}

export function toUri(path: string): string {
    return 'file://' + path;
}

// FIXME: make sure that the notebook path is notrmalized, without trailing slashes
export function getNotebookPath(): string {
    const result = utils.getConfigOption(NOTEBOOK_PATH);
    if (result) {
        return result;
    }
    throw Error("'jupyter-config-data' is missing '" + NOTEBOOK_PATH + "' property");
}

export function resolvePath(fullPath: string): string {
    const notebookPath = getNotebookPath();
    const index = fullPath.indexOf(notebookPath);
    if (index !== -1) {
        const relativePath = fullPath.substring(index + notebookPath.length);
        if (relativePath.charAt(0) === '/') {
            return relativePath.substring(1);
        }
        return relativePath;
    }
    throw Error(`A path relative to '${notebookPath}' path cannot be resolved for '${fullPath}' path`);
}
