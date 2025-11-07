import nearley from 'nearley';

import rules, { type StructureSpecification } from './cnl_tactic_specifier';
import tactic_grammar, { type ParseResult } from './cnl_grammar';

const { Grammar, Parser } = nearley;

export const grammar = Grammar.fromCompiled(rules);

export type CNLParseResult = {
	offset: number;
	result: ParseResult;
	state: string[];
};

export type CNLParseResultChained = {
	offset: number;
	result: ParseResult[];
	state: string[];
	action?: StructureSpecification['specification'];
};

export function parse_cnl(value: string, state?: string[]): CNLParseResult | undefined {
	const compiled_rules = tactic_grammar(undefined, state);
	const grammar = Grammar.fromCompiled(compiled_rules);
	const parser = new Parser(grammar);

	let max: CNLParseResult | undefined = undefined;
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

export function parse_cnl_chained(value: string, state: string[] = []): CNLParseResultChained {
	let _state = [...state];
	let _offset = 0;

	let result: ReturnType<typeof parse_cnl> = undefined;
	let parsed: ParseResult[] = [];
	do {
		result = parse_cnl(value.substring(_offset), _state);
		if (!result) continue;
		_offset += result.offset;
		_state = result.state;
		parsed.push(result.result);
	} while (result && !result.result.tactic.spec.footer.structure);

	return {
		result: parsed,
		state: _state,
		offset: _offset,
		action: parsed[parsed.length - 1]?.tactic?.spec?.footer?.structure?.specification
	};
}
