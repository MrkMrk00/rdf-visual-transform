import {
    Transformation,
    useTransformationsStore,
} from '@/stores/transformations';
import { useMemo } from 'react';
import { Input } from '../ui/input';

export type EditTransformationProps = {
    transformationId?: string;
    onError: (message: string, ev?: Event) => void;
    onSubmit?: (transformation: Transformation) => void;
};

export function EditTransformation(props: EditTransformationProps) {
    const allTransformations = useTransformationsStore(
        (store) => store.transformations,
    );

    const transformation = useMemo(() => {
        const tf = allTransformations.find(
            (it) => it.id === props.transformationId,
        );

        if (!tf) {
            props.onError(
                `Transformation with id ${props.transformationId} not found`,
            );
        }

        return tf;
    }, [props, allTransformations]);

    return (
        <form onSubmit={(ev) => ev.preventDefault()}>
            <label>
                <Input />
            </label>
        </form>
    );
}
