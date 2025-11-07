@preprocessor typescript
@{%
export type Specification = {
	type: 'specification';
	header: SpecificationHeader;
	content: SpecificationContent;
	footer: SpecificationFooter;
};
export type SpecificationHeader = { type: 'header'; state?: string };
export type SpecificationFooter = {
	type: 'footer';
	structure?: StructureSpecification;
	actions: StateAction[];
};

export type SpecificationContent = SpecificationContentNode[];
export type SpecificationContentNode = Reference | Text;
export type Reference = { type: 'reference'; value: string };
export type Text = { type: 'text'; value: string };

export type StateAction = StateActionPop | StateActionPush;
export type StateActionPop = { type: 'state_action'; action: 'pop' };
export type StateActionPush = { type: 'state_action'; action: 'push'; value: string };

export type StructureSpecification =
	| StructureSpecificationEndOfLine
	| StructureSpecificationEndOfParagraph
	| StructureSpecificationBeginOfParagraph;

export type StructureSpecificationEndOfLine = {
	type: 'footer_structure_action';
	specification: 'end_of_line';
};

export type StructureSpecificationEndOfParagraph = {
	type: 'footer_structure_action';
	specification: 'end_of_paragraph';
};

export type StructureSpecificationBeginOfParagraph = {
	type: 'footer_structure_action';
	specification: 'begin_of_paragraph';
};

function specification(
	_header: SpecificationHeader,
	content: SpecificationContent,
	_footer: SpecificationFooter
): Specification {
	return { type: 'specification', header: _header, content, footer: _footer };
}

function text(value: string): Text {
	return { type: 'text', value };
}

function reference(value: string): Reference {
	return { type: 'reference', value };
}

function header(state: string): SpecificationHeader {
	return { type: 'header', state };
}

function footer(
	structure_specification: StructureSpecification,
	state_actions: StateAction[]
): SpecificationFooter {
	return { type: 'footer', structure: structure_specification, actions: state_actions };
}

function pop(): StateActionPop {
	return { type: 'state_action', action: 'pop' };
}

function push(value: string): StateActionPush {
	return { type: 'state_action', action: 'push', value };
}

function footer_structure_specification_endofline(): StructureSpecificationEndOfLine {
	return { type: 'footer_structure_action', specification: 'end_of_line' };
}

function footer_structure_specification_endofparagraph(): StructureSpecificationEndOfParagraph {
	return { type: 'footer_structure_action', specification: 'end_of_paragraph' };
}

function footer_structure_specification_beginofparagraph(): StructureSpecificationBeginOfParagraph {
	return { type: 'footer_structure_action', specification: 'begin_of_paragraph' };
}
%}

main -> specification {% d => d[0] %}

specification -> "{" header "|" content "|" footer "}" {% d => specification(d[1], d[3], d[5]) %}

header -> word:? {% d => header(d[0]) %}
footer -> footer_structure_action footer_state_actions {% d => footer(d[0], d[1]) %}

footer_state_actions -> (footer_pop | footer_push):* {%d => d.flat()[0] || [] %}
footer_pop -> "-" {% d => pop() %}
footer_push -> "+" word {% d => push(d[1]) %}

footer_structure_action -> (footer_endofline | footer_beginparagraph | footer_endparagraph):? {% d=>d.flat()[0] %}
footer_endofline -> "#" {% d => footer_structure_specification_endofline() %}
footer_beginparagraph -> ">" {% d => footer_structure_specification_beginofparagraph() %}
footer_endparagraph -> "<" {% d => footer_structure_specification_endofparagraph() %}


content -> text:? (reference text):* reference:? {% d => d.flat(Infinity).filter(Boolean) %}
text -> ([^|] | "\\|"):+ {% d => text(d[0].map((v: string)=>v[0] === "\\|" ? "|" : v[0]).join("")) %}
reference -> "|" word "|" {% d => reference(d[1]) %}
word -> [a-zA-Z0-9_]:+ {% d => d[0].join("") %}