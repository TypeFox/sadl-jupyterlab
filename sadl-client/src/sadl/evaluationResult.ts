import * as dom from './dom';
import { EvaluationResultData } from './evaluationResultData'
import { EvaluationResultViewZone } from './EvaluationResultViewZone'
import './sadl.css'

export class EvaluationResult implements monaco.editor.IContentWidget {

    private static ID: number = 0;

    private widgedId: string;

    protected viewZoneId: number;
    protected decorationId: string;
    protected element: ElementDetails;
    protected editor: monaco.editor.ICodeEditor;
    protected viewZone: monaco.editor.IViewZone;
    protected expanded: boolean = false;

    constructor(editor: monaco.editor.ICodeEditor, data: EvaluationResultData, viewChangeAccessor: monaco.editor.IViewZoneChangeAccessor) {
        this.editor = editor;
        this.widgedId = 'evaluation-result-widget' + (++EvaluationResult.ID);

        const range = data.range;
        this.decorationId = editor.deltaDecorations([], [{ range, options: {} }])[0];
        this.viewZone = new EvaluationResultViewZone(data.range.endLineNumber);
        this.element = this.createEvaluationResultElement();
        this.setData(data);
        this.viewZoneId = viewChangeAccessor.addZone(this.viewZone);

        this.editor.addContentWidget(this);

        dom.addDisposableListener(this.element.node, 'click', (e) => {
            let element = <HTMLElement>e.target;
            if (element.tagName === 'A' && element.id) {
                this.expanded = !this.expanded;
                // TODO figure out a better way (if any) than remove + add. 
                this.editor.removeContentWidget(this)
                this.element = this.createEvaluationResultElement();
                this.setData(data);
                this.viewZone.heightInLines = this.expanded ? this.element.heightInLines : 1;
                editor.changeViewZones((accessor) => {
                    this.update(accessor);
                    this.editor.addContentWidget(this);
                });
            }
        });
    }

    getId(): string {
        return this.widgedId;
    }

    getDomNode(): HTMLElement {
        return this.element.node;
    }

    getPosition(): monaco.editor.IContentWidgetPosition {
        const lineNumber = this.viewZone.afterLineNumber;
        return {
            position: {
                column : 0,
                lineNumber
            },
            preference: [monaco.editor.ContentWidgetPositionPreference.BELOW]
        };
    }

    isValid(): boolean {
        const range = this.getRange();
        if (range) {
            return !range.isEmpty();
        }
        return false;
    }

    dispose(viewZoneChangeAccessor: monaco.editor.IViewZoneChangeAccessor): void {
        this.editor.deltaDecorations([this.decorationId], []);
        viewZoneChangeAccessor.removeZone(this.viewZoneId);
    }

    match(data: EvaluationResultData): boolean {
        const range = this.getRange();
        if (range) {
            const intersection = range.intersectRanges(data.range);
            return !!intersection;
        }
        return false;
    }

    escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    update(viewZoneChangeAccessor: monaco.editor.IViewZoneChangeAccessor): void {
        const range = this.getRange();
        if (range) {
            const newStartLine = this.updateStartLine(range);

            if (newStartLine !== range.startLineNumber) {
                const newRange = new monaco.Range(newStartLine, 0, range.endLineNumber, range.endColumn);
                const decorationOptions: monaco.editor.IModelDecorationOptions = { };
                this.decorationId = this.editor.deltaDecorations([this.decorationId], [{ range: newRange, options: decorationOptions }])[0];
            }

            this.viewZone.afterLineNumber = range.endLineNumber;
            viewZoneChangeAccessor.layoutZone(this.viewZoneId);
            this.editor.layoutContentWidget(this);
        }
    }

    protected getRange(): monaco.Range | null {
        return this.editor.getModel().getDecorationRange(this.decorationId);
    }

    protected isEmptyLine(lineNumber: number): boolean {
        return this.editor.getModel().getLineContent(lineNumber).trim().length === 0;
    }

    protected updateStartLine(range: monaco.IRange): number {
        let lineNumber = range.startLineNumber;
        while (lineNumber <= range.endLineNumber && this.isEmptyLine(lineNumber)) {
            lineNumber = lineNumber + 1;
        }
        return lineNumber;
    }

    protected setData(data: EvaluationResultData) {
        const node = this.element.node;
        node.style.background = data.successful ? '#C7F2B1' : '#F2BBB1';
        this.element.heightInLines = 1;
        if (this.expanded) {
            this.element.heightInLines = (data.value.match(/\n/g) || []).length + 1;
            node.style.whiteSpace = 'pre-wrap';
        }
        const segments = data.value.split('\n') || [''];
        const multiline = segments.length > 1;
        const html: string[] = [];

        const height = this.editor.getConfiguration().fontInfo.fontSize;
        const imageClassName = this.expanded ? 'collapse-icon' : 'expand-icon'
        const svg = multiline ? `<image class="${imageClassName}" style="width:${height}px;height:${height}px;"/>` : undefined;
        if (svg) {
            html.push(svg);
        }
        html.push(this.expanded || !multiline ? this.escapeHtml(data.value) : `<a id="anchor-${this.widgedId}">${this.escapeHtml(segments[0])} ${multiline ? '...' : ''}</a>`);
        node.style.width = `${this.editor.getLayoutInfo().width}px`
        node.style.height = `${(this.expanded ? segments.length : 1) * this.editor.getConfiguration().lineHeight}px`;
        const innerHTML = html.join('<span>&nbsp;</span>');
        node.innerHTML = innerHTML;
    }

    protected createEvaluationResultElement(): ElementDetails {
        const node = document.createElement('div');
        dom.addClass(node, 'codelens-decoration');
        node.style.fontSize = '12px';
        node.style.fontFamily = 'Menlo, Monaco, \'Courier New\', monospace';
        node.style.lineHeight = '18px';
        node.style.fontStyle = 'italic';
        return {
            node
        };
    }

}

export interface ElementDetails {
    node: HTMLElement,
    heightInLines?: number;
    heightInPx?: number;
}

