import { schema } from '$lib/prosemirror-papiee-cnl/schema';
import { keymap } from 'prosemirror-keymap';
import { Plugin, Selection, TextSelection } from 'prosemirror-state';
import * as mathlive from 'mathlive';

export const MATHLIVE_ARROWKEY_KEYMAP_PLUGIN = keymap({
	ArrowRight: (state, _dispatch, view) => {
		const { $from: from } = state.selection;
		const nodeAfter = from.nodeAfter;

		// If next node is math node and selection at end of text
		if (nodeAfter?.type.name === 'math') {
			const pos = from.pos;
			const nodeView = view!.nodeDOM(pos)?.childNodes[0] as mathlive.MathfieldElement;
			nodeView.focus();
			setTimeout(() => (nodeView.position = 0));
			return true;
		}

		return false;
	},

	ArrowLeft: (state, dispatch, view) => {
		const { $from: from, $to: to } = state.selection;

		// If previous node is math node and selection at start of text
		if (from.nodeBefore?.type.name === 'math' && from.textOffset === 0) {
			const pos = from.pos - 1;
			const nodeView = view!.nodeDOM(pos)?.childNodes[0] as mathlive.MathfieldElement;
			nodeView.focus();
			setTimeout(() => (nodeView.position = nodeView.lastOffset));
			return true;
		}

		return false;
	}
});

export const MATHLIVE_SELECTION_PLUGIN = new Plugin({
	view(view) {
		return {
			update(view, prevState) {
				if (view.state.selection.eq(prevState.selection)) return;

				const { from, to } = view.state.selection;
				view.dom.querySelectorAll('.math-node').forEach((el: Element) => {
					const pos = view.posAtDOM(el, 0);
					const node = view.state.doc.nodeAt(pos);
					if (!node || node.type.name !== 'math') return;

					const nodeStart = pos;
					const nodeEnd = pos + node.nodeSize;
					const selected = from < nodeEnd && to > nodeStart;
					el.classList.toggle('math-selected', selected);
				});
			}
		};
	}
});

export const MATHLIVE_MATHMODE = keymap({
	$: (state, dispatch, view) => {
		const mathNode = schema.nodes.math.create({ latex: 'x' })!;
		const { from, to } = state.selection;
		const tr = state.tr.replaceRangeWith(from, to, mathNode);

		// Move selection *inside* the new math node
		const posAfter = tr.mapping.map(from - 1) + 1;
		dispatch!(tr.setSelection(TextSelection.create(tr.doc, posAfter)));
		view?.focus();

		// Focus the mathfield
		const dom = (view?.nodeDOM(posAfter) as HTMLElement | undefined)
			?.children[0] as mathlive.MathfieldElement;
		if (dom instanceof HTMLElement) {
			dom.focus();
			dom.position = 0;
		}

		return true;
	}
});

export const MATHLIVE_PLUGINS = [
	MATHLIVE_ARROWKEY_KEYMAP_PLUGIN,
	MATHLIVE_SELECTION_PLUGIN,
	MATHLIVE_MATHMODE
];
