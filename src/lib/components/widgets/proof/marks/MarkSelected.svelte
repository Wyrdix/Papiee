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

				let completion_begin = -1,
					completion_end = -1;
				let completion = undefined as CompletionState | undefined;
				tr.doc.nodesBetween(head.before(), head.after(), (n, pos) => {
					const completion_mark = n.marks.find((v) => v.type.name === schema.marks.selected.name);
					if (!completion_mark) return true;
					completion = completion_mark.attrs.completion as CompletionState | undefined;
					completion_begin = pos;
					completion_end = pos + n.nodeSize;
				});

				if (completion) return undefined;
				tr = newState.tr.removeMark(0, newState.doc.content.size, schema.marks.selected);

				let begin = -1,
					end = -1;
				tr.doc.nodesBetween(head.before(), head.after(), (n, pos) => {
					if (n.marks.length === 0) return true;
					if (!(head.pos >= pos && head.pos <= pos + n.nodeSize)) return true;
					if (n.marks.find((v) => v.type.name !== schema.marks.tactic.name)) return true;
					begin = pos;
					end = pos + n.nodeSize;
				});

				tr = tr.addMark(
					begin,
					end,
					schema.marks.selected.create({
						completion: {
							from: begin,
							to: end,
							selector: '.completer_position',
							value: ['Test', 'Test', 'Test', 'Test', 'Test', 'Test', 'Test', 'Test'],
							selected: undefined,
							hidden: false
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

	let id = $props.id();

	const contentRef = useMarkViewContext('contentRef');
</script>

<span class="relative">
	<span class="mark-selected" use:contentRef></span>
	<span class="completer_position"></span>
</span>

<style>
	.mark-selected {
		position: relative;
		display: inline-block;
	}

	.completer_position {
		position: absolute;
		left: 0;
		bottom: 0;
	}

	:global(.mark-selected .mark-selected::before) {
		display: none;
	}

	:global(.mark-selected .mark-tactic::before) {
		content: '';
		position: absolute;
		inset: -5px;
		border-radius: 4px !important;
		border: 2px rgba(0, 0, 255, 0.4) !important;
		pointer-events: none !important;
		border-style: solid !important;
		z-index: 1; /* sits behind the text */
	}

	:global(.mark-selected .mark-error::before) {
		content: '';
		position: absolute;
		inset: -5px;
		background-color: transparent !important;
		border-radius: 4px !important;
		border: 2px rgba(0, 0, 255, 0.4) !important;
		pointer-events: none !important;
		border-style: solid !important;
		z-index: 1; /* sits behind the text */
	}
</style>
