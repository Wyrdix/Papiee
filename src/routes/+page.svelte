<script lang="ts">
	import { onMount } from 'svelte';
	import { createTacticFromTextual } from '$lib/cnl/cnl_tactic';
	import nearley from 'nearley';
	import { parse_proposition, parse_proposition_chained } from '$lib/cnl/parser';
	const { Grammar, Parser } = nearley;

	onMount(() => {
		const cnl1 = createTacticFromTextual(undefined, '{|Soit $|x|$.#|+st}', () => '');
		const cnl2 = createTacticFromTextual(undefined, '{st|Soit $|x|$.|+st2}', () => '');
		const cnl3 = createTacticFromTextual(undefined, '{st2|A.|}', () => '');
		console.log(parse_proposition_chained('Soit $a2$.Soit $a$.A.'));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
parse_proposition parse_proposition
