<script lang="ts" module>
	import Doc from './Doc.svelte';
	export const DocNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Doc,
			as: 'div',
			contentAs: 'p'
		});
</script>

<script lang="ts">
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div use:contentRef></div>
