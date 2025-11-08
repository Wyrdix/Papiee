<script lang="ts" module>
	export type CompletionState = {
		selector: string;
		from: number;
		to: number;
		value: string[];
		selected?: number;
		hidden: boolean;
	};
</script>

<script lang="ts">
	import type { EditorView } from 'prosemirror-view';

	let { view, completion }: { view: EditorView; completion?: CompletionState } = $props();

	let div: HTMLDivElement | undefined = $state();
	let selected: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!completion || !div) return;
		const other_completes = Array.from(document.querySelectorAll('.auto-complete'));
		if (other_completes.length >= 2 || completion.hidden)
			other_completes.forEach((v) => v.remove());

		if (completion.hidden) return;
		const parent = document.querySelector(completion.selector)!;
		if (div.parentElement !== parent) parent.appendChild(div);
	});

	$effect(() => {
		if (!div || !completion?.selected) return;
		const items = Array.from(div.querySelectorAll('.item'));
		items[completion.selected].scrollIntoView({ block: 'end' });
	});
</script>

{#if completion && !completion.hidden}
	<div bind:this={div} class="auto-complete absolute z-10" contenteditable="false">
		<div class="rounded-2xl bg-surface-950-50 p-2">
			<div class="relative flex max-h-28 flex-col overflow-scroll pr-5 pl-1">
				{#each completion.value as v, i}
					<div
						class="item rounded-md p-1 text-nowrap"
						class:item-selected={completion.selected === i}
					>
						{v}
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.item-selected {
		border: 1px solid white;
		background-color: light-dark(var(--color-surface-800), var(--color-surface-200));
	}
</style>
