import type { ParseResult } from '$lib/cnl/cnl_grammar';
import { Schema, type MarkSpec, type NodeSpec } from 'prosemirror-model';
import type { CompletionState } from './ProofAutoCompletion.svelte';

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
	}
} satisfies { [key: string]: NodeSpec };

export const marks = {
	selected: {
		attrs: {
			completion: {
				default: undefined as CompletionState | undefined
			}
		}
	},
	tactic: {
		attrs: {
			tactic: {
				default: undefined as ParseResult | undefined
			},
			error: {
				default: false
			},
			last: {
				default: false
			}
		}
	}
} satisfies { [key: string]: MarkSpec };

export const schema = new Schema({ nodes, marks });
