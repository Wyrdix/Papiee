<script lang="ts">
	import { MATHLIVE_PLUGINS } from '$lib/prosemirror-papiee-cnl/plugins';
	import { schema, nodes } from '$lib/prosemirror-papiee-cnl/schema';
	import { useNodeViewFactory } from '@prosemirror-adapter/svelte';
	import { EditorState, Plugin, PluginKey, Selection } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { ParagraphNodeView } from './views/Paragraph.svelte';
	import type { Node, ResolvedPos } from 'prosemirror-model';
	import { unparse } from '$lib/cnl/parser';
	import { DocNodeView } from './views/Doc.svelte';
	import { LineNodeView } from './views/Line.svelte';
	import { ContentNodeView } from './views/Content.svelte';
	import { keymap } from 'prosemirror-keymap';

	let { node = $bindable() }: { node?: Node } = $props();

	const nodeViewFactory = useNodeViewFactory();

	function direct_parent_depth(
		pos: ResolvedPos,
		name: keyof typeof nodes,
		ignore: number = 0
	): number {
		let i = pos.depth + 1;
		for (; i >= 0; i--) if (pos.node(i)?.type.name === name) if (--ignore < 0) break;
		return i;
	}

	const editor = (element: HTMLElement) => {
		const editor_state = EditorState.create({
			schema,
			plugins: [
				MATHLIVE_PLUGINS,
				new Plugin({
					view(view) {
						return {
							update(view, prevState) {
								node = view.state.doc;
							}
						};
					}
				}),
				// Paragraph keymap
				new Plugin({
					...keymap({
						Enter: (state, dispatch, view) => {
							const head = state.selection.$head;
							const content_i = direct_parent_depth(head, 'content');
							const parent_content_i = direct_parent_depth(head, 'content', 1);

							// If at first level we can't reduce the indent
							const paragraph = head.node(direct_parent_depth(head, 'paragraph'));

							const hasChildren = paragraph.childCount > 1;
							if (!hasChildren) {
								const content_end = head.end(content_i + 1);
								if (dispatch) {
									let tr = state.tr;
									tr = state.tr.insert(
										content_end,
										schema.nodes.paragraph.create(undefined, schema.nodes.line.create())
									);

									tr = tr.setSelection(Selection.near(tr.doc.resolve(tr.mapping.map(content_end))));
									dispatch(tr);
									return true;
								}
							} else {
								if (dispatch) {
									let tr = state.tr;

									tr = tr.replaceRangeWith(
										head.start(direct_parent_depth(head, 'paragraph')) - 1,
										head.end(direct_parent_depth(head, 'paragraph')) + 1,
										schema.nodes.paragraph.create(undefined, [
											paragraph.child(0),
											schema.nodes.content.create(undefined, [
												schema.nodes.paragraph.create(undefined, schema.nodes.line.create()),
												...paragraph.child(1).children
											])
										])
									);
									tr.doc.check();

									let rebuild_selection_head = head.after(
										direct_parent_depth(head, 'paragraph') + 1
									);
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
							const prev_paragraph = state.doc.resolve(previous_sibling).node();
							const paragraph = head.node(paragraph_i);
							if (dispatch) {
								let tr = state.tr;
								tr = tr.replaceRangeWith(
									previous_sibling - 1,
									head.end(paragraph_i) + 1,
									schema.nodes.paragraph.create(undefined, [
										prev_paragraph.child(0),
										schema.nodes.content.create(
											undefined,
											(prev_paragraph.maybeChild(1)?.children || []).concat(paragraph)
										)
									])
								);

								let rebuild_selection_head = tr.doc.resolve(previous_sibling + 1).after(); // Before paragraph content
								rebuild_selection_head += 3; // Enter content paragraph and line
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
			].flat(),
			doc: node
		});
		const editorView = new EditorView(element, {
			state: editor_state,
			nodeViews: {
				paragraph: ParagraphNodeView(nodeViewFactory),
				doc: DocNodeView(nodeViewFactory),
				line: LineNodeView(nodeViewFactory),
				content: ContentNodeView(nodeViewFactory)
			}
		});

		$effect(() => {
			// if (node && unparse(node) !== unparse(editorView.state.doc)) {
			// 	editorView.dispatch(
			// 		editorView.state.tr.replaceRangeWith(0, editorView.state.doc.content.size - 1, node)
			// 	);
			// }
		});
	};
</script>

<div use:editor></div>

<style>
	:global(.ProseMirror:focus) {
		outline: none;
	}
</style>
