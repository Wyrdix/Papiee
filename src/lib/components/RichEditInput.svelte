<script lang="ts">
	import { MathLiveNodeView } from '$lib/prosemirror-papiee-cnl/mathlive_inputview';
	import { schema } from '$lib/prosemirror-papiee-cnl/schema';
	import { EditorState } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import type { Node } from 'prosemirror-model';
	import { MATHLIVE_PLUGINS } from '$lib/prosemirror-papiee-cnl/plugins';
	import {
		comparePosition,
		RichEditInputPositionHelper,
		type RichInputPosition
	} from '$lib/RichEditInput';

	let {
		value = $bindable(''),
		position = $bindable(),
		onKeyDown
	}: {
		value?: string;
		position?: RichInputPosition | undefined;
		onKeyDown?: (e: KeyboardEvent) => void;
	} = $props();

	let editor_state: EditorState;
	let view: EditorView;
	let diva: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!diva) return;

		editor_state = EditorState.create({
			schema: schema,
			plugins: MATHLIVE_PLUGINS
		});

		view = new EditorView(diva, {
			state: editor_state,

			handleKeyDown(_view, event) {
				if (onKeyDown) onKeyDown(event);
			},
			dispatchTransaction(tr) {
				const newState = view.state.apply(tr);
				view.updateState(newState);
				const _p = RichEditInputPositionHelper.get(view);
				if (comparePosition(_p, position) !== 0) position = RichEditInputPositionHelper.get(view);
				value = unparse(newState.doc);
			},

			nodeViews: {
				math: (node, view, getPos, decorations, innerDectorations) => {
					return new MathLiveNodeView(node, view, getPos, decorations, innerDectorations);
				}
			}
		});
	});

	$effect(() => {
		if (view && value !== unparse(view.state.doc)) {
			const newDoc = parse(value);
			if (!newDoc.eq(view.state.doc)) {
				const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, newDoc.content);
				view.dispatch(tr);
			}
		}
	});

	$effect(() => {
		if (view && comparePosition(position, RichEditInputPositionHelper.get(view)) !== 0) {
			RichEditInputPositionHelper.moveTo(view, position);
		}
	});

	function parse(text: string) {
		const nodes = [];
		const regex = /\$(.*?)\$|([^$]+)/gs;
		let match;
		while ((match = regex.exec(text))) {
			if (match[1]) {
				nodes.push(schema.node('math', { latex: match[1] }));
			} else if (match[2]) {
				nodes.push(schema.text(match[2]));
			}
		}
		return schema.node('doc', null, nodes);
	}

	function unparse(doc: Node) {
		return doc.textContent;
	}
</script>

<div class="div_pm" bind:this={diva}></div>

<style>
	:root {
		--selection-bg: color-mix(in srgb, Highlight 20%, transparent);
		--selection-fg: HighlightText;
	}

	:global(.ProseMirror-focused .selected-text) {
		background: Highlight;
	}

	:global(.math-selected) {
		background: var(--selection-bg);
		color: var(--selection-fg);
		border-radius: 2px;
	}

	:global(.ProseMirror:focus) {
		outline: none;
	}

	:global(.math-node) {
		display: inline-block;
		font-family: inherit; /* match surrounding text */
		font-size: 1em;
		padding: 0 0;
		margin: 0;
		border: none;
		outline: none;
	}

	:global(.math-node math-field::part(container)) {
		padding-left: 0px;
		padding-right: 0px;
	}

	:global(.math-node math-field::part(content)) {
		padding-left: 0px;
		padding-right: 0px;
	}

	:global(.math-node math-field:focus) {
		color: var(--color-secondary-800);
	}

	:global(.math-node math-field::part(virtual-keyboard-toggle)) {
		display: none;
	}

	:global(math-field::part(menu-toggle)) {
		display: none;
		background-color: red;
	}

	:global(.math-node math-field) {
		transition: background-color 10s;
		background-color: transparent;
		outline: none;
	}

	:global(.math-mode math-field) {
		--text-highlight-background-color: transparent;
		--math-highlight-background-color: transparent;
		--contains-highlight-background-color: transparent;
		--smart-fence-opacity: 1;
		--smart-fence-color: inherit;
		background-color: transparent;
	}
</style>
