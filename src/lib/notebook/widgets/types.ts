import type { Component } from 'svelte';

export type Widget<
	Position = unknown,
	Type extends string = string,
	Value extends WidgetValue<Position> = WidgetValue<Position, Type>,
	TrimmedValue = never
> = (
	| {
			name: string;
			icon?: Component;
	  }
	| {}
) & {
	type: Type;

	trim(value: Value): TrimmedValue;
	untrim(trimmed: TrimmedValue): Value;
	initial(): Value;
	component: Component<WidgetProps<Value>>;
} & PositionHelper<Value, Position>;

export type WidgetValue<Position = unknown, Type extends string = string> = {
	type: Type;
	position?: Position | undefined;
};

export type TrimmedWidgetValue<T> = T extends { trim: (...args: any) => infer O } ? O : never;

export type PositionHelper<Value extends any, Position> = {
	isLast(value: Value): boolean;
	isFirst(value: Value): boolean;

	// Should get the current position stored in the value
	// Maybe undefined if element is not focused
	get(value: Value): Position | undefined;
	getBegin(value: Value): Position;
	getEnd(value: Value): Position;

	moveLeft(value: Value): Position; // Should "decrement" the position
	moveRight(value: Value): Position; // Should "increment" the position
	moveTo(value: Value, position?: Position): Value;
};

export type WidgetProps<Value extends WidgetValue = WidgetValue> = {
	/**
	 * The current value of the widget
	 *
	 */
	readonly value: Value;
	/**
	 * Should change the position of the node option tooltip
	 * @param node The new element node for the node option tooltip to be anchored vertically to
	 * @returns
	 */
	setAnchorNode: (node: HTMLElement | undefined) => void;
	/**
	 * Is called by the widget for the parent to register that its value changed
	 * The parent should use this function to update it's memory
	 * @param old_value The value before the update
	 * @param new_value The value after the update
	 * @returns
	 */
	onNodeValueUpdate: (old_value: Value, new_value: Value) => void;
	/**
	 * Enable widgets to behave differently if they are the currently anchored widget
	 * @returns
	 */
	isAnchored: () => boolean;

	/**
	 * Enable widgets views to render differently if the document is being viewed by a teacher or a student
	 */
	mode: 'teacher' | 'student';
};
