import { useFormChangeset } from '@/hooks/useFormChangeset';
import * as templates from '@/sparql-templates';
import { Transformation, useTransformationsStore } from '@/store/transformations';
import { lazy, Suspense, useCallback, useMemo, useRef } from 'react';
import type { EditorHandle } from '../SparqlEditor';
import { Button } from '../ui/button';
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
    const { fields, subtemplateNames, transformation } = usePickTransformation(props.transformationId, props.onError);
    const patchTransformation = useTransformationsStore((store) => store.patchTransformation);

    const { formRef } = useFormChangeset(
        useCallback(
            (values) => {
                if (!props.transformationId) {
                    return;
                }

                patchTransformation(props.transformationId, (transformation) => {
                    const newParameterEntries = Object.entries({ ...transformation.parameters, ...values });

                    transformation.parameters = Object.fromEntries(
                        newParameterEntries.filter(([, value]) => typeof value !== 'undefined'),
                    ) as Record<string, string>;
                });
            },
            [patchTransformation, props.transformationId],
        ),
    );

    const editorRef = useRef<EditorHandle>(undefined);

    return (
        <form className="flex flex-col gap-2" ref={formRef}>
            {transformation?.patternName === 'custom' && (
                <Suspense fallback={<div className="w-full h-full"></div>}>
                    <SparqlEditor ref={editorRef} width="100%" height="100%" />
                </Suspense>
            )}

            {fields.map((name) => (
                <label key={`form-field-input-${name}`}>
                    <code>{name}</code>
                    <Input
                        placeholder={name}
                        name={name}
                        defaultValue={transformation?.parameters[name] ?? undefined}
                    />
                </label>
            ))}
            <hr />
            <h3 className="font-bold text-lg">Subtemplates</h3>
            {subtemplateNames.map((subtemplName) => (
                <label className="flex items-center gap-2" key={`subtempl-name-${subtemplName}`}>
                    {subtemplName}:
                    <Checkbox
                        defaultChecked={`_${subtemplName}` in (transformation?.parameters ?? {})}
                        name={`_${subtemplName}`}
                    />
                </label>
            ))}
            <Button type="submit" variant="success">
                Submit
            </Button>
        </form>
    );
}

function usePickTransformation(
    transformationId: EditTransformationProps['transformationId'],
    onError: EditTransformationProps['onError'],
) {
    const allTransformations = useTransformationsStore((store) => store.transformations);

    const transformation = useMemo(() => {
        if (!transformationId) {
            return undefined;
        }

        const tf = allTransformations.find((it) => it.id === transformationId);

        if (!tf) {
            onError(`Transformation with id ${transformationId} not found`);
        }

        return tf;
    }, [transformationId, allTransformations, onError]);

    const subtemplates = useMemo(() => {
        if (!transformation || transformation.patternName === 'custom') {
            return [];
        }

        return templates[transformation.patternName]();
    }, [transformation]);

    const subtemplateNames = useMemo(() => {
        return subtemplates.map(({ header }) => (header as { name: string }).name);
    }, [subtemplates]);

    const fields = useMemo(() => {
        const allInputs = subtemplates.flatMap((template) => {
            if (!('inputs' in template.header) || !Array.isArray(template.header.inputs)) {
                return [];
            }

            return (template.header.inputs ?? []) as { name: string }[];
        });

        return Array.from(new Set(allInputs.map((input) => input.name)));
    }, [subtemplates]);

    return {
        transformation,
        subtemplateNames,
        fields,
    };
}
