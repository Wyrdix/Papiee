<script lang="ts">
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
	import { MarkSelectedView, plugins as mark_selected_plugins } from './marks/MarkSelected.svelte';
	import { plugins as mark_tactic_plugins, MarkTacticView } from './marks/MarkTactic.svelte';
	import { schema } from '$lib/components/widgets/proof/schema';

	import '$lib/cnl/tactics';
	import type { CompletionState } from './ProofAutoCompletion.svelte';
	import ProofAutoCompletion from './ProofAutoCompletion.svelte';
	import { setContext } from 'svelte';

	let { node = $bindable(), onView }: { node?: Node; onView?: (view: EditorView) => void } =
		$props();

	const nodeViewFactory = useNodeViewFactory();
	const markViewFactor = useMarkViewFactory();

	let view: EditorView | undefined = $state();

	const editor = (element: HTMLElement) => {
		const editor_state = EditorState.create({
			schema,
			plugins: [
				mark_selected_plugins,
				mark_tactic_plugins,
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
					},
					view(view) {
						return {
							update(view, prevState) {
								view.state.doc.descendants((node, pos, parent) => {
									const selected = node.marks.find(
										(v) => v.type.name === schema.marks.selected.name
									);
									if (!selected) return true;
									completion = selected.attrs.completion as CompletionState | undefined;
								});
							}
						};
					}
				})
			].flat()
		});
		view = new EditorView(element, {
			state: editor_state,
			nodeViews: {
				paragraph: ParagraphNodeView(nodeViewFactory),
				doc: DocNodeView(nodeViewFactory),
				line: LineNodeView(nodeViewFactory),
				content: ContentNodeView(nodeViewFactory)
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
			if (node && unparse(node) !== unparse(view!.state.doc)) {
				view!.dispatch(view!.state.tr.replaceRangeWith(0, view!.state.doc.content.size - 1, node));
			}
		});
		if (onView) onView(view);
	};

	let completion: CompletionState | undefined = $state();
</script>

{#if view}
	<ProofAutoCompletion {view} {completion} />
{/if}
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

	:global(.ProseMirror:focus) {
		outline: none;
	}
</style>
