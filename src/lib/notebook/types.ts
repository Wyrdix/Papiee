export type Widget<
	Position = unknown,
	Value extends WidgetValue<Position> = WidgetValue<Position>,
	ToKeepWhenTrimmed extends keyof Value = keyof Value
> = {
	name: string;

	trim(value: Value): Pick<Value, ToKeepWhenTrimmed>;
	untrim(trimmed: Pick<Value, ToKeepWhenTrimmed>): Value;
	initial(): Value;
} & PositionHelper<Value, Position>;

export type WidgetValue<Position = unknown> = {
	position: Position;
};

export type PositionHelper<Value extends WidgetValue, Position> = {
	isLast(v: Value, position: Position): boolean;
	isFirst(v: Value, position: Position): boolean;
	focusBegin(v: Value): Position;
	focusEnd(v: Value): Position;

	moveLeft(v: Value, position: Position): Position; // Should "decrement" the position
	moveRight(v: Value, position: Position): Position; // Should "increment" the position
	moveTo(v: Value, position: Position): void;
};
