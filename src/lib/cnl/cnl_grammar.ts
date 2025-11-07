import type { CompiledRules, ParserRule } from 'nearley';
import { getTactics, resolve_state_actions, type CnlTactic } from './cnl_tactic';
import { filterToName } from './cnl_tactic_to_grammar';
import { Lexer } from './lexer';

function rename_string(v: string, src: string, target: string) {
	return v === src ? target : v;
}

function rename_symbol(rules: CompiledRules, src: string, target: string): CompiledRules {
	const renaming = (v: string) => rename_string(v, src, target);

	return {
		...rules,
		Lexer: rules.Lexer,
		ParserStart: renaming(rules.ParserStart),
		ParserRules: rules.ParserRules.map((v) => ({
			name: renaming(v.name),
			symbols: v.symbols.map((v) => (typeof v === 'string' ? renaming(v) : v)),
			postprocess: v.postprocess
		}))
	};
}

export type ParseResult<T = unknown> = { tactic: CnlTactic; value: T };

export default function tactic_grammar(tactics?: CnlTactic[], state?: string[]): CompiledRules {
	if (!tactics) tactics = getTactics();
	if (state == null) state = [];

	const sources = tactics.map((v) => ({
		...v.grammar!,
		tactic: { ...v, grammar: undefined } satisfies CnlTactic
	}));

	return {
		ParserStart: 'main',
		Lexer: new Lexer(),
		ParserRules: sources
			.flatMap((v) => v.ParserRules)
			.concat({
				name: 'main',
				symbols: [state.length === 0 ? filterToName() : filterToName(state[state.length - 1])],
				postprocess(d) {
					let _state = [...state];
					const cnl_tactic = d[0] as { tactic: CnlTactic; value: unknown };

					_state = resolve_state_actions(_state, cnl_tactic.tactic.spec.footer.actions);

					return { result: cnl_tactic, state: _state };
				}
			})
	};
}
