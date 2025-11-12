import type { CompiledRules, Grammar, ParserRule, Symbol } from 'nearley';
import type { CnlTactic } from './cnl_tactic';
import { Lexer } from './lexer';
import type { Reference, SpecificationContentNode, Text } from './cnl_tactic_specifier';

export function filterToName(filter?: string): string {
	if (filter === '*') return 'ANYTHING';
	if (!filter) return `FILTER_DEFAULT`;
	return `FILTER_${filter.toUpperCase()}`;
}

export function create_token(t: { type: string }, values?: string[]): Symbol {
	return {
		test: (v: any) => {
			if ('value' in v && values?.includes(v.value)) return true;
			return (
				(typeof v === 'object' && 'token' in v && v.token === t.type) ||
				('type' in v && v.type === t.type)
			);
		},
		token: t.type
	} as Symbol;
}

export function generate(): string {
	return crypto.randomUUID().replace('-', '_');
}

export function attach_grammar(tactic: CnlTactic): CompiledRules {
	const reference_value_type: Map<string, 'unique' | 'list'> = new Map();
	const regitered_tokens: ({ literal: string } | { token: string })[] = [];

	const _space_0_id = generate() + '#SPACE_0';
	const _space_1_id = generate() + '#SPACE_1';
	const SPACE_0: ParserRule[] = [
		{ name: _space_0_id, symbols: [_space_1_id, _space_0_id] },
		{ name: _space_0_id, symbols: [] }
	];
	const SPACE_1: ParserRule[] = [
		{ name: _space_1_id, symbols: [{ literal: ' ' }], postprocess: (d) => d[0].text }
	];

	const _everything = generate() + '#EVERYTHING';
	const EVERYTHING: ParserRule[] = [
		{
			name: _everything,
			symbols: [
				{
					test: (v: any) => {
						if (typeof v === 'object' && 'value' in v) v = v.value;
						return typeof v === 'string' && v !== '$';
					}
				} as Symbol,
				_everything
			],
			postprocess(d, loc, reject) {
				return d
					.flat()
					.map((v) => (typeof v === 'string' ? v : v?.value || ''))
					.join('');
			}
		},
		{
			name: _everything,
			symbols: [
				{
					test: (v: any) => {
						if (typeof v === 'object' && 'value' in v) v = v.value;
						return v !== '$' || (typeof v === 'object' && v.type === 'stop_everything');
					}
				} as Symbol
			],
			postprocess(d, loc, reject) {
				if (typeof d[0] === 'object' && d[0].type === 'stop_everything') return undefined;
				return d
					.flat()
					.map((v) => (typeof v === 'string' ? v : v.value))
					.join('');
			}
		}
	];

	const spec = tactic.spec;

	function specification_node(v: SpecificationContentNode): [string, ParserRule[]] {
		switch (v.type) {
			case 'text':
				return text(v);
			case 'reference':
				return reference(v);
			default:
				throw new Error(`${v as any} is unknown`);
		}
	}

	function text(v: Text): [string, ParserRule[]] {
		const id = generate();

		[...v.value]
			.filter((c) => !regitered_tokens.find((o) => 'literal' in o && o.literal === c))
			.map((c) => ({ literal: c }))
			.map((c) => regitered_tokens.push(c));

		return [
			id,
			[
				{
					name: id,
					symbols: [...v.value].map((v) => ({ literal: v })),
					postprocess(v) {
						return v.map((v) => v.text).join('');
					}
				}
			]
		];
	}

	function reference(v: Reference): [string, ParserRule[]] {
		const id = generate() + '_' + v.value + '#REF' + v.value;
		if (reference_value_type.has(v.value)) reference_value_type.set(v.value, 'list');
		else reference_value_type.set(v.value, 'unique');

		return [
			id,
			[
				{
					name: id,
					symbols: [_everything],
					postprocess(d, loc, reject) {
						return {
							type: v.value,
							value: d[0]
						};
					},
					test: 1
				} as ParserRule
			]
		];
	}

	const compiled_content = spec.content.map((v) => specification_node(v));

	const main_rule: ParserRule[] = [
		{
			name: filterToName(spec.header.state),
			symbols: [_space_0_id, ...compiled_content.map((v) => v[0]), _space_0_id],
			postprocess(v) {
				const references = v
					.flat(Infinity)
					.filter((v) => typeof v === 'object')
					.map((v) => v as { type: string; value: string });

				const keys = [...new Set(references.map((v) => v.type))];

				return {
					tactic,
					value: Object.fromEntries(
						keys.map((v) => {
							const values = references.filter((o) => o.type === v);

							if (values.length === 1 && reference_value_type.get(values[0].type) === 'unique')
								return [v, values[0].value];
							return [v, values.map((o) => o.value)];
						})
					)
				};
			}
		}
	];

	const grammar = {
		Lexer: new Lexer(),
		ParserRules: compiled_content
			.map((v) => v[1])
			.flat()
			.concat(...SPACE_0, ...SPACE_1, ...EVERYTHING)
			.concat(main_rule),
		ParserStart: filterToName(spec.header.state)
	};
	tactic.grammar = grammar;

	return grammar;
}
