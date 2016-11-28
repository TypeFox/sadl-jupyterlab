export class EvaluationResultViewZone implements monaco.editor.IViewZone {

    public domNode: HTMLElement;

    constructor(
        public afterLineNumber: number,
        public heightInLines: number = 1,
        public heightInPx: number = undefined,
        public suppressMouseDown: boolean = true) {

        this.domNode = document.createElement('div');
    }

}