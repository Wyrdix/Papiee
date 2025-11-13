<script lang="ts">
	import { getWidget_unsafe, type NotebookState } from '$lib/notebook/structure';
	import NotebookAddMenu from './NotebookAddMenu.svelte';
	import RocqProvider from './RocqProvider.svelte';
	import { array_position } from '$lib/notebook/position';

	import '$lib/notebook/widgets/widgets';

	let { notebook_state = $bindable([]) }: { notebook_state?: NotebookState } = $props();

	let anchor: HTMLElement | undefined = $state();
	let anchored_i: number = $state(-1);

	let global_position = $derived(array_position(notebook_state, (v) => (notebook_state = v)));

	function setAnchorNode(node: HTMLElement | undefined, i?: number) {
		anchor = node;
		anchored_i = i == null ? -1 : i;
	}
</script>

<RocqProvider>
	<div class="flex h-full w-full flex-row bg-white text-neutral-950 scheme-dark">
		<div class="relative h-full w-40 py-10">
			{#if anchor}
				<div
					class="absolute flex w-full flex-row-reverse px-5"
					style={`top: ${anchor.offsetTop}px`}
				>
					<NotebookAddMenu bind:notebook_state {anchored_i} />
				</div>
			{/if}
		</div>
		<div class="flex h-full w-full flex-col gap-5 py-10">
			{#each notebook_state as node, i}
				{@const Component = getWidget_unsafe(node.type).component}
				{@const thisAnchoredNode = (node: HTMLElement | undefined) => setAnchorNode(node, i)}
				{@const position = global_position.value?.index === i ? node.position : undefined}
				<Component
					value={{ ...node, position }}
					setAnchorNode={thisAnchoredNode}
					onNodeValueUpdate={(_, new_v) => {
						notebook_state[i] = new_v;
					}}
					isAnchored={() => anchored_i === i}
				/>
			{/each}
		</div>
		<div class="h-full w-40"></div>
	</div>
</RocqProvider>
