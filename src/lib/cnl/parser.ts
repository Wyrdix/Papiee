import nearley from 'nearley';

import rules from './cnl_tactic_specifier';
import tactic_grammar, { type ParseResult } from './cnl_grammar';

const { Grammar, Parser } = nearley;

export const grammar = Grammar.fromCompiled(rules);

export function parse_proposition(
	value: string,
	state?: string[]
): { offset: number; result: ParseResult; state: string[] } | undefined {
	const compiled_rules = tactic_grammar(undefined, state);
	const grammar = Grammar.fromCompiled(compiled_rules);
	const parser = new Parser(grammar);

	let max: { offset: number; result: ParseResult; state: string[] } | undefined = undefined;
	for (let i = 0; i < value.length; i++) {
		try {
			parser.feed(value[i]);
		} catch (e) {
			break;
		}

		const results = parser.results as { state: string[]; result: ParseResult }[];
		if (results.length === 0) continue;
		const { state, result } = results[0];
		max = {
			offset: i + 1,
			result,
			state
		};
	}

	return max;
}

export function parse_proposition_chained(value: string, state: string[] = []) {
	let _state = [...state];
	let _offset = 0;

	let result: ReturnType<typeof parse_proposition> = undefined;
	let parsed: ParseResult[] = [];
	do {
		result = parse_proposition(value.substring(_offset), _state);
		if (!result) continue;
		_offset += result.offset;
		_state = result.state;
		parsed.push(result.result);
	} while (result);

	return {
		result: parsed,
		state: _state,
		offset: _offset
	};
}
