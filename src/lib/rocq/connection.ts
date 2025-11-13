import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-jsonrpc/browser';
import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';

import * as raw from '$lib/../../rocq/rocq.json';

const rocqDumpFile = raw as RocqDumpFile;

type RocqDumpFile = {
	files: { [filename in string]: string };
};

export async function create(wpath: string): Promise<proto.MessageConnection> {
	let wuri = wpath + '/wasm-bin/wacoq_worker.js';

	let worker = new Worker(wuri);
	worker.postMessage(wpath);

	let reader = new BrowserMessageReader(worker);
	let writer = new BrowserMessageWriter(worker);
	let conn = proto.createMessageConnection(reader, writer);

	conn.listen();
	return conn;
}

export async function initialize(
	connection: proto.MessageConnection,
	params: Partial<proto.InitializeParams> = {}
) {
	let initializeParameters: proto.InitializeParams = {
		...params,
		processId: null,
		rootUri: 'file:///exercise',
		initializationOptions: { eager_diagnostics: true, messages_follow_goal: true },
		trace: 'verbose',
		capabilities: {
			textDocument: {
				publishDiagnostics: {
					relatedInformation: true
				}
			}
		}
	};

	await connection.sendNotification(proto.SetTraceNotification.type, { value: 'verbose' });
	await connection.sendRequest(proto.InitializeRequest.type, initializeParameters);
	await connection.sendNotification(proto.InitializedNotification.type, {});
	await Promise.all(
		Object.keys(rocqDumpFile.files).map(async (path) => {
			const uri = 'file:///exercise/' + path;
			const languageId = 'rocq';
			const version = 1;
			const text = rocqDumpFile.files[path];
			const textDocument = types.TextDocumentItem.create(uri, languageId, version, text);
			const openParams: proto.DidOpenTextDocumentParams = { textDocument };

			await connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams);
		})
	);

	await connection.sendNotification('coq/workspace_update', {
		added: Object.keys(rocqDumpFile.files).map((path) => ({
			uri: `file:///exercise/${path}`
		})),
		removed: []
	});

	await Promise.all(
		Object.keys(rocqDumpFile.files).map(async (path) => {
			const uri = `file:///exercise/${path}`;
			const textDocument = types.TextDocumentItem.create(uri, 'rocq', 1, rocqDumpFile.files[path]);
			const openParams: proto.DidOpenTextDocumentParams = { textDocument };

			await connection.sendRequest('coq/saveVo', openParams);
		})
	);
	return connection;
}

export async function close(connection: proto.MessageConnection) {
	await connection.sendNotification(proto.ExitNotification.type);
	return connection;
}

export const WORKER_CONTEXT = 'worker-connection';
export type RocqWorker = {
	connection: proto.MessageConnection | undefined;
};
