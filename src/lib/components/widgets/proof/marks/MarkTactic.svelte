<script lang="ts" module>
	import { Plugin, PluginKey, Selection } from 'prosemirror-state';
	import MarkTactic from './MarkTactic.svelte';
	import type { MarkViewFactory } from '@prosemirror-adapter/svelte';
	import '$lib/cnl/tactics';

	export const MarkTacticView = (factory: MarkViewFactory) =>
		factory({
			component: MarkTactic
		});
	export const plugins: Plugin[] = [
		new Plugin({
			appendTransaction(transactions, oldState, newState) {
				if (unparse(oldState.doc) === unparse(newState.doc)) return undefined;
				let tr = newState.tr;
				tr = tr.removeMark(0, newState.doc.content.size, schema.marks.tactic);

				newState.doc.descendants((node, offset, index) => {
					if (node.type.name !== schema.nodes.line.name) return true;
					const content = node.textContent;
					const result = parse_cnl_chained(content);

					let _offset = 0;
					for (let i = 0; result != null && i < result.ends.length; i++) {
						tr = tr.addMark(
							offset + _offset,
							offset + result.ends[i] + 1,
							schema.marks.tactic.create({
								error: false,
								tactic: result.result[i],
								last: result.ends[i] + 1 > node.content.size
							})
						);
						_offset = result.ends[i] + 1;
					}

					if (_offset <= node.content.size)
						tr = tr.addMark(
							offset + _offset,
							offset + node.nodeSize,
							schema.marks.tactic.create({ error: true })
						);
					return false;
				});

				return tr;
			}
		}),
		new Plugin({
			...keymap({
				'Ctrl-Delete': (state, dispatch) => {
					const { $head: head } = state.selection;

					if (head.parentOffset === head.parent.content.size) return false;
					if (dispatch) {
						let tr = state.tr;
						tr = tr.deleteRange(head.pos, head.pos + 1);
						dispatch(tr);
						return true;
					}

					return false;
				},
				Delete: (state, dispatch) => {
					const { $head: head } = state.selection;

					if (head.parentOffset === head.parent.content.size) return false;
					if (dispatch) {
						let tr = state.tr;
						tr = tr.deleteRange(head.pos, head.pos + 1);
						dispatch(tr);
						return true;
					}

					return false;
				},
				Backspace: (state, dispatch) => {
					const { $head: head } = state.selection;

					if (head.parentOffset === 0) return false;
					if (dispatch) {
						let tr = state.tr;
						tr = tr.deleteRange(head.pos - 1, head.pos);
						dispatch(tr);
						return true;
					}

					return false;
				},

				'Ctrl-Backspace': (state, dispatch) => {
					const { $head: head } = state.selection;

					if (head.parentOffset === 0) return false;
					if (dispatch) {
						let tr = state.tr;
						tr = tr.deleteRange(head.pos - 1, head.pos);
						dispatch(tr);
						return true;
					}

					return false;
				}
			}),
			key: new PluginKey('MarkTacticKeymap')
		})
	];
</script>

<script lang="ts">
	import { useMarkViewContext } from '@prosemirror-adapter/svelte';
	import { unparse } from '$lib/cnl/textual';
	import { schema } from '$lib/components/widgets/proof/schema';
	import { parse_cnl_chained } from '$lib/cnl/parser';
	import { get } from 'svelte/store';
	import type { CnlTactic } from '$lib/cnl/cnl_tactic';
	import { keymap } from 'prosemirror-keymap';

	const contentRef = useMarkViewContext('contentRef');
	const mark = useMarkViewContext('mark');

	const attrs = $derived(get(mark).attrs as { tactic?: CnlTactic; error: boolean; last: boolean });
</script>

<span
	class="mark-tactic"
	class:mark-error={attrs.error}
	class:mark-valid={attrs.tactic != null}
	class:right-margin={!attrs.last}
	use:contentRef
></span>

<style>
	.mark-tactic {
		position: relative;
		display: inline-block;
		margin-left: 4px;
	}

	:global(.mark-tactic .mark-tactic::before) {
		display: none;
	}

	.mark-error::before {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: 4px;
		border: 2px solid rgba(255, 0, 0, 0.4);
		background-color: rgba(255, 0, 0, 0.2);
		pointer-events: none;
		z-index: 1; /* sits behind the text */
	}

	.mark-valid.right-margin {
		margin-right: 20px;
	}

	.mark-valid::before {
		content: '';
		position: absolute;
		inset: -4px -4px;
		border-radius: 4px;
		border: 2px dashed black;
		pointer-events: none;
		z-index: 1; /* sits behind the text */
	}
</style>
