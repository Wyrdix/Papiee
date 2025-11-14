<script lang="ts">
	import CodeMirror from 'svelte-codemirror-editor';
	import { markdown } from '@codemirror/lang-markdown';

	import MarkdownIt from 'markdown-it';
	import type { WidgetProps } from '$lib/notebook/widgets/types';
	import type { MarkdownWidgetValue } from '$lib/notebook/widgets/markdown/structure';
	import { BrickWallIcon, PickaxeIcon } from '@lucide/svelte';
	import { EditorView } from 'codemirror';

	let { value, onNodeValueUpdate, setAnchorNode, mode }: WidgetProps<MarkdownWidgetValue> =
		$props();

	let compiled = $derived.by(() => {
		const md = new MarkdownIt({
			html: true,
			linkify: true,
			typographer: true
		});
		return md.render(value.value.trim());
	});

	let text = $derived(value.value);
	let position = $derived(value?.position == null ? null : Math.max(value.position, 0));

	let div: HTMLElement | undefined = $state();
	let view: EditorView | undefined = $state();

	$effect(() => {
		if (!view) return;
		const old_position = view.state.selection.main.head;
		const new_position = position;
		if (new_position === old_position && new_position != null && view.hasFocus) return;
		if (new_position != null) {
			if (!view.hasFocus) {
				view.focus();
				view.dispatch({ selection: { anchor: new_position } });
			} else {
				view.dispatch({ selection: { anchor: new_position } });
			}
		} else view.contentDOM.blur();
	});
</script>

{#if !(text.trim().length === 0 && mode === 'student')}
	<div bind:this={div} class="relative" onfocusin={() => setAnchorNode(div)}>
		{#if value.compiled || mode === 'student'}
			<div
				class="prose min-h-10 w-full"
				role="article"
				ondblclick={() => onNodeValueUpdate(value, { ...value, compiled: false })}
				tabindex="-1"
			>
				{@html compiled}
			</div>
		{:else}
			<div class="flex w-full flex-col items-start gap-1">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 208 128" class="h-4"
					><rect
						width="198"
						height="118"
						x="5"
						y="5"
						ry="10"
						stroke="#000"
						stroke-width="10"
						fill="none"
					/><path
						d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z"
					/></svg
				>
				<CodeMirror
					class="w-full"
					onready={(v) => {
						view = v;
						if (position != null) {
							view.focus();
							view.dispatch({ selection: { anchor: position, head: position } });
						}
					}}
					bind:value={() => text, (v) => onNodeValueUpdate(value, { ...value, value: v })}
					lang={markdown()}
					extensions={[
						EditorView.updateListener.of((state) => {
							if (state.focusChanged)
								if (view?.hasFocus) {
									onNodeValueUpdate(value, { ...value, position: state.state.selection.main.head });
								} else {
									onNodeValueUpdate(value, { ...value, position: undefined });
								}
							else if (state.selectionSet) {
								if (view && state.state.selection.main.head !== value.position) {
									onNodeValueUpdate(value, { ...value, position: state.state.selection.main.head });
								}
							}
						})
					]}
				/>
			</div>
		{/if}
		{#if mode === 'teacher'}
			<div class="absolute top-0 right-2 btn-icon preset-filled-secondary-500 text-primary-100-900">
				<button onclick={() => onNodeValueUpdate(value, { ...value, compiled: !value.compiled })}
					>{#if value.compiled}
						<PickaxeIcon />
					{:else}
						<BrickWallIcon />
					{/if}</button
				>
			</div>
		{/if}
	</div>
{/if}
