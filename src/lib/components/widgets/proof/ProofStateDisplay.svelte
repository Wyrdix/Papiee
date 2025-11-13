<script lang="ts">
	import type { ProofChunk } from '$lib/notebook/widgets/proof/chunk';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import { getContext, untrack } from 'svelte';
	import type { Position } from 'vscode-languageserver-types';
	import * as proto from 'vscode-languageserver-protocol';
	import * as types from 'vscode-languageserver-types';
	import type { GoalAnswer } from '$lib/rocq/type';
	import type { Attachment } from 'svelte/attachments';
	import Draggable from '$lib/components/Draggable.svelte';

	let { chunks, position, hide }: { chunks: ProofChunk[]; position: number; hide?: boolean } =
		$props();

	const code = $derived(
		chunks
			.slice(0, position + 1)
			.filter((v) => v.type === 'tactic')
			.map((v) => v.code)
			.join('')
	);

	const rocq_position: Position = $derived.by(() => {
		const before = chunks
			.slice(0, position + 1)
			.filter((v) => v.type === 'tactic')
			.map((v) => v.code)
			.join('');

		const line_number = before.includes('\n') ? before.split('\n').length - 1 : 0;
		const last_line = before.includes('\n') ? before.substring(before.lastIndexOf('\n')) : before;
		return {
			line: line_number,
			character: last_line.length
		};
	});

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	const connection = $derived(worker.connection);

	let rocq_state: GoalAnswer<string, string> | undefined = $state();
	$effect(() => {
		if (!connection) {
			return undefined;
		}
		chunks;
		rocq_position;
		let uri = 'file:///exercise/main.v';
		let languageId = 'rocq';
		let version = 1;
		let text = 'Lemma test: forall (x: nat), True.\nProof.\n' + code;
		let textDocument = types.TextDocumentItem.create(uri, languageId, version, text);
		let openParams: proto.DidOpenTextDocumentParams = { textDocument };
		connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams).then(() =>
			connection
				.sendRequest('proof/goals', {
					textDocument: { uri, version } satisfies proto.VersionedTextDocumentIdentifier,
					position: {
						character: rocq_position.character,
						line: rocq_position.line + 2
					} satisfies Position,
					pp_format: 'String',
					mode: 'After'
				})
				.then((v) => (rocq_state = v as GoalAnswer<string, string>))
		);
	});

	let draggable: Draggable | undefined = $state(undefined);

	let goals = $derived(rocq_state?.goals);
	let goal = $derived(goals?.goals[0]);

	let hyps = $derived(goal?.hyps);
</script>

<Draggable bind:this={draggable}>
	{#if hide !== true}
		<div class="b-1 rounded-mdtext-nowrap flex h-full w-full flex-col text-black shadow-lg">
			<div class="min-w-20 rounded-t-md border-surface-600-400 bg-surface-600-400">
				<h4 class="mx-auto my-0 w-fit">Goal</h4>
			</div>
			<div class="bg-white p-2">
				<ul>
					{#each hyps as h}
						<li>
							{h.names.join(',')} : {h.ty}
						</li>
					{/each}
				</ul>

				<h4>{goal?.ty}</h4>
			</div>
		</div>
	{/if}
</Draggable>
