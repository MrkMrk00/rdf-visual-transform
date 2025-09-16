import { Transformation } from '@/stores/transformations';
import { ulid } from 'ulid';
import { ANONYMOUS_IRI } from '../graph/graphology';

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

export function resolveInverseTransformation(transformation: Transformation): Transformation | undefined {
    switch (transformation.patternName) {
        case 'relationshipDereification':
            return {
                id: ulid(),
                name: `inverse-to:${transformation.name}`,
                patternName: 'relationshipReification',
                priority: transformation.priority,
                parameters: <Parameters>{
                    newSubject: ANONYMOUS_IRI,
                    ...renameParameters(transformation.parameters, {
                        result: 'shortcut',
                    }),
                },
            } as Transformation<'relationshipReification'>;

        default:
            return undefined;
    }
}
