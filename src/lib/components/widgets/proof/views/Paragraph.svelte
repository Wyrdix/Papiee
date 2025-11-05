<script lang="ts" module>
	export const ParagraphNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Paragraph,
			as: 'div',
			contentAs: 'p'
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
	export const plugins: Plugin[] = [
		// Paragraph keymap
		new Plugin({
			...keymap({
				Enter: (state, dispatch, view) => {
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
				'Ctrl-Shift-ArrowLeft': (state, dispatch, view) => {
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

					const tobeadded_start = head.posAtIndex(
						head.index(parent_content_i) + 1,
						parent_content_i
					);

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
									: [
											paragraph.child(0),
											schema.nodes.content.create(undefined, tobeadded_subcontent)
										]
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
				'Ctrl-Shift-ArrowRight': (state, dispatch, view) => {
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
			}),
			key: new PluginKey('ParagraphKeymap')
		})
	];
</script>

<script lang="ts">
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';
	import { Plugin, PluginKey, Selection } from 'prosemirror-state';
	import { nodes, schema } from '$lib/prosemirror-papiee-cnl/schema';
	import { keymap } from 'prosemirror-keymap';
	import Paragraph from './Paragraph.svelte';
	import { type ResolvedPos } from 'prosemirror-model';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div use:contentRef></div>
