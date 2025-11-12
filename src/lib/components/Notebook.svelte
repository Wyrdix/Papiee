<script lang="ts">
	import { getWidget_unsafe, type NotebookState } from '$lib/notebook/structure';
	import { MARKDOWN_WIDGET } from '$lib/notebook/widgets/markdown/structure';
	import { PROOF_WIDGET } from '$lib/notebook/widgets/proof/structure';
	import NotebookAddMenu from './NotebookAddMenu.svelte';
	import RocqProvider from './RocqProvider.svelte';

	let { notebook_state = $bindable([]) }: { notebook_state?: NotebookState } = $props();

	let anchor: HTMLElement | undefined = $state();
	let anchored_i: number = $state(-1);

	let global_position: {
		value: { index: number; position: NotebookState[number]['position'] } | undefined;
	} = {
		get value() {
			const i0 = notebook_state.findIndex((v) => v.position != null);
			const i1 = notebook_state.findLastIndex((v) => v.position != null);
			if (i0 !== i1 || i0 === -1) return undefined;
			const i = i0;

			return {
				index: i,
				position: notebook_state[i].position
			};
		},

		set value(v) {
			const { index, position } = v || { index: -1, position: undefined };
			notebook_state = notebook_state.map((v, i) =>
				i === index ? { ...v, position } : { ...v, position: undefined }
			);
		}
	};

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
				/>
			{/each}
		</div>
		<div class="h-full w-40"></div>
	</div>
</RocqProvider>
