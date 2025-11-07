<script lang="ts" module>
	import { Plugin } from 'prosemirror-state';
	import MarkSelected from './MarkSelected.svelte';
	import type { MarkViewFactory } from '@prosemirror-adapter/svelte';

	export const MarkSelectedView = (factory: MarkViewFactory) =>
		factory({
			component: MarkSelected
		});
	export const plugins: Plugin[] = [
		new Plugin({
			appendTransaction(transactions, oldState, newState) {
				let tr = newState.tr;
				tr = newState.tr.removeMark(0, newState.doc.content.size, schema.marks.selected);
				const head = tr.selection.$head;

				let begin = -1,
					end = -1;
				tr.doc.nodesBetween(head.before(), head.after(), (n, pos) => {
					if (n.marks.length === 0) return true;
					if (!(head.pos >= pos && head.pos <= pos + n.nodeSize)) return true;
					if (n.marks.find((v) => v.type.name !== schema.marks.tactic.name)) return true;
					begin = pos;
					end = pos + n.nodeSize;
				});

				tr = tr.addMark(begin, end, schema.marks.selected.create());
				return tr;
			}
		})
	];
</script>

<script lang="ts">
	import { useMarkViewContext } from '@prosemirror-adapter/svelte';
	import { schema } from '$lib/components/widgets/proof/schema';

	const contentRef = useMarkViewContext('contentRef');
</script>

<span class="mark-selected" use:contentRef></span>

<style>
	.mark-selected {
		position: relative;
		display: inline-block;
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
