export interface ILexer<T> {
	/** Reset the internal buffer and optionally restore state info returned from save(). */
	reset(chunk?: string | InputToken[], info?: T): this;
	/** Return the next token or undefined at EOF. */
	next(): InputToken | undefined;
	/** Save the current internal lexer state. The shape of the returned object is implementation-defined. */
	save(): T;
	/** Format a helpful error message for a given token / position. */
	formatError(token: InputToken | undefined, message?: string): string;
	state?: string;
}

type InputToken = string | { type: 'stop_everything' } | any;

export function stringOrTokenToInputToken(chunk: string | InputToken[]): InputToken[] {
	return typeof chunk === 'string' ? [...chunk].map((v) => v) : chunk;
}

export class Lexer implements ILexer<{ index: number }> {
	buffer: InputToken[] = [];
	index = 0;

	reset(chunk?: string | InputToken[], info?: { index: number }): this {
		this.buffer = stringOrTokenToInputToken(chunk || []);
		this.index = 0;
		return this;
	}

	next(): InputToken | undefined {
		if (this.index < this.buffer.length) {
			const input_token = this.buffer[this.index++];

			if (typeof input_token === 'string') return { value: input_token };
			return input_token;
		}
		return undefined;
	}

	save() {
		return { index: this.index };
	}

	formatError(token: InputToken | undefined, message?: string): string {
		return '';
	}
}
