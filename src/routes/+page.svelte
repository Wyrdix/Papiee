<script lang="ts">
	import { onMount } from 'svelte';
	import { createTacticFromTextual } from '$lib/cnl/cnl_tactic';
	import nearley from 'nearley';
	import { predict } from '$lib/cnl/prediction';
	import { parse_cnl, parse_cnl_chained } from '$lib/cnl/parser';
	const { Grammar, Parser } = nearley;

	onMount(() => {
		const cnl1 = createTacticFromTextual(undefined, '{|cnl1|+st}', () => '');
		const cnl2 = createTacticFromTextual(undefined, '{st|cnl2|}', () => '');
		const cnl3 = createTacticFromTextual(undefined, '{st||-+st2}', () => '');
		const cnl4 = createTacticFromTextual(undefined, '{st2|cnl4|}', () => '');
		console.log(parse_cnl_chained('cnl1cnl2cnl2cnl4'));
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
parse_proposition parse_proposition
