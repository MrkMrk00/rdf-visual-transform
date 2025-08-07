import { Transformation, useTransformationsStore } from '@/stores/transformations';
import { lazy, Suspense, useMemo, useRef } from 'react';
import type { EditorHandle } from '../SparqlEditor';

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

    const editorRef = useRef<EditorHandle>(undefined);

    return (
        <form onSubmit={(ev) => ev.preventDefault()}>
            {transformation?.meta.patternName === 'custom' && (
                <Suspense fallback={<div className="w-full h-full"></div>}>
                    <SparqlEditor ref={editorRef} width="100%" height="100%" />
                </Suspense>
            )}
        </form>
    );
}
