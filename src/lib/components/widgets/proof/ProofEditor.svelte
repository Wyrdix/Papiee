<script lang="ts">
	import { useMarkViewFactory, useNodeViewFactory } from '@prosemirror-adapter/svelte';
	import { EditorState, Plugin, Transaction } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { ParagraphNodeView, plugins as paragraph_plugins } from './views/Paragraph.svelte';
	import { Slice, type Node } from 'prosemirror-model';
	import { DocNodeView, plugins as doc_plugins } from './views/Doc.svelte';
	import { LineNodeView, plugins as line_plugins } from './views/Line.svelte';
	import { ContentNodeView, plugins as content_plugins } from './views/Content.svelte';
	import { unparse } from '$lib/cnl/textual';
	import '$lib/resolvedpos';
	import { MarkSelectedView, plugins as mark_selected_plugins } from './marks/MarkSelected.svelte';
	import { plugins as mark_chunks_plugins, MarkChunksView } from './marks/MarkChunks.svelte';
	import { schema } from '$lib/notebook/widgets/proof/schema';

	import '$lib/cnl/tactics';
	import type { CompletionState } from './ProofAutoCompletion.svelte';
	import ProofAutoCompletion from './ProofAutoCompletion.svelte';
	import {
		command_parsechunk,
		getChunks,
		parsechunks,
		type ProofChunk
	} from '$lib/notebook/widgets/proof/chunk';
	import ProofStateDisplay from './ProofStateDisplay.svelte';

	let {
		node = $bindable(),
		onView,
		display_goal
	}: { node?: Node; onView?: (view: EditorView) => void; display_goal: boolean } = $props();

	const nodeViewFactory = useNodeViewFactory();
	const markViewFactor = useMarkViewFactory();

	let view: EditorView | undefined = $state();
	let selected: number | -1 = $state(-1);
	let chunks: ProofChunk[] = $state([]);

	const editor = (element: HTMLElement) => {
		const editor_state = EditorState.create({
			schema,
			plugins: [
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
				}),
				mark_selected_plugins,
				mark_chunks_plugins
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
				chunks: MarkChunksView(markViewFactor)
			},

			attributes(state) {
				return { spellcheck: 'false' };
			},

			dispatchTransaction(tr) {
				const _newState = view!.state.apply(tr);
				let tr2: Transaction | undefined = undefined as Transaction | undefined;
				command_parsechunk(_newState, (_tr) => (tr2 = _tr));
				const newState = tr2 ? _newState.apply(tr2) : _newState;

				chunks = parsechunks(newState.doc).chunks;
				code = parsechunks(newState.doc)
					.chunks.filter((v) => v.type === 'tactic')
					.map((v) => v.code)
					.join('');
				let limit = chunks.findIndex((v) => v.range.from > tr.selection.head);
				if (limit === -1) limit = chunks.length;
				selected = limit - 1;

				view!.updateState(newState);
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
	let code: string = $state('');
</script>

{#if view}
	<ProofAutoCompletion {view} {completion} />
	<ProofStateDisplay {chunks} position={selected} hide={!display_goal} />
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
