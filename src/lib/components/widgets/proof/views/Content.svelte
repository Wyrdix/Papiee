<script lang="ts" module>
	import { get } from 'svelte/store';
	import Content from './Content.svelte';
	export const ContentNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Content,
			as: 'div',
			contentAs: 'p'
		});
</script>

<script lang="ts">
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';

	const contentRef = useNodeViewContext('contentRef');
	const view = useNodeViewContext('view');
	const node = useNodeViewContext('node');

	let isRoot = $derived(get(node) === view.state.doc.child(0));
</script>

<div use:contentRef class:ml-5={!isRoot}></div>
