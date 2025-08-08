import * as templates from '@/sparql-templates';
import { Transformation, useTransformationsStore } from '@/stores/transformations';
import { lazy, Suspense, useMemo, useRef } from 'react';
import type { EditorHandle } from '../SparqlEditor';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';

const SparqlEditor = lazy(() =>
    import('@/components/SparqlEditor').then((module) => ({
        default: module.SparqlEditor,
    })),
);

export type EditTransformationProps = {
    transformationId?: string;
    onError: (message: string, ev?: Event) => void;
    onSubmit?: (transformation: Transformation) => void;
};

export function EditTransformation(props: EditTransformationProps) {
    const allTransformations = useTransformationsStore((store) => store.transformations);

    const transformation = useMemo(() => {
        if (!props.transformationId) {
            return undefined;
        }

        const tf = allTransformations.find((it) => it.id === props.transformationId);

        if (!tf) {
            props.onError(`Transformation with id ${props.transformationId} not found`);
        }

        return tf;
    }, [props, allTransformations]);

    const subtemplates = useMemo(() => {
        if (!transformation || transformation.patternName === 'custom') {
            return [];
        }

        return templates[transformation.patternName]();
    }, [transformation]);

    const subtemplateNames = useMemo(() => {
        return subtemplates.map(({ header }) => (header as { name: string }).name);
    }, [subtemplates]);

    const editorRef = useRef<EditorHandle>(undefined);

    const fields = useMemo(() => {
        const allInputs = subtemplates.flatMap((template) => {
            if (!('inputs' in template.header) || !Array.isArray(template.header.inputs)) {
                return [];
            }

            return (template.header.inputs ?? []) as { name: string }[];
        });

        return Array.from(new Set(allInputs.map((input) => input.name)));
    }, [subtemplates]);

    return (
        <form onSubmit={(ev) => ev.preventDefault()}>
            {transformation?.patternName === 'custom' && (
                <Suspense fallback={<div className="w-full h-full"></div>}>
                    <SparqlEditor ref={editorRef} width="100%" height="100%" />
                </Suspense>
            )}

            {fields.map((name) => (
                <Input
                    key={`form-field-input-${name}`}
                    placeholder={name}
                    name={name}
                    defaultValue={transformation?.parameters[name] ?? undefined}
                />
            ))}
            <hr />
            {subtemplateNames.map((subtemplName) => (
                <label className="flex items-center gap-2" key={`subtempl-name-${subtemplName}`}>
                    {subtemplName}:
                    <Checkbox
                        defaultChecked={`_${subtemplName}` in (transformation?.parameters ?? {})}
                        name={`_${subtemplName}`}
                    />
                </label>
            ))}
        </form>
    );
}
