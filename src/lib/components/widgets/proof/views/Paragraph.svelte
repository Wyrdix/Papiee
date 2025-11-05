<script lang="ts" module>
	export const ParagraphNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Paragraph
		});

	function direct_parent_depth(
		pos: ResolvedPos,
		name: keyof typeof nodes,
		ignore: number = 0
	): number {
		let i = pos.depth + 1;
		for (; i >= 0; i--) if (pos.node(i)?.type.name === name) if (--ignore < 0) break;
		return i;
	}

	// Common logic is extracted for Backspace and Delete
	const DeleteBack: (
		state: EditorState,
		dispatch: ((tr: Transaction) => void) | undefined,
		view: EditorView | undefined
	) => boolean = (state, dispatch, view) => {
		const head = state.selection.$head;
		if (head.start() !== head.pos) return false; // Skipping backspace in line

		const paragraph_pos = head.$start(direct_parent_depth(head, 'paragraph'));

		let preceding_line_pos = paragraph_pos.$decrement();
		while (preceding_line_pos.pos > 0 && preceding_line_pos.node().type.name !== 'line')
			preceding_line_pos = preceding_line_pos.$decrement();

		if (preceding_line_pos.pos === 0) return false;

		const preceding_paragraph_pos = preceding_line_pos.$start(
			direct_parent_depth(preceding_line_pos, 'paragraph')
		);
		const parent_paragraph_pos = preceding_line_pos.$start(
			direct_parent_depth(preceding_line_pos, 'paragraph', 1)
		);

		// TODO going to parent
		if (preceding_paragraph_pos.pos === parent_paragraph_pos.pos) {
			if (dispatch) {
				let tr = state.tr;
				let preserve_content_node =
					paragraph_pos.node().childCount === 2 ||
					(parent_paragraph_pos.node().maybeChild(1)?.childCount || 0) > 1;
				tr = tr.delete(
					paragraph_pos.before() - (preserve_content_node ? 0 : 1),
					paragraph_pos.after() + (preserve_content_node ? 0 : 1)
				);
				tr = tr.insert(preceding_line_pos.end(), paragraph_pos.node().child(0).children);
				const after_pos = tr.doc.resolve(
					preceding_line_pos.end() + paragraph_pos.node().child(0).nodeSize
				);
				if (paragraph_pos.node().maybeChild(1)) {
					if ((parent_paragraph_pos.node().maybeChild(1)?.childCount || 0) > 1) {
						tr = tr.insert(after_pos.pos, paragraph_pos.node().child(1).children);
					} else {
						// We need to remove the empty line that was created when content node was preserved but empty
						tr = tr.replaceWith(
							after_pos.start(),
							after_pos.end(),
							paragraph_pos.node().child(1).children
						);
					}
				}
				tr.doc.check();
				tr = tr.setSelection(Selection.near(tr.doc.resolve(preceding_line_pos.pos)));

				dispatch(tr);

				return true;
			}
		} else {
			if (dispatch) {
				let tr = state.tr;
				tr = tr.delete(paragraph_pos.before(), paragraph_pos.after());
				tr = tr.insert(preceding_line_pos.end(), paragraph_pos.node().child(0).children);
				const after_pos = tr.doc.resolve(
					preceding_line_pos.end() + paragraph_pos.node().child(0).nodeSize
				);
				if (paragraph_pos.node().childCount === 2) {
					tr = tr.insert(after_pos.pos, paragraph_pos.node().child(1).children);
				}
				tr = tr.setSelection(Selection.near(tr.doc.resolve(preceding_line_pos.pos)));
				dispatch(tr);

				return true;
			}
		}

		return false;
	};

	const keymap_definition: { [key in string]: Command } = {
		Backspace: (state, dispatch) => {
			const head = state.selection.$head;
			if (head.start() !== head.pos) return false; // Skipping backspace in line

			const paragraph_pos = head.$start(direct_parent_depth(head, 'paragraph'));

			let preceding_line_pos = paragraph_pos.$decrement();
			while (preceding_line_pos.pos > 0 && preceding_line_pos.node().type.name !== 'line')
				preceding_line_pos = preceding_line_pos.$decrement();

			if (preceding_line_pos.pos === 0) return false;

			const preceding_paragraph_pos = preceding_line_pos.$start(
				direct_parent_depth(preceding_line_pos, 'paragraph')
			);
			const parent_paragraph_pos = preceding_line_pos.$start(
				direct_parent_depth(preceding_line_pos, 'paragraph', 1)
			);

			// TODO going to parent
			if (preceding_paragraph_pos.pos === parent_paragraph_pos.pos) {
				if (dispatch) {
					let tr = state.tr;
					let preserve_content_node =
						paragraph_pos.node().childCount === 2 ||
						(parent_paragraph_pos.node().maybeChild(1)?.childCount || 0) > 1;
					tr = tr.delete(
						paragraph_pos.before() - (preserve_content_node ? 0 : 1),
						paragraph_pos.after() + (preserve_content_node ? 0 : 1)
					);
					tr = tr.insert(preceding_line_pos.end(), paragraph_pos.node().child(0).children);
					const after_pos = tr.doc.resolve(
						preceding_line_pos.end() + paragraph_pos.node().child(0).nodeSize
					);
					if (paragraph_pos.node().maybeChild(1)) {
						if ((parent_paragraph_pos.node().maybeChild(1)?.childCount || 0) > 1) {
							tr = tr.insert(after_pos.pos, paragraph_pos.node().child(1).children);
						} else {
							// We need to remove the empty line that was created when content node was preserved but empty
							tr = tr.replaceWith(
								after_pos.start(),
								after_pos.end(),
								paragraph_pos.node().child(1).children
							);
						}
					}
					tr.doc.check();
					tr = tr.setSelection(Selection.near(tr.doc.resolve(preceding_line_pos.pos)));

					dispatch(tr);

					return true;
				}
			} else {
				if (dispatch) {
					let tr = state.tr;
					tr = tr.delete(paragraph_pos.before(), paragraph_pos.after());
					tr = tr.insert(preceding_line_pos.end(), paragraph_pos.node().child(0).children);
					const after_pos = tr.doc.resolve(
						preceding_line_pos.end() + paragraph_pos.node().child(0).nodeSize
					);
					if (paragraph_pos.node().childCount === 2) {
						tr = tr.insert(after_pos.pos, paragraph_pos.node().child(1).children);
					}
					tr = tr.setSelection(Selection.near(tr.doc.resolve(preceding_line_pos.pos)));
					dispatch(tr);

					return true;
				}
			}

			return false;
		},
		Delete: (state, dispatch) => {
			const head = state.selection.$head;
			if (head.end() !== head.pos) return false; // Skipping delete in line

			const paragraph_pos = head.$start(direct_parent_depth(head, 'paragraph'));

			let preceding_line_pos = paragraph_pos.$posAtIndex(0).$increment().$after();
			while (
				preceding_line_pos.pos < state.doc.content.size &&
				preceding_line_pos.node().type.name !== 'line'
			) {
				preceding_line_pos = preceding_line_pos.$increment();
			}

			if (preceding_line_pos.pos === state.doc.content.size) return false;
			return keymap_definition.Backspace(
				state.applyTransaction(state.tr.setSelection(Selection.near(preceding_line_pos))).state,
				dispatch
			);
		},
		Enter: (state, dispatch) => {
			const head = state.selection.$head;

			// If at first level we can't reduce the indent
			const paragraph = head.node(direct_parent_depth(head, 'paragraph'));

			const line = head.node(direct_parent_depth(head, 'line'));
			const preserved = line.textContent.substring(0, head.parentOffset);
			const new_line = line.textContent.substring(head.parentOffset);

			const start = head.start(direct_parent_depth(head, 'paragraph'));
			const end = head.end(direct_parent_depth(head, 'paragraph'));
			const hasChildren = paragraph.childCount > 1;
			if (!hasChildren) {
				if (dispatch) {
					let tr = state.tr;
					if (preserved === new_line && new_line === '') {
						return keymap_definition['Ctrl-Shift-ArrowLeft'](state, dispatch);
					} else {
						tr = tr.replaceWith(start - 1, end + 1, [
							schema.nodes.paragraph.create(undefined, [
								schema.nodes.line.create(
									undefined,
									preserved.length === 0 ? undefined : schema.text(preserved)
								)
							]),
							schema.nodes.paragraph.create(undefined, [
								schema.nodes.line.create(
									undefined,
									new_line.length === 0 ? undefined : schema.text(new_line)
								)
							])
						]);
						let rebuild_selection_head = tr.doc.resolve(start).after(); // Before 2nd paragraph
						rebuild_selection_head += 2; // Enter paragraph then line
						tr.doc.check();
						tr = tr.setSelection(Selection.near(tr.doc.resolve(rebuild_selection_head)));
						dispatch(tr);
						return true;
					}
				}
			} else {
				if (dispatch) {
					let tr = state.tr;

					tr = tr.replaceRangeWith(
						start - 1,
						end + 1,
						schema.nodes.paragraph.create(undefined, [
							schema.nodes.line.create(
								undefined,
								preserved.length === 0 ? undefined : schema.text(preserved)
							),
							schema.nodes.content.create(undefined, [
								schema.nodes.paragraph.create(
									undefined,
									schema.nodes.line.create(
										undefined,
										new_line.length === 0 ? undefined : schema.text(new_line)
									)
								),
								...paragraph.child(1).children
							])
						])
					);
					tr.doc.check();

					let rebuild_selection_head = tr.doc.resolve(start).posAtIndex(1); // Before begin of content
					rebuild_selection_head += 3; // Enter content, paragraph and line
					tr = tr.setSelection(Selection.near(tr.doc.resolve(rebuild_selection_head)));

					dispatch(tr);
					return true;
				}
			}
			return false;
		},
		'Ctrl-Shift-ArrowLeft': (state, dispatch) => {
			const head = state.selection.$head;
			const content_i = direct_parent_depth(head, 'content');
			const parent_content_i = direct_parent_depth(head, 'content', 1);

			// If at first level we can't reduce the indent
			if (content_i === -1 || parent_content_i === -1) return true;

			const toberemoved_startcontent =
				head.index(content_i) === 0
					? head.start(content_i)
					: head.posAtIndex(head.index(content_i), content_i);
			const toberemoved_endcontent = head.end(content_i);

			const tobeadded_start = head.posAtIndex(head.index(parent_content_i) + 1, parent_content_i);

			const paragraph_i = direct_parent_depth(head, 'paragraph');
			const paragraph = head.node(paragraph_i);

			const toberemoved_content_tobeadded = head
				.node(content_i)
				.children.slice(head.index(content_i) + 1);

			let tobeadded_subcontent =
				paragraph.childCount === 1 && toberemoved_content_tobeadded.length === 0
					? null
					: (paragraph.maybeChild(1)?.children || []).concat(toberemoved_content_tobeadded);

			if (dispatch) {
				let tr = state.tr;

				tr = tr.delete(toberemoved_startcontent - 1, toberemoved_endcontent + 1);
				tr.doc.check();

				const insert_i = tr.mapping.map(tobeadded_start);

				tr = tr.insert(
					insert_i,
					schema.nodes.paragraph.create(
						undefined,
						tobeadded_subcontent == null
							? [paragraph.child(0)]
							: [paragraph.child(0), schema.nodes.content.create(undefined, tobeadded_subcontent)]
					)
				);
				tr.doc.check();

				let rebuild_selection_head = insert_i;
				rebuild_selection_head += 2; // Enter paragraph and line
				rebuild_selection_head += head.parentOffset;
				tr = tr.setSelection(Selection.near(tr.doc.resolve(rebuild_selection_head)));
				dispatch(tr);
				return true;
			}
			return true;
		},
		'Ctrl-Shift-ArrowRight': (state, dispatch) => {
			const head = state.selection.$head;
			const content_i = direct_parent_depth(head, 'content');
			const paragraph_i = direct_parent_depth(head, 'paragraph');

			const paragraph_index = head.index(content_i);
			// Can't indent first paragraph of each sub paragraph
			if (paragraph_index === 0) return true;

			const previous_sibling = head.posAtIndex(paragraph_index - 1, content_i) + 1;

			const start = state.doc.resolve(previous_sibling).start();

			const prev_paragraph = state.doc.resolve(previous_sibling).node();
			const paragraph = head.node(paragraph_i);
			if (dispatch) {
				let tr = state.tr;
				tr = tr.replaceRangeWith(
					start - 1,
					head.end(paragraph_i) + 1,
					schema.nodes.paragraph.create(undefined, [
						prev_paragraph.child(0),
						schema.nodes.content.create(
							undefined,
							(prev_paragraph.maybeChild(1)?.children || []).concat(paragraph)
						)
					])
				);

				let rebuild_selection_head = tr.doc.resolve(start).posAtIndex(1); // Before paragraph content
				rebuild_selection_head += 1; // Enter content
				rebuild_selection_head = tr.doc
					.resolve(rebuild_selection_head)
					.posAtIndex(tr.doc.resolve(rebuild_selection_head).node().childCount - 1);
				rebuild_selection_head += 2; // Enter content paragraph and line
				rebuild_selection_head += head.parentOffset;
				tr = tr.setSelection(Selection.near(tr.doc.resolve(rebuild_selection_head)));
				tr.doc.check();
				dispatch(tr);
				return true;
			}
			return true;
		}
	};

	export const plugins: Plugin[] = [
		// Paragraph keymap
		new Plugin({
			...keymap(keymap_definition),
			key: new PluginKey('ParagraphKeymap')
		})
	];
</script>

<script lang="ts">
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';
	import {
		EditorState,
		Plugin,
		PluginKey,
		Selection,
		Transaction,
		type Command
	} from 'prosemirror-state';
	import { nodes, schema } from '$lib/prosemirror-papiee-cnl/schema';
	import { keymap } from 'prosemirror-keymap';
	import Paragraph from './Paragraph.svelte';
	import { type ResolvedPos } from 'prosemirror-model';
	import type { EditorView } from 'prosemirror-view';
	import { get } from 'svelte/store';

	const contentRef = useNodeViewContext('contentRef');
	const node = useNodeViewContext('node');

	let hasChildren = $derived(get(node).childCount === 2);

	let collapsed = $state(false);
</script>

<div class="paragraph" class:hide_content={collapsed}>
	{#if hasChildren}
		<div class="relative select-none" contenteditable="false">
			<button
				class="absolute right-10 rounded-md hover:bg-gray-200"
				onclick={(e) => {
					collapsed = !collapsed;
					e.preventDefault();
				}}
				ondblclick={(e) => {
					e.preventDefault();
				}}
			>
				<div class="flex h-10 w-10 flex-col items-center justify-center">
					{#if collapsed}
						<svg viewBox="0 0 16 16" class="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier">
								<path d="M0 10L8 2L16 10V12H0V10Z" fill="#000000"></path>
							</g></svg
						>
					{:else}
						<svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg"
							><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
								id="SVGRepo_tracerCarrier"
								stroke-linecap="round"
								stroke-linejoin="round"
							></g><g id="SVGRepo_iconCarrier">
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M7.00003 8.5C6.59557 8.5 6.23093 8.74364 6.07615 9.11732C5.92137 9.49099 6.00692 9.92111 6.29292 10.2071L11.2929 15.2071C11.6834 15.5976 12.3166 15.5976 12.7071 15.2071L17.7071 10.2071C17.9931 9.92111 18.0787 9.49099 17.9239 9.11732C17.7691 8.74364 17.4045 8.5 17 8.5H7.00003Z"
									fill="#000000"
								></path>
							</g></svg
						>
					{/if}
				</div>
			</button>
		</div>
	{/if}
	<div use:contentRef></div>
</div>

<style>
	:global(.paragraph.hide_content div[data-node-view-content='true'] *:has(.paragraph-content)) {
		display: none;
	}
</style>
