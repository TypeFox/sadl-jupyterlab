import * as is from 'vscode-jsonrpc/lib/is'

export abstract class Disposable implements monaco.IDisposable {

	private _toDispose: monaco.IDisposable[];

	constructor() {
		this._toDispose = [];
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	protected _register<T extends monaco.IDisposable>(t: T): T {
		this._toDispose.push(t);
		return t;
	}
}

export function dispose<T extends monaco.IDisposable>(...disposables: T[]): T;
export function dispose<T extends monaco.IDisposable>(disposables: T[]): T[];
export function dispose<T extends monaco.IDisposable>(...disposables: T[]): T[] {
	const first = disposables[0];

	if (is.array(first)) {
		disposables = first as any as T[];
	}

	disposables.forEach(d => d && d.dispose());
	return [];
}