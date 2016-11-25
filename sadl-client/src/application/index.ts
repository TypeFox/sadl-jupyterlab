import {
    JupyterLab
} from 'jupyterlab/lib/application';

export class SADL extends JupyterLab {

    protected evtKeydown(event: KeyboardEvent): void {
        if (!event.defaultPrevented) {
            super.evtKeydown(event);
        }
    }

}