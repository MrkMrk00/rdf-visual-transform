import { Transformation } from '@/stores/transformations';
import { ulid } from 'ulid';
import { ANONYMOUS_IRI, ANONYMOUS_NARY_IRI } from '../graph/backpatching';

type Parameters = Transformation['parameters'];

function renameParameters(parametersIn: Parameters, renameMap: Record<string, string>): Parameters {
    return Object.fromEntries(
        Object.entries(parametersIn).map(([key, value]) => {
            const newName = renameMap[key];

            if (typeof newName === 'undefined') {
                return [key, value];
            }

            return [newName, value];
        }),
    );
}

function sparqlQuote(iri: string) {
    return `<${iri}>`;
}

export function resolveInverseTransformation(transformation: Transformation): Transformation | undefined {
    switch (transformation.patternName) {
        case 'relationshipDereification':
            return {
                id: ulid(),
                name: `inverse-to:${transformation.name}`,
                patternName: 'relationshipReification',
                priority: transformation.priority,
                parameters: <Parameters>{
                    newSubject: sparqlQuote(ANONYMOUS_IRI),
                    ...renameParameters(transformation.parameters, {
                        result: 'shortcut',
                    }),
                },
            } as Transformation<'relationshipReification'>;

        case 'linkCountingProperty':
            return {
                id: ulid(),
                name: `inverse-to:${transformation.name}`,
                patternName: 'linkMultiplyingProperty',
                priority: transformation.priority,
                parameters: <Parameters>{
                    placeholderObject: sparqlQuote(ANONYMOUS_NARY_IRI),
                    ...renameParameters(transformation.parameters, {
                        newProperty: 'countingProperty',
                    }),
                },
            } as Transformation<'linkMultiplyingProperty'>;

        default:
            return undefined;
    }
}
