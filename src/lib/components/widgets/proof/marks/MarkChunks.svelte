<script lang="ts" module>
	import { Plugin, Selection, Transaction } from 'prosemirror-state';
	import MarkChunks from './MarkChunks.svelte';
	import type { MarkViewFactory } from '@prosemirror-adapter/svelte';

	export const MarkChunksView = (factory: MarkViewFactory) =>
		factory({
			component: MarkChunks
		});
	export const plugins: Plugin[] = [
		new Plugin({
			appendTransaction(_transactions, oldState, newState) {
				if (unparse(oldState.doc) === unparse(newState.doc)) return;
				let tr: Transaction | undefined = undefined;
				command_parsechunk(newState, (_tr) => (tr = _tr));
				return tr;
			}
		})
	];
</script>

<script lang="ts">
	import { useMarkViewContext } from '@prosemirror-adapter/svelte';
	import { unparse } from '$lib/cnl/textual';
	import { command_parsechunk, type ProofChunk } from '$lib/notebook/widgets/proof/chunk';
	import { derived, get } from 'svelte/store';

	let id = $props.id();

	const contentRef = useMarkViewContext('contentRef');
	const _mark = useMarkViewContext('mark');

	const mark = $derived(get(_mark));
	const chunks = $derived(mark.attrs.value as ProofChunk[]);

	const chunk = $derived(chunks.find((v) => v.range.from !== v.range.to)!);
</script>

<span class="mark-chunks selected-frame" data-type={chunk.type} use:contentRef></span>

<style>
	.mark-chunks {
		position: relative;
		display: inline-block;
		margin-left: 20px;
		margin-right: 0px;
	}

	:global(.mark-chunks[data-type='tactic']) {
		--selected-border: black;
		--selected-background: rgba(0, 0, 0, 0.05);
		--unselected-border: black;
		--unselected-background: transparent;
	}
	:global(.mark-chunks[data-type='error']) {
		--selected-border: pink;
		--selected-background: rgba(255, 192, 203, 0.2);
		--unselected-border: red;
		--unselected-background: transactions;
	}
	:global(.mark-chunks[data-type='comment']) {
		--selected-border: gray;
		--selected-background: rgba(128, 128, 128, 0.2);
		--unselected-border: gray;
		--unselected-background: gray;
	}

	:global(.mark-chunks::before) {
		content: '';
		position: absolute;
		inset: -5px;
		border-radius: 4px;
		border-width: 2px;
		pointer-events: none;
		border-style: solid;
		border-color: var(--unselected-border);
		background-color: var(--unselected-background);
		z-index: 1; /* sits behind the text */
	}
</style>
