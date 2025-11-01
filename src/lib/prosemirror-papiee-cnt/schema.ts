import * as mathlive from 'mathlive';
import { Schema } from 'prosemirror-model';

const SCHEMA = new Schema({
	nodes: {
		doc: { content: 'inline*' },
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
	}
});
export default SCHEMA;
