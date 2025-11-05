<script lang="ts" module>
	export const DocNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Doc
		});
	export const plugins: Plugin[] = [];
</script>

<script lang="ts">
	import type { Plugin } from 'prosemirror-state';
	import Doc from './Doc.svelte';
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div use:contentRef></div>
