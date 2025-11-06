// Type definitions for nearley (handwritten .d.ts)
// Project: https://github.com/kach/nearley
// Definitions by: ChatGPT

declare module 'nearley' {
	export type ParerError = Error & { offset: number; token: string };

	/** Allowed symbol types inside a Nearley rule */
	export type Symbol =
		| string // rule reference
		| RegExp // regex token
		| { literal: string } // match a fixed literal
		| { token: string; [x: any]: any }
		| { test: (token: any) => boolean }; // predicate for a token

	/** A compiled grammar object produced by nearleyc or Grammar.fromCompiled() */
	export interface CompiledRules {
		Lexer?: any;
		ParserRules: ParserRule[];
		ParserStart: string;

		[x: string]: any;
	}

	/** Grammar rule */
	export interface ParserRule {
		/** The rule's name */
		name: string;
		/** The symbols that make up this rule (strings, regexes, or references). */
		symbols: Symbol[];
		/** Optional postprocessing function for matched results. */
		postprocess?: (d: any[], loc?: number, reject?: {}) => any;
	}

	/** Grammar wrapper */
	export class Grammar {
		/** The lexer, if provided */
		lexer: any;
		/** List of parser rules */
		rules: ParserRule[];
		/** The start symbol */
		start: string;

		/** Construct a grammar from rules and an optional start symbol */
		constructor(rules: ParserRule[], start: string);

		/** Create a Grammar from a compiled rules object (JSON from nearleyc). */
		static fromCompiled(rules: CompiledRules): Grammar;
	}

	/** Configuration options for the parser */
	export interface ParserOptions {
		/** A pre-built Grammar object */
		grammar: Grammar;
		/** If true, keeps all possible parsing results (otherwise may discard). */
		keepHistory?: boolean;
		/** Starting state for the parser, advanced usage. */
		start?: string;
	}

	/** Parsing state snapshot */
	export interface Column {
		/** Current index in the input */
		index: number;
		/** States being tracked */
		states: any[];
		/** Scanned token */
		token?: any;
		/** Previous column */
		predecessor?: Column;
		/** Any additional metadata */
		[key: string]: any;
	}

	/** Parser instance */
	export class Parser {
		/** Construct a new parser with the given options */
		constructor(grammar: Grammar);

		/** Feed an input string or token stream into the parser */
		feed(chunk: string | any[]): this;

		/** Get the current parsing results (array of possible parses). */
		results: any[];

		/** Save the parser state (for incremental parsing). */
		save(): any;

		/** Restore a previously saved parser state. */
		restore(snapshot: any): void;

		/** Restart the parser from scratch (preserving grammar). */
		restart(): void;

		/** The internal parsing table (advanced usage). */
		table: Column[];

		/** The current input position */
		current: number;

		/** Any other runtime properties may exist. */
		[k: string]: any;
	}

	/** Default export */
	const nearley: {
		Parser: typeof Parser;
		Grammar: typeof Grammar;
	};

	export default nearley;
}
