@preprocessor typescript
@{%

export interface Text {
	type: 'text';
	value: string;
}

export interface Reference {
	type: 'reference';
	reference: string;
}

export type SpecificationNode = Text | Reference;
export type SentenceNode = Proposition | RepeatingPropositionRule;

export interface Proposition {
	type: 'proposition';
	value: SpecificationNode[];
}

export interface Sentence {
	type: 'sentence';
	value: SentenceNode[];
}

export interface RepeatingPropositionRule {
	type: 'repeating_proposition_rule';
	value: SentenceNode[];
	last_repetition?: SentenceNode[] ;
}

export interface Specification {
	type: 'specification';
	filter?: string;
	pop: number;
	push: string[];
	value?: Sentence[];
	terminal: boolean;
}

export type EndAction =
	| { type: 'end_action'; action: 'pop' }
	| { type: 'end_action'; action: 'push'; value: string };

function text(value: string | undefined): Text | undefined {
	if (!value || value.trim().length === 0) return undefined;
	return { type: 'text', value };
}

function proposition(value: SpecificationNode[]): Proposition {
	return {
		type: 'proposition',
		value: value
			.filter((v) => v)
			.reduce(
				(a, b): SpecificationNode[] => {
					const last = a[a.length - 1];
					if (last?.type === 'text' && b.type === 'text')
						return [...a.slice(0, a.length - 1), text(last.value + b.value)!];
					return [...a, b];
				},
				[{ type: 'text', value: '' } as SpecificationNode]
			)
	};
}

function sentence(value: SentenceNode[]): Sentence {
	return { type: 'sentence', value };
}

function repeating_proposition_rule(
	value: SentenceNode[],
	last_repetition: SentenceNode[]| undefined
): RepeatingPropositionRule {
	return { type: 'repeating_proposition_rule', value, last_repetition };
}

function concat_text(value: Text[]): Text {
	return { type: 'text', value: value.map((v) => v.value).join(' ') };
}

function action(value: ['-'] | ['+', Text]): EndAction {
	return value.length === 1
		? { type: 'end_action', action: 'pop' }
		: { type: 'end_action', action: 'push', value: value[1].value };
}

function specification(
	filter: string | undefined,
	value: Sentence[],
	terminal: boolean,
	end_action: EndAction[] | undefined
): Specification {
	value = value || [];
	end_action = end_action || []
	end_action = end_action.reduce((a: EndAction[], b) => {
		if (a.length === 0) return [b];
		if (a[a.length - 1].action === 'push' && b.action === 'pop') return a.slice(0, a.length - 1);
		return [...a, b];
	}, []);

	let pop = end_action.filter(v=>v.action === "pop").length
	let push = end_action.filter(v=>v.action === "push").map(v=>v.value);

	return { type: 'specification', filter, value, pop, push, terminal };
}
%}


main -> "{" word:? "|" content "#":? "|" end_action:* "}" {% d => specification(d[1]?.value, d[3], d[4] == null, d[6] || undefined)%}

end_action -> (("+" word)|"-") {% d => action(d.flat(Infinity) as any) %}

content -> sentence:+ {% d => d[0] %}

proposition[SEP] -> (text:? _ (reference)):* text:? _ $SEP _ {% d => proposition(d.slice(undefined, 4).flat(Infinity)) %}
sentence -> (proposition[end_of_proposition] | repeating_proposition_rule):* (proposition[end_of_sentence] |repeating_proposition_rule) {% d => sentence([...d[0].map((v:any)=>v[0]), ...d[1]])%}
repeating_proposition_rule -> "@repeat(" _ sentence _ ")" {% d => repeating_proposition_rule(d[2].value, undefined) %}
	| "@repeat(" _ proposition[end_of_proposition]:* _ ")(" _ proposition[end_of_sentence] _ ")" {% d => repeating_proposition_rule(d[2], [d[6]]) %}
	| "@repeat(" _ sentence _ ")(" _ sentence _ ")" {% d => repeating_proposition_rule(d[2].value, d[6].value) %}

end_of_proposition -> (",") {% d => text(d.flat()[0]) %}
end_of_sentence -> ("." | ":") {% d => text(d.flat()[0]) %}

text -> word (__ word):* {% d => concat_text(d.flat(Infinity).filter(Boolean)) %}
word -> [^\s\.,:|@\(\)]:+ {% d => text(d[0].join("")) %}

reference -> "|" [a-zA-Z0-9]:+ "|" {% d => ({type: "reference", reference: d[1].join("")}) %}

_ -> [ \t\n]:* {% d => text(d[0].join("")) %}
__ -> [ \t\n]:+ {% d => text(d[0].join("")) %}