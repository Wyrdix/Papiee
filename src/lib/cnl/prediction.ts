import tactic_grammar from './cnl_grammar';
import nearley from 'nearley';

const { Grammar, Parser } = nearley;

export type StringPrediction = { type: 'string'; value: string };
export type ReferencePrediction = { type: 'reference'; value: string };
export type InputPrediction = (StringPrediction | ReferencePrediction)[];
export type Prediction = {
	inputs: InputPrediction;
	completed: boolean;
};

type ParserSnapshot = unknown;

export function predict(
	value: string,
	state: string[] = [],
	max_iter = 32
): InputPrediction[] | undefined {
	const compiled_rules = tactic_grammar(undefined, state);
	const grammar = Grammar.fromCompiled(compiled_rules);
	const parser = new Parser(grammar);

	type _Prediction = Prediction & {
		parser_state: ParserSnapshot;
	};

	try {
		parser.feed(value);
	} catch (e) {
		return undefined;
	}

	// If input stopped inside a reference we close it to be sure to not pursue inside
	const _everything = parser.table[parser.current].states.find((v) =>
		v.rule.name.endsWith('#EVERYTHING')
	);

	const origin = parser.save();
	let predictions: _Prediction[] = [
		{
			parser_state: origin,
			inputs: [],
			completed: parser.results.length !== 0
		}
	];

	try {
		parser.feed([{ type: 'stop_everything' }]);
		predictions.push({
			parser_state: parser.save(),
			inputs: [],
			completed: parser.results.length !== 0
		});
	} catch (_e) {}

	for (let iter = 0; iter < max_iter; iter++) {
		predictions = predictions.flatMap((prediction) => {
			if (prediction.completed) return [prediction];
			parser.restore(prediction.parser_state);

			return parser.table[parser.current].states
				.filter((state) => !state.isComplete)
				.flatMap((state) => {
					const symbol = state.rule.symbols[state.dot];
					// Skip rules where we did not enter inside
					if (typeof symbol === 'string' && 'left' in state && 'right' in state) {
						return [];
					}
					if (typeof symbol === 'object' && 'literal' in symbol) {
						const value = String(symbol.literal);
						parser.restore(prediction.parser_state);
						try {
							parser.feed([{ type: 'stop_everything' }]);
						} catch (_e) {
							parser.restore(prediction.parser_state);
						}
						try {
							parser.feed(value);
						} catch (_e) {
							return [];
						}
						return [
							{
								parser_state: parser.save(),
								inputs: prediction.inputs.concat({ type: 'string', value }),
								completed: parser.results.length !== 0
							} satisfies _Prediction
						];
					}
					// If symbol is everything it can only means we're inside a ref
					if (typeof symbol === 'string' && symbol.endsWith('#EVERYTHING')) {
						const reference_rule = state.rule;
						const reference = reference_rule.name.substring(
							reference_rule.name.indexOf('#REF') + '#REF'.length
						);
						parser.restore(prediction.parser_state);
						parser.feed([{ type: 'stop_everything' }]);
						return [
							{
								parser_state: parser.save(),
								inputs: prediction.inputs.concat({ type: 'reference', value: reference }),
								completed: parser.results.length !== 0
							} satisfies _Prediction
						];
					}

					// Skip rules which create arbitrary long inputs
					if (state.rule.name.endsWith('#EVERYTHING')) return [];

					return [];
				});
		});

		// Concat text inputs
		predictions = predictions.map((prediction) => ({
			...prediction,
			inputs: prediction.inputs.reduce((a: InputPrediction, b) => {
				if (a.length === 0) return [b];
				if (a[a.length - 1].type === 'string' && b.type == 'string')
					return [
						...a.slice(0, a.length - 1),
						{ type: 'string', value: a[a.length - 1].value + b.value }
					];
				return [...a, b];
			}, [])
		}));

		// Filter for duplicates
		predictions = predictions.reduce((predictions: _Prediction[], new_prediction) => {
			if (
				predictions.find((prediction) => {
					const p_inputs = prediction.inputs;
					const np_inputs = new_prediction.inputs;

					return (
						p_inputs.length === np_inputs.length &&
						!p_inputs.find(
							(v, i) => !(np_inputs[i].type === v.type && np_inputs[i].value === v.value)
						)
					);
				})
			)
				return predictions;
			return [...predictions, new_prediction];
		}, []);
	}

	if (predictions.length === 0) {
		parser.restore(origin);
		return parser.results.length === 0 ? undefined : [];
	}

	return predictions.map((v) => v.inputs);
}
