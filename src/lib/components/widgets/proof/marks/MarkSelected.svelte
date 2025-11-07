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
				tr = tr.addMark(head.start(), head.end(), schema.marks.selected.create());
				return tr;
			}
		})
	];
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useMarkViewContext } from '@prosemirror-adapter/svelte';
	import { marks, schema } from '$lib/prosemirror-papiee-cnl/schema';

	const contentRef = useMarkViewContext('contentRef');
</script>

<span class="mark-selected" use:contentRef></span>

<style>
	.mark-selected {
		position: relative;
		display: inline-block;
	}

	.mark-selected::before {
		content: '';
		position: absolute;
		inset: -5px;
		border-radius: 4px;
		border: 2px rgba(0, 0, 255, 0.4);
		pointer-events: none;
		border-style: solid;
		z-index: 1; /* sits behind the text */
	}

	:global(.mark-selected .mark-tactic::before) {
		border: none !important;
	}
</style>
