import { Disposable } from './disposable'

/**
 * Adds the provided className to the provided node. This is a no-op
 * if the class is already set.
 * @param node a dom node
 * @param className a class name
 */
export function addClass(node: HTMLElement, className: string): void {
    if (!node.className) { // doesn't have it for sure
        node.className = className;
    } else {
        _findClassName(node, className); // see if it's already there
        if (lastStart === -1) {
            node.className = node.className + ' ' + className;
        }
    }
}

let lastStart: number;
let lastEnd: number;

function _findClassName(node: HTMLElement, className: string): void {

	let classes = node.className;
	if (!classes) {
		lastStart = -1;
		return;
	}

	className = className.trim();

	let classesLen = classes.length,
		classLen = className.length;

	if (classLen === 0) {
		lastStart = -1;
		return;
	}

	if (classesLen < classLen) {
		lastStart = -1;
		return;
	}

	if (classes === className) {
		lastStart = 0;
		lastEnd = classesLen;
		return;
	}

	let idx = -1,
		idxEnd: number;

	while ((idx = classes.indexOf(className, idx + 1)) >= 0) {

		idxEnd = idx + classLen;

		// a class that is followed by another class
		if ((idx === 0 || classes.charCodeAt(idx - 1) === monaco.KeyCode.Space) && classes.charCodeAt(idxEnd) === monaco.KeyCode.Space) {
			lastStart = idx;
			lastEnd = idxEnd + 1;
			return;
		}

		// last class
		if (idx > 0 && classes.charCodeAt(idx - 1) === monaco.KeyCode.Space && idxEnd === classesLen) {
			lastStart = idx - 1;
			lastEnd = idxEnd;
			return;
		}

		// equal - duplicate of cmp above
		if (idx === 0 && idxEnd === classesLen) {
			lastStart = 0;
			lastEnd = idxEnd;
			return;
		}
	}

	lastStart = -1;
}
class DomListener extends Disposable {

	private _usedAddEventListener: boolean;
	private _wrapHandler: (e: any) => void;
	private _node: any;
	private _type: string;
	private _useCapture: boolean;

	constructor(node: Element | Window | Document, type: string, handler: (e: any) => void, useCapture?: boolean) {
		super();

		this._node = node;
		this._type = type;
		this._useCapture = (useCapture || false);

		this._wrapHandler = (e) => {
			e = e || window.event;
			handler(e);
		};

		if (typeof this._node.addEventListener === 'function') {
			this._usedAddEventListener = true;
			this._node.addEventListener(this._type, this._wrapHandler, this._useCapture);
		} else {
			this._usedAddEventListener = false;
			this._node.attachEvent('on' + this._type, this._wrapHandler);
		}
	}

	public dispose(): void {
		if (!this._wrapHandler) {
			// Already disposed
			return;
		}

        if (this._usedAddEventListener) {
            this._node.removeEventListener(this._type, this._wrapHandler, this._useCapture);
        } else {
            this._node.detachEvent('on' + this._type, this._wrapHandler);
        }

		// Prevent leakers from holding on to the dom or handler func
        this._node = null;
        this._wrapHandler = null;
    }
}

export function addDisposableListener(node: Element, type: string, handler: (event: any) => void, useCapture?: boolean): monaco.IDisposable;
export function addDisposableListener(node: Element | Window, type: string, handler: (event: any) => void, useCapture?: boolean): monaco.IDisposable;
export function addDisposableListener(node: Window, type: string, handler: (event: any) => void, useCapture?: boolean): monaco.IDisposable;
export function addDisposableListener(node: Document, type: string, handler: (event: any) => void, useCapture?: boolean): monaco.IDisposable;
export function addDisposableListener(node: any, type: string, handler: (event: any) => void, useCapture?: boolean): monaco.IDisposable {
    return new DomListener(node, type, handler, useCapture);
}