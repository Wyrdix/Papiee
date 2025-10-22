<script lang="ts">
	import { getWidgets, type NotebookState } from '$lib/notebook/structure';
	import type { Widget } from '$lib/notebook/widgets/types';
	import { PlusIcon } from '@lucide/svelte';
	import { Popover, Portal, usePopover } from '@skeletonlabs/skeleton-svelte';

	let {
		notebook_state = $bindable(),
		anchored_i
	}: { notebook_state: NotebookState; anchored_i: number } = $props();
	const id = $props.id();
	const popover = usePopover({
		id: id,
		closeOnInteractOutside: true,
		positioning: { placement: 'right' }
	});

	function addNode(widget: Widget) {
		const new_node = widget.initial();
		let unfocused = notebook_state.map((v) => widget.moveTo(v, undefined));

		notebook_state = [
			...unfocused.slice(0, anchored_i + 1),
			new_node,
			...unfocused.slice(anchored_i + 1)
		];

		const i = anchored_i + 1;

		setTimeout(() => {
			const begin = widget.getBegin(new_node);
			notebook_state[i] = widget.moveTo(new_node, begin);
		}, 20);
	}
</script>

<Popover.Provider value={popover}>
	<Popover.Trigger class="btn-icon preset-filled bg-secondary-700-300">
		<PlusIcon size={15} />
	</Popover.Trigger>
	<Portal>
		<Popover.Positioner>
			<Popover.Content>
				<div
					class="max-w-md space-y-2 card border border-surface-500/30 bg-tertiary-200-800/30 p-2 shadow-xl backdrop-blur-sm"
				>
					{#each getWidgets() as widget}
						{@const Component = widget.icon}
						<button
							onclick={() => {
								popover().setOpen(false);
								addNode(widget);
							}}
						>
							<div class="btn flex flex-row items-center gap-2 bg-secondary-300-700">
								<h4>{widget.name}</h4>
								{#if Component}
									<Component />
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</Popover.Content>
		</Popover.Positioner>
	</Portal>
</Popover.Provider>
