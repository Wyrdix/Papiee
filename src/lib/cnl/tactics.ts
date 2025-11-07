import { createTacticFromTextual } from './cnl_tactic';

const INTROS = createTacticFromTextual<{ name: string }>(
	undefined,
	'{|Let $|name|$.|}',
	({ value }) => `intros ${value.name}.`
);

const ASSUME = createTacticFromTextual<{ prop: string }>(
	undefined,
	'{|Assume that $|prop|$.|}',
	({ value }) => `intros ${value.prop}.`
);
