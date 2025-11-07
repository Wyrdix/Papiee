import type { CompiledRules } from 'nearley';
import { attach_grammar } from './cnl_tactic_to_grammar';
import nearley from 'nearley';
import rules, { type Specification, type StateAction } from './cnl_tactic_specifier';
import type { ParseError } from '$lib/parsing';
import tactic_grammar, { type ParseResult } from './cnl_grammar';

const { Grammar, Parser } = nearley;
const grammar = Grammar.fromCompiled(rules);

const newSpecificationParser = () => new Parser(grammar);
const fromStringToSpecification = (v: string) => {
	const parser = newSpecificationParser();

	try {
		parser.feed(v);
	} catch (e) {
		return e as ParseError;
	}
	return parser.results[0]! as Specification;
};

export type CnlTactic<T = any> = {
	name?: string;
	textual: string;
	spec: Specification;
	grammar?: CompiledRules;
	transformer: Transformer<T>;
};

export function resolve_state_actions(state: string[], actions: StateAction[]) {
	const _state = [...state];

	actions.forEach((action) => {
		switch (action.action) {
			case 'pop': {
				_state.pop();
				break;
			}
			case 'push': {
				_state.push(action.value);
				break;
			}
		}
	});

	return _state;
}

const registry: CnlTactic[] = [];

export function getTactics() {
	return Array.from(registry);
}

export type TransformerContext<T = any> = {
	value: T;
};

export type Transformer<T> = (value: TransformerContext<T>) => string;

export function createTacticFromTextual<T = any>(
	name: string | undefined,
	textual: string,
	transformer: Transformer<T>
) {
	const spec = fromStringToSpecification(textual.trim());

	if ('name' in spec) {
		throw spec;
	}

	const cnl: CnlTactic = {
		name,
		textual,
		spec,
		transformer
	};
	attach_grammar(cnl);

	const existing = registry.find((v) => v.textual === textual);

	if (existing && existing.name === name) return existing;
	if (existing && existing.name !== name) {
		throw new Error(
			'Should not register multiple tactics with the same specification but different name'
		);
	}
	registry.push(cnl);
	return cnl;
}
