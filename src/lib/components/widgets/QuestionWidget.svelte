<script lang="ts">
	import type { QuestionWidgetValue } from '$lib/notebook/widgets/question/structure';
	import type { WidgetProps } from '$lib/notebook/widgets/types';
	import MarkdownWidget from './MarkdownWidget.svelte';
	import ProofWidget from './ProofWidget.svelte';
	import RocqWidget from './RocqWidget.svelte';

	let {
		value,
		onNodeValueUpdate,
		setAnchorNode: _setAnchorNode,
		isAnchored
	}: WidgetProps<QuestionWidgetValue> = $props();

	function setAnchorNode() {
		_setAnchorNode(div);
	}

	let div: HTMLDivElement | undefined = $state();
</script>

<div bind:this={div} class="flex flex-col gap-5">
	<MarkdownWidget
		{setAnchorNode}
		{isAnchored}
		value={{
			type: 'markdown',
			...value.markdown_header,
			position: value.position?.field === 'markdown_header' ? value.position.index : undefined
		}}
		onNodeValueUpdate={(_old_markdown, new_markdown) => {
			delete new_markdown.position;
			onNodeValueUpdate(value, {
				...value,
				markdown_header: new_markdown,
				position: new_markdown.position
					? { field: 'markdown_header', index: new_markdown.position }
					: value.position
			});
		}}
	/>

	<RocqWidget
		{setAnchorNode}
		{isAnchored}
		value={{
			type: 'rocq',
			...value.rocq_header,
			position: value.position?.field === 'rocq_header' ? value.position.index : undefined
		}}
		onNodeValueUpdate={(_old_rocq, new_rocq) => {
			delete new_rocq.position;
			onNodeValueUpdate(value, {
				...value,
				rocq_header: new_rocq,
				position: new_rocq.position
					? { field: 'rocq_header', index: new_rocq.position }
					: value.position
			});
		}}
	/>

	<ProofWidget
		{setAnchorNode}
		{isAnchored}
		value={{
			type: 'proof',
			...value.cnl_proof,
			position: value.position?.field === 'cnl_proof' ? value.position.index : undefined
		}}
		onNodeValueUpdate={(_old_cnl_proof, new_cnl_proof) => {
			delete new_cnl_proof.position;
			onNodeValueUpdate(value, {
				...value,
				cnl_proof: new_cnl_proof,
				position: new_cnl_proof.position
					? { field: 'cnl_proof', index: new_cnl_proof.position }
					: value.position
			});
		}}
	/>
</div>
