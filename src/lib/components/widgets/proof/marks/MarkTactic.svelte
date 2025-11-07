<script lang="ts" module>
	import { Plugin } from 'prosemirror-state';
	import MarkTactic from './MarkTactic.svelte';
	import type { MarkViewFactory } from '@prosemirror-adapter/svelte';
	import '$lib/cnl/tactics';

	export const MarkTacticView = (factory: MarkViewFactory) =>
		factory({
			component: MarkTactic
		});
	export const plugins: Plugin[] = [
		new Plugin({
			appendTransaction(transactions, oldState, newState) {
				if (unparse(oldState.doc) === unparse(newState.doc)) return undefined;
				let tr = newState.tr;
				tr = tr.removeMark(0, newState.doc.content.size, schema.marks.tactic);

				newState.doc.descendants((node, offset, index) => {
					if (node.type.name !== schema.nodes.line.name) return true;
					const content = node.textContent;

					const result = parse_cnl(content);
					tr = tr.addMark(
						offset,
						offset + node.nodeSize,
						schema.marks.tactic.create({ error: result == null, tactic: result })
					);
					return false;
				});

				return tr;
			}
		})
	];
</script>

<script lang="ts">
	import { useMarkViewContext } from '@prosemirror-adapter/svelte';
	import { unparse } from '$lib/cnl/textual';
	import { schema } from '$lib/prosemirror-papiee-cnl/schema';
	import { parse_cnl, parse_cnl_chained } from '$lib/cnl/parser';
	import { get } from 'svelte/store';
	import type { CnlTactic } from '$lib/cnl/cnl_tactic';

	const contentRef = useMarkViewContext('contentRef');
	const mark = useMarkViewContext('mark');

	const attrs = $derived(get(mark).attrs as { tactic?: CnlTactic; error: boolean });
</script>

<span
	class="mark-tactic"
	class:mark-error={attrs.error}
	class:mark-valid={attrs.tactic != null}
	use:contentRef
></span>

<style>
	.mark-tactic {
		position: relative;
		display: inline-block;
	}

	.mark-error::before {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: 4px;
		border: 2px solid rgba(255, 0, 0, 0.4);
		background-color: rgba(255, 0, 0, 0.2);
		pointer-events: none;
		z-index: 1; /* sits behind the text */
	}

	.mark-valid::before {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: 4px;
		border: 2px dashed black;
		pointer-events: none;
		z-index: 1; /* sits behind the text */
	}
</style>
