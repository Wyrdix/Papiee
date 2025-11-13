import type { Node, ResolvedPos } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { schema } from './schema';
import { parse_cnl_chained } from '$lib/cnl/parser';
import type { ParseResult } from '$lib/cnl/cnl_grammar';
import type { StructureSpecification } from '$lib/cnl/cnl_tactic_specifier';
import { isFallbackTactic, resolve_state_actions } from '$lib/cnl/cnl_tactic';

import '$lib/resolvedpos';
import '$lib/cnl/tactics';

export type ProofChunk = ErrorChunk | CommentChunk | TacticChunk;

export type ErrorChunk = ErrorChunk_all | ErrorChunk_fatal;

export type ErrorChunk_all = {
	type: 'error';
	range: { from: number; to: number };
};

export type ErrorChunk_fatal = {
	type: 'error';
	range: { from: number; to: number };
	fatal: true;
};

export type CommentChunk = {
	type: 'comment';
	range: { from: number; to: number };
} & ParseResult;

export type TacticChunk = {
	type: 'tactic';
	range: { from: number; to: number };
	code: string;
} & ParseResult;

export function getLineEndStructure(
	chunk: ProofChunk[]
): StructureSpecification['specification'] | undefined {
	const index = getLineEndStructure_chunkIndex(chunk);
	if (index === -1) return undefined;
	return (chunk[index] as TacticChunk | undefined)?.tactic?.spec?.footer?.structure?.specification;
}

export function getLineEndStructure_chunkIndex(chunk: ProofChunk[]): number | -1 {
	return chunk.findIndex(
		(v) => v.type === 'tactic' && v.tactic.spec.footer.structure && !isFallbackTactic(v.tactic)
	);
}

export function getStateAfterChunks(state: string[], chunk: ProofChunk[]): string[] {
	return resolve_state_actions(
		state,
		chunk
			.filter((v) => v.type === 'tactic')
			.flatMap((v) => (v as TacticChunk).tactic.spec.footer.actions)
	);
}

export function getMainChunk(chunks: ProofChunk[]): ProofChunk | undefined {
	return chunks.find((v) => v.range.to !== v.range.from);
}

export function turnToErroChunks(chunks: ProofChunk[], offset: number = 0): ProofChunk[] {
	return [
		...chunks.slice(0, offset),
		...chunks
			.slice(offset)
			.map((v) =>
				v.type !== 'comment' ? ({ type: 'error', range: v.range } satisfies ProofChunk) : v
			)
	];
}

export function parsechunks(root: Node): { state: string[]; chunks: ProofChunk[] } {
	let flatMapChunk = <T>(
		state: string[],
		nodes: readonly T[],
		pos: number,
		mapper: (
			state: string[],
			node: T,
			pos: number
		) => { state: string[]; pos: number; chunks: ProofChunk[] }
	): { state: string[]; pos: number; chunks: ProofChunk[] } => {
		return nodes.reduce(
			(a, b) => {
				const { state: prev_state, chunks: chunks0, pos: prev_pos } = a;
				const {
					state: next_state,
					chunks: chunks1,
					pos: next_pos
				} = mapper(prev_state, b, prev_pos);
				return { state: next_state, chunks: chunks0.concat(chunks1), pos: next_pos };
			},
			{ state, pos, chunks: [] as ProofChunk[] }
		);
	};

	function visitParagraph(
		state: string[],
		node: Node,
		pos: number
	): { state: string[]; chunks: ProofChunk[]; pos: number } {
		const [line, content] = node.children;

		const {
			state: after_line_state,
			chunks: chunks0,
			pos: prev_pos
		} = visitLine(state, line, pos + 1); // + 1 because we enter the line

		let after_content_state = after_line_state;
		let chunks1: ProofChunk[] = [];
		let after_content_pos = prev_pos;

		let paragraph_stop = false;
		if (content?.children) after_content_pos++;
		content?.children?.forEach((node) => {
			let result = visitParagraph(after_content_state, node, after_content_pos + 1);
			after_content_pos = result.pos;
			if (paragraph_stop) {
				chunks1 = chunks1.concat(turnToErroChunks(result.chunks));
			} else {
				chunks1 = chunks1.concat(result.chunks);
				after_content_state = result.state;
			}

			// The paragraph is a paragraph terminating line if the first action is a paragraph_end
			// Important to note that the given chunks was already checked so no need to find the index and use turnToErroChunks
			paragraph_stop = paragraph_stop || getLineEndStructure(result.chunks) === 'end_of_paragraph';
		});
		after_content_pos++;

		const required_structure = getLineEndStructure(chunks0);
		// Structure does not expect a content
		if (required_structure !== 'begin_of_paragraph' && content) {
			// Restore line state
			after_content_state = after_line_state;
			chunks1 = turnToErroChunks(chunks1);
		}

		// If content was expected but none was provided, try to find a fallback tactic
		if (required_structure === 'begin_of_paragraph' && !content) {
			const { result, state } = parse_cnl_chained('', after_line_state, true);

			if (result.length === 0) {
				// Emit a fatal error as no fallback was found
				chunks1 = [
					{ type: 'error', fatal: true, range: { from: after_content_pos, to: after_content_pos } }
				];
			} else {
				after_content_state = state;
				chunks1 = result.map((v) => ({
					type: 'tactic',
					range: { from: after_content_pos, to: after_content_pos },
					tactic: v.tactic,
					value: v.value,
					code: v.tactic.transformer({ value: v.value as any })
				}));
			}
		}

		return {
			state: after_content_state,
			chunks: chunks0.concat(chunks1),
			pos: after_content_pos + 1
		};
	}

	function visitLine(
		state: string[],
		node: Node,
		pos: number
	): { state: string[]; chunks: ProofChunk[]; pos: number } {
		if (node.childCount === 0) return { state, chunks: [], pos };

		const { ends, result } = parse_cnl_chained(
			node.textContent.replaceAll(/\u00A0/g, ' '),
			state,
			true
		);

		let chunks: ProofChunk[] = result.map(
			(v, i) =>
				({
					...v,
					type: 'tactic',
					range: { from: pos + (i == 0 ? 0 : ends[i - 1]), to: pos + ends[i] },
					code: v.tactic.transformer({ value: v.value as any })
				}) satisfies TacticChunk
		);

		let error_segment =
			result.length === 0
				? { from: pos, to: pos + node.content.size }
				: { from: pos + ends[ends.length - 1], to: pos + node.content.size };

		// If there is text which was not parsed, then the text represents a syntax error
		if (error_segment.from !== error_segment.to) {
			chunks.push({
				type: 'error',
				range: error_segment
			});
		}

		chunks = chunks.map((v) =>
			v.type === 'tactic' && v.tactic.name?.toLocaleLowerCase() === 'comment'
				? { ...v, type: 'comment' }
				: v
		);

		const line_stop = getLineEndStructure_chunkIndex(chunks);
		const tactic_after_stop = chunks.slice(line_stop + 1).find((v) => v.type !== 'comment');

		// If there are tactics after a tactic which was marked as line end, then those tactics are error
		if (line_stop !== -1 && tactic_after_stop) {
			chunks = turnToErroChunks(chunks, line_stop + 1);
		}

		chunks = chunks.filter((v) => v.type === 'tactic' || v.range.from !== v.range.to);
		const recomputed_state = getStateAfterChunks(state, chunks);

		return { state: recomputed_state, chunks, pos: pos + node.content.size + 1 }; // + 1 because we exit the line
	}

	let result_chunked = flatMapChunk([], root.child(0).children, 2, visitParagraph);
	let chunks1: ProofChunk[] = [];
	if (result_chunked.state.length !== 0) {
		const { result, state } = parse_cnl_chained('', result_chunked.state, true);

		if (result.length === 0) {
			// Emit a fatal error as no fallback was found
			chunks1 = [
				{ type: 'error', fatal: true, range: { from: result_chunked.pos, to: result_chunked.pos } }
			];
		} else {
			result_chunked.state = state;
			chunks1 = result.map((v) => ({
				type: 'tactic',
				range: { from: result_chunked.pos, to: result_chunked.pos },
				code: v.tactic.transformer({ value: v.value as any }),
				tactic: v.tactic,
				value: v.value
			}));
		}

		result_chunked.chunks = result_chunked.chunks.concat(chunks1);
	}

	result_chunked.pos += 2;

	return result_chunked;
}

export function command_parsechunk(state: EditorState, dispatch?: (tr: Transaction) => void) {
	let tr = state.tr;
	tr = tr.removeMark(0, tr.doc.content.size, schema.marks.chunk);

	let chunks = parsechunks(state.doc);

	chunks.chunks.forEach((chunk) => {
		let { from, to } = chunk.range;
		let node = undefined as Node | undefined;
		if (from === to) node = undefined;
		else {
			const nodes: Node[] = [];
			tr.doc.nodesBetween(from, to, (node) => {
				if (node.type.name !== schema.nodes.text.name) return;
				nodes.push(node);
			});
			if (nodes.length > 1) {
				throw new Error('Chunk span on multiple nodes');
			}
			node = nodes[0];
		}

		if (!node) {
			let newfrom = tr.doc.resolve(from);

			while (newfrom.node().type.name !== 'line' && newfrom.pos > 0) {
				newfrom = newfrom.$decrement();
			}
			newfrom = newfrom.$posAtIndex(newfrom.index() - 1);
			let newto = newfrom.$end();

			from = newfrom.pos;
			to = newto.pos;

			const nodes: Node[] = [];
			tr.doc.nodesBetween(from, to, (node) => {
				if (node.type.name !== schema.nodes.text.name) return;
				nodes.push(node);
			});
			if (nodes.length > 1) {
				throw new Error('Chunk span on multiple nodes');
			}
			node = nodes[0];
		}

		if (!node) throw new Error('No node under the range ' + String(from) + ' ' + String(to));

		const existing =
			(node.marks.find((v) => v.type.name === schema.marks.chunks.name)?.attrs?.value as
				| ProofChunk[]
				| undefined) || [];

		tr = tr.addMark(from, to, schema.marks.chunks.create({ value: existing.concat(chunk) }));
	});

	if (dispatch) dispatch(tr);
}

export function getChunks(node: Node): ProofChunk[] {
	let chunks: ProofChunk[] = [];

	function visit(node: Node) {
		chunks = chunks.concat(
			node.marks
				.filter((v) => v.type.name === schema.marks.chunks.name)
				.flatMap((v) => v.attrs.value as ProofChunk[])
		);
	}

	visit(node);
	node.descendants(visit);

	return chunks;
}

export function getChunk(pos: ResolvedPos): ProofChunk | undefined {
	const index = Math.min(pos.index(), pos.node().childCount - 1);
	if (index === -1) return undefined;
	const text = pos.node().child(index);
	const main = getMainChunk(getChunks(text));
	return main;
}
