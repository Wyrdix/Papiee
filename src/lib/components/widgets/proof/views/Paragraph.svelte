<script lang="ts" module>
	import { onMount } from 'svelte';
	import Paragraph from './Paragraph.svelte';
	export const ParagraphNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Paragraph,
			as: 'div',
			contentAs: 'p'
		});
</script>

<script lang="ts">
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';
	import { Plugin, PluginKey, Selection } from 'prosemirror-state';
	import { schema } from '$lib/prosemirror-papiee-cnl/schema';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div use:contentRef></div>
