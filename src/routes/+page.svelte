<script lang="ts">
	import { onMount } from 'svelte';
	import { createTacticFromTextual } from '$lib/cnl/cnl_tactic';
	import nearley from 'nearley';
	import { predict } from '$lib/cnl/prediction';
	const { Grammar, Parser } = nearley;

	onMount(() => {
		const cnl2 = createTacticFromTextual(undefined, '{|Soit |A|e.#|+st}', () => '');
		const cnl3 = createTacticFromTextual(undefined, '{st2|A.|}', () => '');
		console.log(predict('', ['st2']));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
parse_proposition parse_proposition
