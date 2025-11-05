import { ResolvedPos } from 'prosemirror-model';

declare module 'prosemirror-model' {
	interface ResolvedPos {
		$(pos: number): ResolvedPos;
		$start(depth?: number | null): ResolvedPos;
		$end(depth?: number | null): ResolvedPos;
		$before(depth?: number | null): ResolvedPos;
		$after(depth?: number | null): ResolvedPos;
		$posAtIndex(index: number, depth?: number | null): ResolvedPos;
		$decrement(): ResolvedPos;
		$increment(): ResolvedPos;
	}
}

ResolvedPos.prototype.$ = function (v) {
	return this.doc.resolve(v);
};

ResolvedPos.prototype.$start = function (depth) {
	return this.$(this.start(depth));
};
ResolvedPos.prototype.$end = function (depth) {
	return this.$(this.end(depth));
};
ResolvedPos.prototype.$before = function (depth) {
	return this.$(this.before(depth));
};
ResolvedPos.prototype.$after = function (depth) {
	return this.$(this.after(depth));
};
ResolvedPos.prototype.$posAtIndex = function (index, depth) {
	return this.$(this.posAtIndex(index, depth));
};
ResolvedPos.prototype.$decrement = function () {
	return this.$(this.pos - 1);
};
ResolvedPos.prototype.$increment = function () {
	return this.$(this.pos + 1);
};
