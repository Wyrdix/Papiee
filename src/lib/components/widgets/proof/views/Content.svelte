<script lang="ts" module>
	export const ContentNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Content
		});
	export const plugins: Plugin[] = [];
</script>

<script lang="ts">
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';
	import type { Plugin } from 'prosemirror-state';
	import { get } from 'svelte/store';
	import Content from './Content.svelte';

	const contentRef = useNodeViewContext('contentRef');
	const view = useNodeViewContext('view');
	const node = useNodeViewContext('node');

	let isRoot = $derived(get(node) === view.state.doc.child(0));
</script>

<div class="paragraph-content">
	<div use:contentRef class:ml-5={!isRoot}></div>
</div>
