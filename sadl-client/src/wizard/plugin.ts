import { IServiceManager } from 'jupyterlab/lib/services';
import { KernelMessage, Kernel, Session, Contents, utils } from '@jupyterlab/services';
import { JupyterLab, JupyterLabPlugin } from 'jupyterlab/lib/application';
import { IMainMenu, MainMenu } from 'jupyterlab/lib/mainmenu';
import { Menu } from 'phosphor/lib/ui/menu';
import { filter, some, map } from 'phosphor/lib/algorithm/iteration';
import { ICommandPalette } from 'jupyterlab/lib/commandpalette';
import { IPathTracker, FileBrowserModel } from 'jupyterlab/lib/filebrowser';
import * as dialogs from '../utils/dialogs';
import { FileCreator, suggestName } from '../utils/files';
import * as templates from './templates';
import { IDocumentRegistry } from 'jupyterlab/lib/docregistry';

export const cmdIds = {
    createSadlProject: 'wizard:createSadlProject'
};

/**
 * initializer
 */
export const wizardExtension: JupyterLabPlugin<void> = {
    id: 'jupyter.extensions.wizard',
    requires: [IServiceManager, IDocumentRegistry, IMainMenu, ICommandPalette, IPathTracker],
    activate: activateWizardPlugin,
    autoStart: true
};

function activateWizardPlugin(app: JupyterLab, manager: IServiceManager, registry: IDocumentRegistry, mainMenu: IMainMenu, palette: ICommandPalette, pathTracker: IPathTracker): void {

    createCommands(app, manager.contents, pathTracker, palette);

    addToFileMenu(mainMenu, cmdIds)
    // re-add menu on File menu rebuild
    registry.changed.connect((sender, args) => {
        if (args.type === 'fileCreator') {
            addToFileMenu(mainMenu, cmdIds)
        }
    });
}

function createCommands(app: JupyterLab, fileManager: Contents.IManager, pathTracker: IPathTracker, palette: ICommandPalette) {
    app.commands.addCommand(cmdIds.createSadlProject, {
        label: 'New Sadl Project',
        execute: () => sadlProjectCreator(fileManager, pathTracker)
    });
    [
        cmdIds.createSadlProject
    ].forEach(command => { palette.addItem({ command: command, category: 'Wizards' }) });

}

function addToFileMenu(mainMenu: IMainMenu, cmd: any, atIndex = 0) {
    let fileMenu = filter((<MainMenu>mainMenu).menus, topMenuEntry => topMenuEntry.commands.hasCommand("file-operations:save")).next()
    if (fileMenu) {
        [
            cmd.createSadlProject
        ].forEach(commandToAdd => {
            fileMenu.insertItem(atIndex, {
                command: commandToAdd
            })
        });

    }
}

const sadlProjectCreator = (fileManager: Contents.IManager, pathTracker: IPathTracker) => {
    let currentRoot = pathTracker.path
    fileManager.get(currentRoot).then(root => {
        let suggestedName = suggestName("sadl-project", toFileNameIterator(root))
        let inputValidator = (input: string) => !some(toFileNameIterator(root), fileName => fileName == input)
        let onSuccess = (input: string) => {
            let fc = new FileCreator(fileManager, currentRoot)
            fc.createFolder(input)
                .then(contents => {
                    fc.forPath(contents.path).createTextFile(".project", templates.sadl_proj_descr(input))
                        .then(file => {
                            (<FileBrowserModel>pathTracker).cd('.');
                        }).catch(error => {
                            dialogs.showErrorReport('Create file Error', error);
                        });
                    fc.forPath(contents.path).createTextFile("Shape.sadl", templates.sadl_proj_Shape_sadle())
                }).catch(error => {
                    dialogs.showErrorReport('Create Folder Error', error);
                });
        }
        dialogs.askUser("Enter Project Name", "Project name", suggestedName, inputValidator, onSuccess);
    })
}

function toFileNameIterator(root: any) {
    return map(<Contents.IModel[]>root.content, file => file.name)
}

