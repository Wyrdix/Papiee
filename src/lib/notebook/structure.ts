import type { Widget, WidgetValue } from './widgets/types';

export type NotebookNode<U, T> = { type: U; children: T[] };

export interface RootWidgetMap {}

const REGISTRY: Partial<RootWidgetMap> = {};

export function register<
	T extends RootWidgetMap[keyof RootWidgetMap],
	U extends T['type'] & keyof RootWidgetMap
>(value: U, constructor: () => T) {
	(REGISTRY as any)[value] = constructor();
}

export function getWidgets(only_rootable?: boolean): Widget[] {
	return Object.values(REGISTRY)
		.map((v) => v as unknown as Widget)
		.filter((v) => !only_rootable || (only_rootable && 'name' in v));
}

export function getWidget<T extends keyof RootWidgetMap>(value: T) {
	return REGISTRY[value];
}

export function getWidget_unsafe(value: string) {
	return REGISTRY[value as keyof RootWidgetMap]! as unknown as Widget;
}

export type NotebookState = {
	title: string;
	widgets: WidgetValue[];
};
