<script lang="ts">
	import Notebook from '$lib/components/Notebook.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import { PROOF_WIDGET } from '$lib/notebook/widgets/proof/structure';
	import { QUESTION_WIDGET } from '$lib/notebook/widgets/question/structure';

	let notebook_state: NotebookState = $state({ widgets: [PROOF_WIDGET.initial()], title: '' });

	let teacher_viewing = $state(true);
</script>

<div class="mx-auto h-full w-9/12">
	<Notebook bind:notebook_state mode={teacher_viewing ? 'teacher' : 'student'} />
	<button class="btn bg-primary-500" onclick={() => (teacher_viewing = !teacher_viewing)}
		>Change mode</button
	>
</div>
