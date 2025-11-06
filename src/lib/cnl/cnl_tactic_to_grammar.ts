import type { CompiledRules, Grammar, ParserRule, Symbol } from 'nearley';
import type {
	Specification,
	EndAction,
	Proposition,
	Reference,
	RepeatingPropositionRule,
	Sentence,
	SentenceNode,
	SpecificationNode,
	Text
} from './cnl_tactic_specifier';
import type { CnlTactic } from './cnl_tactic';

export function filterToName(filter?: string): string {
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

	const _space_0_id = generate();
	const _space_1_id = generate();
	const SPACE_0: ParserRule[] = [
		{ name: _space_0_id, symbols: [_space_1_id, _space_0_id] },
		{ name: _space_0_id, symbols: [] }
	];
	const SPACE_1: ParserRule[] = [
		{ name: _space_1_id, symbols: [{ literal: ' ' }], postprocess: (d) => d[0].text }
	];

	const _everything = generate();
	const EVERYTHING: ParserRule[] = [
		{
			name: _everything,
			symbols: [
				{
					test: (v: any) => v !== '$'
				} as Symbol,
				_everything
			],
			postprocess(d, loc, reject) {
				return d[0] + d[1];
			}
		},
		{
			name: _everything,
			symbols: [],
			postprocess(d, loc, reject) {
				return '';
			}
		}
	];

	const spec = tactic.spec;

	function specification_node(v: SpecificationNode): [string, ParserRule[]] {
		switch (v.type) {
			case 'text':
				return text(v);
			case 'reference':
				return reference(v);
			default:
				throw new Error(`${v as any} is unknown`);
		}
	}

	function sentence_node(v: SentenceNode): [string, ParserRule[]] {
		switch (v.type) {
			case 'proposition':
				return proposition(v);
			case 'repeating_proposition_rule':
				return repeating_proposition_rule(v);
			default:
				throw new Error(`${v as any} is unknown`);
		}
	}

	function proposition(v: Proposition): [string, ParserRule[]] {
		const id = generate();
		const specifications = v.value.map(specification_node);

		return [
			id,
			[
				...specifications.flatMap((v) => v[1]),
				{
					name: id,
					symbols: specifications
						.map((v, i) =>
							[v[0] satisfies Symbol].concat(i < specifications.length - 2 ? [_space_0_id] : [])
						)
						.flat(),
					postprocess(d, loc, reject) {
						return d.slice(1, d.length - 1);
					}
				}
			]
		];
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
		const id = generate() + '_' + v.reference;
		if (reference_value_type.has(v.reference)) reference_value_type.set(v.reference, 'list');
		else reference_value_type.set(v.reference, 'unique');

		return [
			id,
			[
				{
					name: id,
					symbols: [_everything],
					postprocess(d, loc, reject) {
						return {
							type: v.reference,
							value: d[0]
						};
					}
				}
			]
		];
	}

	function sentence(v: Sentence): [string, ParserRule[]] {
		const id = generate();
		const specifications = v.value.map(sentence_node);

		return [
			id,
			[
				...specifications.flatMap((v) => v[1]),
				{
					name: id,
					symbols: specifications.map((v) => v[0]),
					postprocess(d, loc, reject) {
						return d;
					}
				}
			]
		];
	}

	function repeating_proposition_rule(v: RepeatingPropositionRule): [string, ParserRule[]] {
		const id = generate();

		const keys = Array(...reference_value_type.keys());
		const main_propositions = v.value.map(sentence_node);

		// Reference inside main node can appear multiple time even though reference node is unique
		const after_keys = Array(...reference_value_type.keys());
		after_keys.filter((k) => !keys.includes(k)).forEach((k) => reference_value_type.set(k, 'list'));

		const ending_propositions = v.last_repetition ? v.last_repetition.map(sentence_node) : [];

		return [
			id,
			main_propositions
				.concat(ending_propositions)
				.flatMap((v) => v[1])
				.concat([
					{ name: id, symbols: ending_propositions.map((v) => v[0]) },
					{ name: id, symbols: main_propositions.map((v) => v[0]).concat(id) }
				])
		];
	}

	const compiled_sentence = spec.value ? spec.value.map(sentence) : [];

	const main_rule: ParserRule[] = [
		{
			name: filterToName(spec.filter),
			symbols: compiled_sentence.map((v) => v[0]),
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
		ParserRules: compiled_sentence
			.map((v) => v[1])
			.flat()
			.concat(...SPACE_0, ...SPACE_1, ...EVERYTHING)
			.concat(main_rule),
		ParserStart: filterToName(spec.filter)
	};
	tactic.grammar = grammar;

	return grammar;
}
