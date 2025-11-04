<script lang="ts" module>
	import Line from './Line.svelte';
	export const LineNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Line,
			as: 'div',
			contentAs: 'p'
		});
</script>

<script lang="ts">
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div class="min-h-4 border" use:contentRef></div>
