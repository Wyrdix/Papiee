import * as mathlive from 'mathlive';
import { Schema, type NodeSpec } from 'prosemirror-model';

export const nodes = {
	doc: { content: 'content' },
	paragraph: {
		content: 'line content?',
		toDOM(node) {
			return ['div', { class: 'paragraph' }, 0];
		},
		parseDOM: [
			{
				tag: 'div.paragraph'
			}
		]
	},
	line: {
		content: 'inline*',
		toDOM(node) {
			return ['div', { class: 'paragraph-line' }, 0];
		},
		parseDOM: [
			{
				tag: 'div.paragraph-line'
			}
		]
	},
	content: {
		content: 'paragraph+',
		toDOM(node) {
			return ['div', { class: 'paragraph-content' }, 0];
		},
		parseDOM: [
			{
				tag: 'div.paragraph-content'
			}
		]
	},
	text: {
		group: 'inline',
		toDOM(node) {
			return ['span', { class: 'pm-text' }, 0];
		},
		parseDOM: [{ tag: 'span.pm-text' }]
	},
	math: {
		group: 'inline',
		inline: true,
		toDOM(node) {
			return ['math-field', { 'data-value': node.attrs.latex }];
		},
		parseDOM: [
			{
				tag: 'math-field',
				getAttrs(dom: HTMLElement) {
					return { latex: dom.getAttribute('data-value') || '' };
				}
			}
		],
		attrs: {
			latex: { default: '' }
		},
		leafText(node) {
			return `$${node.attrs.latex}$`;
		}
	}
} satisfies { [key: string]: NodeSpec };

export const schema = new Schema({ nodes });
