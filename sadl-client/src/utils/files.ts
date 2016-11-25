import {
  KernelMessage, Kernel, Session, Contents, utils
} from '@jupyterlab/services';

import * as dialogs from './dialogs';

import {
    IIterable, some
} from 'phosphor/lib/algorithm/iteration';

import {getNotebookPath} from "./notebook"

export class FileCreator {

    forPath(path: string): FileCreator {
        return new FileCreator(this._fileManager, path)
    }

    constructor(fileManager: Contents.IManager, path: string = "") {
        this._fileManager = fileManager
        this._path = path
    }

    createFolder(folderName: string): Promise<Contents.IModel> {
        return this._fileManager.newUntitled({
            path: this._path,
            type: 'directory'
        }).then(contents => {
            return this._fileManager.rename(contents.path, this._path + "/" + folderName)
        }).catch(error => {
            dialogs.showErrorReport('New Folder Error', error);
        });
    }

    createTextFile(fileName: string, text: string): Promise<Contents.IModel> {
        return this._fileManager.save(this._path + "/" + fileName, {
            format: 'text',
            type: 'file',
            content: text
        })
    }

    private _path: string = null
    private _fileManager: Contents.IManager = null;
}

export function toServerPath(path: string): string {
    const notebookPath = getNotebookPath();
    return utils.urlPathJoin(notebookPath, path);
}

export function suggestName(name: string, existing: IIterable<string>): string {
    let baseName = name
    let mutate = function(newName: string) {
        return newName
    }
    if (baseName.indexOf('.') > 0) {
        let split = baseName.split('.')
        let extension = split.pop()
        baseName = split.join('.')
        mutate = function (newName: string) {
            return newName + '.' + extension
        }
    }
    let suggestion = mutate(baseName)
    let i: number = 1
    while (some(existing, fName => fName === suggestion)) {
        suggestion = mutate(baseName + i)
        i = i + 1
    }
    return suggestion
}

