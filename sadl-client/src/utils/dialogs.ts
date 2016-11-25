import {
    showDialog, okButton, cancelButton
} from 'jupyterlab/lib/dialog';

export
    function showErrorReport(errorTitle: string, error: Error) {
    console.error(error);
    let options = {
        title: errorTitle,
        body: error.message,
        buttons: [okButton],
        okText: 'Dismiss'
    };
    showDialog(options).then(() => { /* no-op */ });
}

export function askUser(title: string, question: string = title, preset: string, validation: (input: string) => boolean, onSuccess: (input:string)=> void) {
    let input = document.createElement('input');
    let accept = okButton
    input.value = preset
    input.addEventListener('input', (ev: Event) => {
        let okButton = document.getElementsByClassName('jp-Dialog-okButton').item(0)
        if (!validation(input.value)) {
            okButton.classList.add('sadl-Disabled-button')
            okButton.setAttribute("disabled","")
            input.classList.add('jp-mod-conflict');
        } else {
            okButton.classList.remove('sadl-Disabled-button')
            okButton.removeAttribute("disabled")
            input.classList.remove('jp-mod-conflict');
        }
    });
    let options = {
        title: title,
        body: input,
        buttons: [accept, cancelButton]
    };
    return showDialog(options).then(button => {
        if (button.text == accept.text && !input.classList.contains('jp-mod-conflict')) {
            onSuccess(input.value)
        }
    });
}

