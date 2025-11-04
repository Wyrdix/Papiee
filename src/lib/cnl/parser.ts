import { schema } from '$lib/prosemirror-papiee-cnl/schema';
import type { Node } from 'prosemirror-model';

export class ParseError extends Error {}

/**
 * A cnl file is a text file where :
 *
 * - First line of paragraph must start with \t
 * - Indent of paragraphs is represented by a number of \t
 *
 * Example valid text:
 *
 * \t1 Paragraph
 * \t2 Paragraph
 * \t\t2.1 Paragraph
 * \t\t2.2 Paragraph
 */
export function parse(value: string): Node {
	const lines = value
		.split(/\r?\n/)
		.map((l) => l.replace(/\r$/, ''))
		.filter((l) => l.trim() !== '');

	let index = 0;
	const paragraphs: Node[] = [];

	while (index < lines.length) {
		const { node, next } = parseParagraph(lines, 0, index);
		index = next;
		paragraphs.push(node);
	}

	return schema.nodes.doc.create(null, schema.nodes.content.create(undefined, paragraphs));
}

/**
 * Recursively parses a paragraph and its children.
 */
function parseParagraph(
	lines: string[],
	level: number,
	startIndex: number
): { node: Node; next: number } {
	const paragraphLines: string[] = [];
	const paragraphChildren: Node[] = [];
	let i = startIndex;

	// Get current paragraph indentation level
	const currentIndent = countTabs(lines[i]);

	if (currentIndent < level) throw new ParseError(`Unexpected dedent at line ${i + 1}`);
	if (currentIndent > level) throw new ParseError(`Unexpected extra indentation at line ${i + 1}`);

	// Extract first line (must start with \t)
	paragraphLines.push(lines[i].substring(level));
	i++;

	// Accumulate continuation lines (same or greater indentation)
	while (i < lines.length) {
		const indent = countTabs(lines[i]);

		if (indent === level) {
			// Next paragraph at same level → stop
			break;
		}

		if (indent === level + 1) {
			// Child paragraph → parse recursively
			const { node: child, next } = parseParagraph(lines, level + 1, i);
			paragraphChildren.push(child);
			i = next;
			continue;
		} else if (indent < level) {
			// Dedent → stop
			break;
		} else {
			throw new ParseError(
				`Invalid indentation at line ${i + 1}: got ${indent}, expected ≤ ${level + 1}`
			);
		}
	}

	// Build ProseMirror nodes
	const textNode = parseText(paragraphLines.join(' '));
	const lineNode = schema.nodes.line.create(null, textNode);

	const childrenNode =
		paragraphChildren.length === 0
			? undefined
			: schema.nodes.content.create(undefined, paragraphChildren);

	const paragraphNode = schema.nodes.paragraph.create(
		null,
		childrenNode ? [lineNode, childrenNode] : [lineNode]
	);

	return { node: paragraphNode, next: i };
}

/**
 * Extract from the string representation math value
 * @param value An inline text representation
 * @returns A list of node with math and text node inside
 */
function parseText(value: string): Node[] {
	const nodes = [];
	const regex = /\$(.*?)\$|([^$]+)/gs;
	let match;
	while ((match = regex.exec(value))) {
		if (match[1]) {
			nodes.push(schema.node('math', { latex: match[1] }));
		} else if (match[2]) {
			nodes.push(schema.text(match[2]));
		}
	}
	return nodes;
}

/** Counts the number of leading tab characters in a string. */
function countTabs(line: string): number {
	let count = 0;
	for (const ch of line) {
		if (ch === '\t') count++;
		else break;
	}
	return count;
}

/**
 * Return a string representation of a CNL tree
 * @param value
 */
export function unparse(value: Node) {
	function content_visitor(v: Node): string {
		const values = v.children.map(paragraph_visitor);
		return values.join('\n');
	}

	function paragraph_visitor(v: Node): string {
		const [line, content] = v.children;

		const str_line = line.textContent;
		const str_content = content ? ('\n' + content_visitor(content)).replaceAll('\n', '\n\t') : '';
		return str_line + str_content;
	}
	return content_visitor(value.child(0));
}
