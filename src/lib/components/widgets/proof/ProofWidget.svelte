<script lang="ts">
	import { useProsemirrorAdapterProvider } from '@prosemirror-adapter/svelte';

	import type { WidgetProps } from '$lib/notebook/widgets/types';
	import type { ProofWidgetValue } from '$lib/notebook/widgets/proof/structure';
	import { parse, unparse } from '$lib/cnl/parser';
	import ProofEditor from './ProofEditor.svelte';
	import type { EditorView } from 'prosemirror-view';

	let { value, onNodeValueUpdate, setAnchorNode }: WidgetProps<ProofWidgetValue> = $props();

	useProsemirrorAdapterProvider();

	let cnl_value = {
		get value() {
			return parse(value.value);
		},
		set value(v) {
			if (unparse(v) === value.value) return;
			onNodeValueUpdate(value, { type: 'proof', position: value.position, value: unparse(v) });
		}
	};

	function onView(view: EditorView) {
		view.dom.addEventListener('focusin', () => {
			setAnchorNode(view.dom);
		});
	}
</script>

<ProofEditor bind:node={cnl_value.value} {onView} />
