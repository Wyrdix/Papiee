<script lang="ts" module>
	import { Plugin, PluginKey, Selection } from 'prosemirror-state';
	import MarkSelected from './MarkSelected.svelte';
	import type { MarkViewFactory } from '@prosemirror-adapter/svelte';

	export const MarkSelectedView = (factory: MarkViewFactory) =>
		factory({
			component: MarkSelected
		});
	export const plugins: Plugin[] = [
		new Plugin({
			...keymap({
				ArrowDown: (state, dispatch) => {
					let tr = state.tr;
					const head = tr.selection.$head;
					let completion = undefined as CompletionState | undefined;
					let begin = -1,
						end = -1;
					tr.doc.nodesBetween(head.before(), head.after(), (n, pos) => {
						const completion_mark = n.marks.find((v) => v.type.name === schema.marks.selected.name);
						if (!completion_mark) return true;
						completion = completion_mark.attrs.completion as CompletionState | undefined;
						begin = pos;
						end = pos + n.nodeSize;
					});
					if (completion && completion.hidden) return false;
					if (dispatch) {
						if (completion) {
							completion = {
								...completion,
								selected:
									completion.value.length === 0
										? undefined
										: Math.max(
												Math.min(
													(completion.selected == null ? -1 : completion.selected) + 1,
													completion.value.length - 1
												),
												0
											)
							};
						}
						tr = tr
							.removeMark(begin, end, schema.marks.selected)
							.addMark(begin, end, schema.marks.selected.create({ completion }));
						dispatch(tr);
						return true;
					}
					return false;
				},
				ArrowUp: (state, dispatch) => {
					let tr = state.tr;
					const head = tr.selection.$head;
					let completion = undefined as CompletionState | undefined;
					let begin = -1,
						end = -1;
					tr.doc.nodesBetween(head.before(), head.after(), (n, pos) => {
						const completion_mark = n.marks.find((v) => v.type.name === schema.marks.selected.name);
						if (!completion_mark) return true;
						completion = completion_mark.attrs.completion as CompletionState | undefined;
						begin = pos;
						end = pos + n.nodeSize;
					});
					if (completion && completion.hidden) return false;
					if (dispatch) {
						if (completion) {
							completion = {
								...completion,
								selected:
									completion.value.length === 0
										? undefined
										: Math.max(
												Math.min(
													(completion.selected == null ? 1 : completion.selected) - 1,
													completion.value.length - 1
												),
												0
											)
							};
						}
						tr = tr
							.removeMark(begin, end, schema.marks.selected)
							.addMark(begin, end, schema.marks.selected.create({ completion }));
						dispatch(tr);
						return true;
					}
					return false;
				},
				Escape: (state, dispatch) => {
					let tr = state.tr;
					const head = tr.selection.$head;
					let completion = undefined as CompletionState | undefined;
					let begin = -1,
						end = -1;
					tr.doc.nodesBetween(head.before(), head.after(), (n, pos) => {
						const completion_mark = n.marks.find((v) => v.type.name === schema.marks.selected.name);
						if (!completion_mark) return true;
						completion = completion_mark.attrs.completion as CompletionState | undefined;
						begin = pos;
						end = pos + n.nodeSize;
					});
					if (completion && completion.hidden) return false;
					if (dispatch) {
						if (completion) {
							completion = {
								...completion,
								hidden: true
							};
						}
						tr = tr
							.removeMark(begin, end, schema.marks.selected)
							.addMark(begin, end, schema.marks.selected.create({ completion }));
						dispatch(tr);
						return true;
					}
					return false;
				},
				Enter: (state, dispatch) => {
					let tr = state.tr;
					const head = tr.selection.$head;
					let completion = undefined as CompletionState | undefined;
					let begin = -1,
						end = -1;
					tr.doc.nodesBetween(head.before(), head.after(), (n, pos) => {
						const completion_mark = n.marks.find((v) => v.type.name === schema.marks.selected.name);
						if (!completion_mark) return true;
						completion = completion_mark.attrs.completion as CompletionState | undefined;
						begin = pos;
						end = pos + n.nodeSize;
					});
					if (!completion || completion.hidden) return false;
					if (dispatch) {
						const replaceWith =
							completion.selected != null ? completion.value[completion.selected] : undefined;
						if (!replaceWith) return false;
						tr = tr
							.removeMark(begin, end, schema.marks.selected)
							.replaceWith(completion.from, completion.to, schema.text(replaceWith));
						tr = tr.setSelection(Selection.near(tr.doc.resolve(begin + replaceWith.length)));
						tr.doc.check();
						dispatch(tr);
						return true;
					}
					return false;
				}
			}),
			key: new PluginKey('MarkSelectedKeymap')
		}),
		new Plugin({
			appendTransaction(transactions, oldState, newState) {
				let tr = newState.tr;
				const head = tr.selection.$head;
				const index = Math.min(head.index(), head.node().childCount - 1);
				const text = head.node().child(index);
				const main = getMainChunk(getChunks(text));
				if (!main) return;
				const { from, to } = main.range;
				const existing_selection = text.marks.find(
					(v) => v.type.name === schema.marks.selected.name
				)?.attrs;
				if (existing_selection) return;
				tr = tr.removeMark(0, tr.doc.content.size, schema.marks.selected).addMark(
					from,
					to,
					schema.marks.selected.create({
						completion: {
							from,
							to,
							selector: '.completer_position',
							value: ['Test', 'Test', 'Test', 'Test', 'Test', 'Test', 'Test', 'Test'],
							selected: undefined,
							hidden: true
						} satisfies CompletionState | undefined
					})
				);
				return tr;
			}
		})
	];
</script>

<script lang="ts">
	import { useMarkViewContext } from '@prosemirror-adapter/svelte';
	import { schema } from '$lib/components/widgets/proof/schema';
	import type { CompletionState } from '../ProofAutoCompletion.svelte';
	import { keymap } from 'prosemirror-keymap';
	import { getChunks, getMainChunk, type ProofChunk } from '$lib/notebook/widgets/proof/chunk';

	let id = $props.id();

	const contentRef = useMarkViewContext('contentRef');
</script>

<span class="relative">
	<span class="mark-selected" use:contentRef></span><span class="completer_position"></span>
</span>

<style>
	.mark-selected {
		position: relative;
		display: inline-block;
	}

	.completer_position {
		position: absolute;
		width: 0;
		height: 0;
		left: 0;
		bottom: 0;
	}

	:global(.mark-selected .selected-frame::before) {
		content: '';
		position: absolute;
		inset: -5px !important;
		border-radius: 4px !important;
		border-width: 2px !important;
		pointer-events: none !important;
		border-style: solid !important;
		border-color: var(--selected-border) !important;
		background-color: var(--selected-background) !important;
		z-index: 1; /* sits behind the text */
	}
</style>
