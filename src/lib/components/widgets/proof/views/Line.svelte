<script lang="ts" module>
	export const LineNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Line
		});
	export const plugins: Plugin[] = [];
</script>

<script lang="ts">
	import type { Plugin } from 'prosemirror-state';
	import Line from './Line.svelte';
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div class="line min-h-4 py-3" use:contentRef></div>

<style>
	.line {
		word-break: break-all;
		text-wrap-mode: wrap;
		max-width: 90%;
	}
</style>
