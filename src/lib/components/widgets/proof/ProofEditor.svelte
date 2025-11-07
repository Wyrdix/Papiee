<script lang="ts">
	import { MATHLIVE_PLUGINS } from '$lib/prosemirror-papiee-cnl/plugins';
	import { schema } from '$lib/prosemirror-papiee-cnl/schema';
	import { useMarkViewFactory, useNodeViewFactory } from '@prosemirror-adapter/svelte';
	import { EditorState, Plugin } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { ParagraphNodeView, plugins as paragraph_plugins } from './views/Paragraph.svelte';
	import { Slice, type Node } from 'prosemirror-model';
	import { DocNodeView, plugins as doc_plugins } from './views/Doc.svelte';
	import { LineNodeView, plugins as line_plugins } from './views/Line.svelte';
	import { ContentNodeView, plugins as content_plugins } from './views/Content.svelte';
	import { unparse } from '$lib/cnl/textual';
	import '$lib/resolvedpos';
	import { MathLiveNodeView } from '$lib/prosemirror-papiee-cnl/mathlive_inputview';
	import { MarkSelectedView, plugins as mark_selected_plugins } from './marks/MarkSelected.svelte';
	import { plugins as mark_tactic_plugins, MarkTacticView } from './marks/MarkTactic.svelte';

	import '$lib/cnl/tactics';

	let { node = $bindable(), onView }: { node?: Node; onView?: (view: EditorView) => void } =
		$props();

	const nodeViewFactory = useNodeViewFactory();
	const markViewFactor = useMarkViewFactory();

	const editor = (element: HTMLElement) => {
		const editor_state = EditorState.create({
			schema,
			plugins: [
				MATHLIVE_PLUGINS,
				new Plugin({
					view(view) {
						return {
							update(view, prevState) {
								node = view.state.doc;
							}
						};
					}
				}),
				paragraph_plugins,
				doc_plugins,
				line_plugins,
				content_plugins,
				mark_selected_plugins,
				mark_tactic_plugins,
				// Prevent selection from spanning multiple elements
				new Plugin({
					filterTransaction(tr, state) {
						const { $anchor: anchor, $from: from, $to: to, $head: head } = tr.selection;

						const begin = anchor.$start();
						const end = anchor.$end();

						const sel_start = begin.max(from);
						const sel_end = end.min(to);

						return sel_start.pos === from.pos && sel_end.pos === to.pos;
					}
				})
			].flat()
		});
		const editorView = new EditorView(element, {
			state: editor_state,
			nodeViews: {
				paragraph: ParagraphNodeView(nodeViewFactory),
				doc: DocNodeView(nodeViewFactory),
				line: LineNodeView(nodeViewFactory),
				content: ContentNodeView(nodeViewFactory),
				math: (node, view, getPos, decorations, innerDectorations) => {
					return new MathLiveNodeView(node, view, getPos, decorations, innerDectorations);
				}
			},
			markViews: {
				selected: MarkSelectedView(markViewFactor),
				tactic: MarkTacticView(markViewFactor)
			},
			attributes(state) {
				return { spellcheck: 'false' };
			},
			// As long a copy/paste is broken prevent it
			transformCopied(slice, view) {
				return Slice.empty;
			},
			transformPasted(slice, view, plain) {
				return Slice.empty;
			}
		});

		$effect(() => {
			if (node && unparse(node) !== unparse(editorView.state.doc)) {
				editorView.dispatch(
					editorView.state.tr.replaceRangeWith(0, editorView.state.doc.content.size - 1, node)
				);
			}
		});
		if (onView) onView(editorView);
	};
</script>

<div class="ProseMirror" use:editor></div>

<style>
	:global(.ProseMirror:focus) {
		outline: none;
	}

	.ProseMirror {
		font-family: inherit;
		--selection-bg: color-mix(in srgb, Highlight 20%, transparent);
		--selection-fg: HighlightText;
	}

	:global(.ProseMirror-focused .selected-text) {
		background: Highlight;
	}

	:global(.math-selected) {
		background: var(--selection-bg);
		color: black;
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

	:global(.math-node math-field) {
		color: inherit;
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
