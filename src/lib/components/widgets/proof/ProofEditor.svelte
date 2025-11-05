<script lang="ts">
	import { MATHLIVE_PLUGINS } from '$lib/prosemirror-papiee-cnl/plugins';
	import { schema } from '$lib/prosemirror-papiee-cnl/schema';
	import { useNodeViewFactory } from '@prosemirror-adapter/svelte';
	import { EditorState, Plugin, Selection, TextSelection } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { ParagraphNodeView, plugins as paragraph_plugins } from './views/Paragraph.svelte';
	import { Slice, type Node } from 'prosemirror-model';
	import { DocNodeView, plugins as doc_plugins } from './views/Doc.svelte';
	import { LineNodeView, plugins as line_plugins } from './views/Line.svelte';
	import { ContentNodeView, plugins as content_plugins } from './views/Content.svelte';
	import { unparse } from '$lib/cnl/parser';
	import '$lib/resolvedpos';
	import { keymap } from 'prosemirror-keymap';

	let { node = $bindable(), onView }: { node?: Node; onView?: (view: EditorView) => void } =
		$props();

	const nodeViewFactory = useNodeViewFactory();

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
			].flat(),
			doc: node
		});
		const editorView = new EditorView(element, {
			state: editor_state,
			nodeViews: {
				paragraph: ParagraphNodeView(nodeViewFactory),
				doc: DocNodeView(nodeViewFactory),
				line: LineNodeView(nodeViewFactory),
				content: ContentNodeView(nodeViewFactory)
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
	}
</style>
