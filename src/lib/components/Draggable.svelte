<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	let { children }: { children: Snippet<[]> } = $props();

	let div: HTMLDivElement | undefined = $state(undefined);

	const RootAttachment: Attachment<HTMLDivElement> = (element) => {
		div = element;
		document.body.appendChild(element);
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', stopDrag);
		return () => {
			element.remove();
			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mouseup', stopDrag);
		};
	};

	let dragging = $state(false);
	let source = $state({ x: 0, y: 0 });
	let initial = $state({ x: 0, y: 0 });
	let drag_position = $state({ x: Infinity, y: 0 });
	let width = $state(0);
	let height = $state(0);
	let inbounds_position = $derived.by(() => {
		let { x, y } = drag_position;
		x = Math.max(x, 0);
		x = Math.min(x, document.body.clientWidth - width);

		y = Math.max(y, 0);
		y = Math.min(y, document.body.clientHeight - height);
		return { x, y };
	});

	function startDrag(e: MouseEvent) {
		source = {
			x: e.clientX,
			y: e.clientY
		};
		initial = { x: inbounds_position.x, y: inbounds_position.y };
		dragging = true;
	}

	function drag(e: MouseEvent) {
		if (!dragging) return;

		let x = initial.x + e.clientX - source.x;
		let y = initial.y + e.clientY - source.y;
		drag_position = { x, y };
	}

	function stopDrag() {
		dragging = false;
		drag_position = { x: inbounds_position.x, y: inbounds_position.y };
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={div}
	bind:clientWidth={width}
	bind:clientHeight={height}
	{@attach RootAttachment}
	class:dragging
	class="dragging absolute"
	onmousedown={startDrag}
	style={`top: ${inbounds_position.y}px; left: ${inbounds_position.x}px;`}
>
	{@render children()}
</div>

<style>
	:global(* .dragging) {
		user-select: none;
	}
</style>
