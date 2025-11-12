<script lang="ts">
	import Notebook from '$lib/components/Notebook.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import { PROOF_WIDGET } from '$lib/notebook/widgets/proof/structure';

	let notebook_state: NotebookState = $state([
		{ ...PROOF_WIDGET.initial(), value: 'Let $x$.\ntest' }
	]);
</script>

<div class="mx-auto h-full w-9/12">
	<Notebook bind:notebook_state />
</div>
