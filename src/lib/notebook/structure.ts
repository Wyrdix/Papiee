export type NotebookNode<U, T> = { type: U; children: T[] };

export interface RootWidgetMap {}

const REGISTRY: Partial<RootWidgetMap> = {};

export function register<
	T extends RootWidgetMap[keyof RootWidgetMap],
	U extends T['name'] & keyof RootWidgetMap
>(value: U, constructor: () => T) {
	REGISTRY[value] = constructor();
}

export function getWidgets(): RootWidgetMap[keyof RootWidgetMap][] {
	return Object.values(REGISTRY) as RootWidgetMap[keyof RootWidgetMap][];
}

export function getWidget<T extends keyof RootWidgetMap>(value: T) {
	return REGISTRY[value];
}
