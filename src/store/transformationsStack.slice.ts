import { GraphDiff } from '@/util/transformations/GraphTransformer';
import { StateCreator } from 'zustand';
import { Transformation } from './transformations';

export type PerformedTransformation = {
    id: Transformation['id'] | undefined;
    diff: GraphDiff;
};

export type TransformationsStackSlice = {
    transformationsStack: PerformedTransformation[];

    pushTransformation: (id: PerformedTransformation['id'], diff: GraphDiff) => void;
    popTransformation: () => GraphDiff | undefined;
};

export const createTransformationsStack: StateCreator<TransformationsStackSlice> = (set, get) => ({
    transformationsStack: [],

    pushTransformation: (id, diff) => {
        if (diff.deleted.length === 0 && diff.inserted.length === 0) {
            return;
        }

        set((prev) => ({
            transformationsStack: [...prev.transformationsStack, { id, diff }],
        }));
    },
    popTransformation: () => {
        const lastIndex = get().transformationsStack.length - 1;
        const top = get().transformationsStack.at(lastIndex);
        if (!top) {
            return undefined;
        }

        set((prev) => ({
            transformationsStack: prev.transformationsStack.filter((_, index) => index !== lastIndex),
        }));

        return top.diff;
    },
});
