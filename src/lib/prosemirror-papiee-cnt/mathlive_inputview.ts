import type { Node as P_Node } from 'prosemirror-model';
import * as mathlive from 'mathlive';
import type { Decoration, DecorationSource, EditorView, NodeView } from 'prosemirror-view';
import { Selection } from 'prosemirror-state';
import 'mathlive/fonts.css';

export class MathLiveNodeView implements NodeView {
	node: P_Node;
	dom: HTMLElement;
	mathfield: mathlive.MathfieldElement;
	contentDOM?: HTMLElement | null | undefined;
	view: EditorView;
	getPos: () => number | undefined;
	decorations: readonly Decoration[];
	innerDecoration: DecorationSource;
	multiType = false;

	constructor(
		node: P_Node,
		view: EditorView,
		getPos: () => number | undefined,
		decorations: readonly Decoration[],
		innerDecoration: DecorationSource
	) {
		this.node = node;
		this.view = view;
		this.decorations = decorations;
		this.getPos = getPos;
		this.innerDecoration = innerDecoration;
		this.dom = document.createElement('span');
		this.dom.className = 'math-node';

		mathlive.MathfieldElement.soundsDirectory = null;
		this.mathfield = new mathlive.MathfieldElement();
		this.updateMathfieldFromNode();

		// Allow the mathfield to be editable
		this.dom.appendChild(this.mathfield);

		// --- Sync changes to ProseMirror ---
		this.mathfield.addEventListener('input', (e) => {
			const value = this.mathfield.value;
			const pos = this.getPos()!;
			if (value.includes('\\$')) {
				const tr = this.view.state.tr.setSelection(
					Selection.near(this.view.state.doc.resolve(pos + this.node.nodeSize))
				);
				this.mathfield.value = value.replace('\\$', '');
				this.view.dispatch(tr);
			} else {
				const tr = this.view.state.tr.setNodeMarkup(pos, undefined, { latex: value });
				this.view.dispatch(tr);
			}
		});

		this.mathfield.addEventListener('keydown', (e: KeyboardEvent) => {
			// Detect "$" key
			if (e.key === '$') {
				const pos = this.getPos?.();
				if (pos == null) return;

				// Prevent MathLive from inserting another "$"
				e.preventDefault();
				e.stopPropagation();

				// Move cursor after the math node
				const { state, dispatch } = this.view;
				const tr = state.tr.setSelection(
					// Move selection just *after* the math node
					// pos + this.node.nodeSize accounts for the outer node boundaries
					Selection.near(state.doc.resolve(pos + this.node.nodeSize))
				);
				dispatch(tr);

				// Focus ProseMirror editor again
				this.view.focus();
			}
		});

		// --- Prevent PM from stealing focus ---
		this.dom.addEventListener('mousedown', (e) => {
			e.stopPropagation();
			this.mathfield.focus();
		});

		this.mathfield.addEventListener('focus', (e) => {
			e.stopPropagation();
			// When MathLive focuses, select the node in PM if needed
			const pos = this.getPos()!;
			const nodeSize = this.node.nodeSize;
			const sel = this.view.state.selection;

			// If selection isn’t already inside this node, move it here
			if (sel.from < pos || sel.to > pos + nodeSize) {
				const $pos = this.view.state.doc.resolve(pos);
				this.view.dispatch(this.view.state.tr.setSelection(Selection.near($pos, 1)));
			}
		});

		// Handle arrow keys at edges

		this.mathfield.addEventListener('move-out', (e: any) => {
			const pos = this.getPos();
			if (pos === undefined) return;

			const nodeSize = this.node.nodeSize;

			let $pos;
			let $bias;
			if (e.detail.direction === 'forward') {
				$pos = this.view.state.doc.resolve(pos + nodeSize);
				$bias = 1;
			} else if (e.detail.direction === 'backward') {
				$pos = this.view.state.doc.resolve(pos);
				$bias = -1;
			} else {
				return;
			}

			const selection = Selection.near($pos, $bias);
			const tr = this.view.state.tr.setSelection(selection);

			this.view.dispatch(tr);
			this.view.focus();
		});
	}

	updateMathfieldFromNode() {
		this.mathfield.value = this.node.attrs.latex || '';
	}

	// --- Prevent PM from handling *any* events inside the mathfield ---
	stopEvent(event: any) {
		const target = event.target;
		if (!target) return false;

		// Stop ProseMirror from handling *everything* inside the mathfield
		if (this.mathfield.contains(target)) return true;

		// Also block keyboard events specifically
		if (/^(keydown|keypress|keyup|input)$/.test(event.type)) return true;

		return false;
	}

	// --- PM should ignore DOM mutations made by MathLive ---
	ignoreMutation() {
		return true;
	}

	selectNode() {
		this.dom.classList.add('ProseMirror-selectednode');
	}

	deselectNode() {
		this.dom.classList.remove('ProseMirror-selectednode');
	}

	update(node: P_Node, decorations: readonly Decoration[], innerDecorations: DecorationSource) {
		if (node.type !== this.node.type) return false;
		this.node = node;
		this.updateMathfieldFromNode();

		// Check if node is part of current selection
		const { from, to } = this.view.state.selection;
		const pos = this.getPos?.();
		if (pos != null) {
			const nodeStart = pos;
			const nodeEnd = pos + node.nodeSize;
			const selected = from < nodeEnd && to > nodeStart;

			this.dom.classList.toggle('math-selected', selected);
		}

		return true;
	}
}
